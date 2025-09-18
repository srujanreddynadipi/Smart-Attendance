import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db, markAttendanceFunction } from "./config";

// Generate unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Convert to meters
  return distance;
};

// Create attendance session (Teacher)
export const createAttendanceSession = async (teacherId, sessionData) => {
  try {
    if (!teacherId) {
      throw new Error("Teacher ID is required but was undefined or null");
    }

    const sessionId = generateSessionId();
    const location = {
      latitude: parseFloat(sessionData.latitude),
      longitude: parseFloat(sessionData.longitude),
      address: sessionData.address || "Manual Location",
    };

    // Create QR data object with all necessary information
    const qrDataObject = {
      sessionId,
      location,
      subject: sessionData.subject,
      teacherId,
      timestamp: Date.now(),
    };

    const session = {
      sessionId,
      teacherId,
      subject: sessionData.subject,
      location,
      qrData: JSON.stringify(qrDataObject), // QR code contains complete session info as JSON
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      attendeeCount: 0,
      attendees: [],
      // Geofencing fields
      isGeofenced: sessionData.isGeofenced || false,
      locationLatitude: sessionData.isGeofenced
        ? parseFloat(sessionData.latitude)
        : null,
      locationLongitude: sessionData.isGeofenced
        ? parseFloat(sessionData.longitude)
        : null,
      geofenceRadius: sessionData.isGeofenced
        ? sessionData.geofenceRadius
        : null,
    };

    const docRef = await addDoc(collection(db, "attendanceSessions"), session);

    return {
      success: true,
      sessionId,
      docId: docRef.id,
      qrData: JSON.stringify(qrDataObject),
    };
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get active attendance sessions for a teacher
export const getTeacherSessions = async (teacherId) => {
  try {
    // Use only a simple where query to avoid index requirements
    const q = query(
      collection(db, "attendanceSessions"),
      where("teacherId", "==", teacherId)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for active sessions and sort in JavaScript
      if (data.isActive === true) {
        sessions.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort by createdAt in JavaScript (newest first)
    sessions.sort((a, b) => {
      const aTime =
        a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bTime =
        b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bTime - aTime;
    });

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    console.error("Error getting teacher sessions:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get all sessions (active and recent) for a teacher
export const getTeacherAllSessions = async (teacherId, limit = 20) => {
  try {
    const q = query(
      collection(db, "attendanceSessions"),
      where("teacherId", "==", teacherId),
      orderBy("createdAt", "desc"),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
      });
    });

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    console.error("Error getting all teacher sessions:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify location proximity
export const verifyLocationProximity = (
  sessionLocation,
  studentLocation,
  toleranceMeters = 50
) => {
  const distance = calculateDistance(
    sessionLocation.latitude,
    sessionLocation.longitude,
    studentLocation.latitude,
    studentLocation.longitude
  );

  return {
    isValid: distance <= toleranceMeters,
    distance: Math.round(distance),
    tolerance: toleranceMeters,
  };
};

// Verify QR code and get session
export const verifyQRCode = async (qrData) => {
  try {
    // Parse QR data to get session ID
    let sessionId;
    try {
      const parsedData = JSON.parse(qrData);
      sessionId = parsedData.sessionId;
    } catch (parseError) {
      // If parsing fails, assume it's an old format with just session ID
      sessionId = qrData;
    }

    const q = query(
      collection(db, "attendanceSessions"),
      where("sessionId", "==", sessionId),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        error: "Invalid or expired QR code",
      };
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Check if session is still valid (not expired)
    const now = new Date();
    const expiresAt = sessionData.expiresAt.toDate();

    if (now > expiresAt) {
      return {
        success: false,
        error: "QR code has expired",
      };
    }

    return {
      success: true,
      session: {
        id: sessionDoc.id,
        ...sessionData,
      },
    };
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Mark attendance using Cloud Function (with geofencing)
export const markAttendanceSecure = async (
  sessionId,
  studentData,
  verificationData
) => {
  try {
    // Prepare data for Cloud Function
    const functionData = {
      sessionId,
      studentId: studentData.studentId,
      studentLatitude: verificationData.location?.latitude,
      studentLongitude: verificationData.location?.longitude,
    };

    console.log("🚀 Calling Cloud Function with data:", functionData);

    // Call the Cloud Function
    const result = await markAttendanceFunction(functionData);

    console.log("✅ Cloud Function response:", result.data);

    return {
      success: true,
      message: result.data.message,
      recordId: result.data.recordId,
    };
  } catch (error) {
    console.error("❌ Cloud Function error:", error);

    // Extract meaningful error message
    let errorMessage = "Failed to mark attendance. Please try again.";

    if (error.code === "functions/unauthenticated") {
      errorMessage = "You must be signed in to mark attendance.";
    } else if (error.code === "functions/permission-denied") {
      errorMessage = error.message; // This includes the location distance message
    } else if (error.code === "functions/not-found") {
      errorMessage = "Session not found or inactive.";
    } else if (error.code === "functions/already-exists") {
      errorMessage = "Attendance already marked for this session.";
    } else if (error.code === "functions/invalid-argument") {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Mark attendance (after all verifications) - Updated with Geofencing
export const markAttendance = async (
  sessionId,
  studentData,
  verificationData
) => {
  try {
    // Get session document
    const sessionQuery = query(
      collection(db, "attendanceSessions"),
      where("sessionId", "==", sessionId)
    );

    const sessionSnapshot = await getDocs(sessionQuery);

    if (sessionSnapshot.empty) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    const sessionDoc = sessionSnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Check if session is geofenced and validate location
    if (sessionData.isGeofenced) {
      console.log("🌐 Validating geofence for session:", sessionId);

      // Ensure student location is provided
      if (
        !verificationData.location ||
        !verificationData.location.latitude ||
        !verificationData.location.longitude
      ) {
        return {
          success: false,
          error:
            "Location is required for this attendance session. Please enable location services and try again.",
        };
      }

      // Calculate distance between student and session location
      const distance = calculateDistance(
        sessionData.locationLatitude,
        sessionData.locationLongitude,
        verificationData.location.latitude,
        verificationData.location.longitude
      );

      console.log("📍 Distance calculated:", {
        distance: Math.round(distance),
        allowedRadius: sessionData.geofenceRadius,
        studentLocation: verificationData.location,
        sessionLocation: {
          lat: sessionData.locationLatitude,
          lng: sessionData.locationLongitude,
        },
      });

      // Check if student is within the allowed radius
      if (distance > sessionData.geofenceRadius) {
        return {
          success: false,
          error: `You are not within the allowed location to mark attendance. You are ${Math.round(
            distance
          )}m away, but need to be within ${
            sessionData.geofenceRadius
          }m of the session location.`,
        };
      }
    }

    // Check if student already marked attendance
    const existingAttendee = sessionData.attendees?.find(
      (attendee) => attendee.studentId === studentData.studentId
    );

    if (existingAttendee) {
      return {
        success: false,
        error: "Attendance already marked for this session",
      };
    }

    // Create attendance record
    const attendanceRecord = {
      sessionId,
      studentId: studentData.studentId,
      studentName: studentData.name,
      studentEmail: studentData.email,
      markedAt: serverTimestamp(),
      location: verificationData.location,
      locationVerified: verificationData.locationVerified,
      qrVerified: verificationData.qrVerified,
      faceVerified: verificationData.faceVerified,
      status: "present",
    };

    console.log("💾 Creating attendance record:", attendanceRecord);

    // Add to attendance records collection
    const docRef = await addDoc(
      collection(db, "attendanceRecords"),
      attendanceRecord
    );
    console.log("✅ Attendance record saved with ID:", docRef.id);

    // Update session with new attendee
    await updateDoc(doc(db, "attendanceSessions", sessionDoc.id), {
      attendees: arrayUnion({
        studentId: studentData.studentId,
        studentName: studentData.name,
        markedAt: new Date(),
        location: verificationData.location,
      }),
      attendeeCount: (sessionData.attendeeCount || 0) + 1,
    });

    console.log("✅ Session updated with new attendee");

    return {
      success: true,
      message: "Attendance marked successfully!",
      recordId: docRef.id,
    };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// End attendance session (Teacher)
export const endAttendanceSession = async (sessionId) => {
  try {
    const q = query(
      collection(db, "attendanceSessions"),
      where("sessionId", "==", sessionId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const sessionDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "attendanceSessions", sessionDoc.id), {
        isActive: false,
        endedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      message: "Session ended successfully",
    };
  } catch (error) {
    console.error("Error ending session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get attendance records for a session
export const getSessionAttendance = async (sessionId) => {
  try {
    console.log("🔍 Getting attendance for sessionId:", sessionId);

    const q = query(
      collection(db, "attendanceRecords"),
      where("sessionId", "==", sessionId)
    );

    const querySnapshot = await getDocs(q);
    const records = [];

    console.log("📊 Found", querySnapshot.size, "attendance records");

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📝 Attendance record:", data);
      records.push({
        id: doc.id,
        ...data,
      });
    });

    // Sort records by markedAt in JavaScript instead of Firestore
    records.sort((a, b) => {
      const aTime = a.markedAt?.toDate?.() || new Date(a.markedAt);
      const bTime = b.markedAt?.toDate?.() || new Date(b.markedAt);
      return bTime - aTime; // Descending order (newest first)
    });

    console.log("✅ Returning", records.length, "sorted attendance records");

    return {
      success: true,
      records,
    };
  } catch (error) {
    console.error("❌ Error getting session attendance:", error);
    return {
      success: false,
      error: error.message,
      records: [],
    };
  }
};

// Get student's attendance history
export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(
      collection(db, "attendanceRecords"),
      where("studentId", "==", studentId),
      orderBy("markedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const records = [];

    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      records,
    };
  } catch (error) {
    console.error("Error getting student attendance:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get student's recent attendance with subject details
export const getStudentRecentAttendance = async (studentId, limit = 5) => {
  try {
    const q = query(
      collection(db, "attendanceRecords"),
      where("studentId", "==", studentId),
      orderBy("markedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const records = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        subject: data.subject || "Unknown Subject",
        date: data.markedAt?.toDate?.() || new Date(data.markedAt),
        time:
          data.markedAt?.toDate?.()?.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }) ||
          new Date(data.markedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        status: data.status || "Present",
        sessionData: data.sessionData,
      });
    });

    return {
      success: true,
      records: records.slice(0, limit),
    };
  } catch (error) {
    console.error("Error getting student recent attendance:", error);
    return {
      success: false,
      error: error.message,
      records: [],
    };
  }
};

// Get student's subject performance/grades
export const getStudentSubjectPerformance = async (studentId) => {
  try {
    // First get attendance records to calculate attendance percentage per subject
    const attendanceQuery = query(
      collection(db, "attendanceRecords"),
      where("studentId", "==", studentId)
    );

    const attendanceSnapshot = await getDocs(attendanceQuery);
    const subjectStats = {};

    // Calculate attendance stats per subject
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      const subject = data.subject || "Unknown Subject";

      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }

      subjectStats[subject].total++;
      if (data.status === "Present") {
        subjectStats[subject].present++;
      } else if (data.status === "Absent") {
        subjectStats[subject].absent++;
      } else if (data.status === "Late") {
        subjectStats[subject].late++;
      }
    });

    // Try to get grades from a separate grades collection
    const gradesQuery = query(
      collection(db, "studentGrades"),
      where("studentId", "==", studentId)
    );

    const gradesSnapshot = await getDocs(gradesQuery);
    const grades = {};

    gradesSnapshot.forEach((doc) => {
      const data = doc.data();
      grades[data.subject] = {
        grade: data.grade,
        percentage: data.percentage,
        lastUpdated: data.lastUpdated,
      };
    });

    // Combine attendance and grades data
    const performanceData = [];

    Object.keys(subjectStats).forEach((subject) => {
      const stats = subjectStats[subject];
      const attendancePercentage = Math.round(
        (stats.present / stats.total) * 100
      );

      // Get grade info if available, otherwise use attendance-based performance
      const gradeInfo = grades[subject];
      let performanceGrade = "B"; // Default grade
      let performancePercentage = attendancePercentage;

      if (gradeInfo) {
        performanceGrade = gradeInfo.grade;
        performancePercentage = gradeInfo.percentage;
      } else {
        // Calculate grade based on attendance
        if (attendancePercentage >= 90) performanceGrade = "A+";
        else if (attendancePercentage >= 85) performanceGrade = "A";
        else if (attendancePercentage >= 80) performanceGrade = "B+";
        else if (attendancePercentage >= 75) performanceGrade = "B";
        else if (attendancePercentage >= 70) performanceGrade = "C";
        else performanceGrade = "D";
      }

      performanceData.push({
        subject: subject,
        attendancePercentage: attendancePercentage,
        performancePercentage: performancePercentage,
        grade: performanceGrade,
        totalClasses: stats.total,
        attendedClasses: stats.present,
        absentClasses: stats.absent,
        lateClasses: stats.late,
      });
    });

    return {
      success: true,
      performance: performanceData,
    };
  } catch (error) {
    console.error("Error getting student subject performance:", error);
    return {
      success: false,
      error: error.message,
      performance: [],
    };
  }
};

// Get student dashboard data (combines recent attendance and performance)
export const getStudentDashboardData = async (studentId) => {
  try {
    const [attendanceResult, performanceResult] = await Promise.all([
      getStudentRecentAttendance(studentId, 5),
      getStudentSubjectPerformance(studentId),
    ]);

    return {
      success: true,
      recentAttendance: attendanceResult.records || [],
      subjectPerformance: performanceResult.performance || [],
      error: null,
    };
  } catch (error) {
    console.error("Error getting student dashboard data:", error);
    return {
      success: false,
      recentAttendance: [],
      subjectPerformance: [],
      error: error.message,
    };
  }
};

// Add sample attendance data for testing (remove in production)
export const addSampleAttendanceData = async (studentId) => {
  try {
    const sampleData = [
      {
        studentId: studentId,
        subject: "Data Structures",
        status: "Present",
        markedAt: new Date("2024-09-12T09:15:00"),
        sessionData: { subject: "Data Structures", location: "Room 101" },
      },
      {
        studentId: studentId,
        subject: "Web Development",
        status: "Present",
        markedAt: new Date("2024-09-11T10:30:00"),
        sessionData: { subject: "Web Development", location: "Lab 201" },
      },
      {
        studentId: studentId,
        subject: "Database Systems",
        status: "Late",
        markedAt: new Date("2024-09-10T09:45:00"),
        sessionData: { subject: "Database Systems", location: "Room 301" },
      },
      {
        studentId: studentId,
        subject: "Software Engineering",
        status: "Present",
        markedAt: new Date("2024-09-09T11:15:00"),
        sessionData: { subject: "Software Engineering", location: "Room 102" },
      },
      {
        studentId: studentId,
        subject: "Machine Learning",
        status: "Absent",
        markedAt: new Date("2024-09-08T10:00:00"),
        sessionData: { subject: "Machine Learning", location: "Lab 301" },
      },
    ];

    for (const record of sampleData) {
      await addDoc(collection(db, "attendanceRecords"), record);
    }

    return { success: true, message: "Sample data added successfully" };
  } catch (error) {
    console.error("Error adding sample data:", error);
    return { success: false, error: error.message };
  }
};

// Add sample grades data for testing (remove in production)
export const addSampleGradesData = async (studentId) => {
  try {
    const sampleGrades = [
      {
        studentId: studentId,
        subject: "Data Structures",
        grade: "A",
        percentage: 85,
        lastUpdated: new Date(),
      },
      {
        studentId: studentId,
        subject: "Web Development",
        grade: "A+",
        percentage: 92,
        lastUpdated: new Date(),
      },
      {
        studentId: studentId,
        subject: "Database Systems",
        grade: "B+",
        percentage: 78,
        lastUpdated: new Date(),
      },
      {
        studentId: studentId,
        subject: "Software Engineering",
        grade: "A",
        percentage: 88,
        lastUpdated: new Date(),
      },
      {
        studentId: studentId,
        subject: "Machine Learning",
        grade: "B",
        percentage: 75,
        lastUpdated: new Date(),
      },
    ];

    for (const grade of sampleGrades) {
      await addDoc(collection(db, "studentGrades"), grade);
    }

    return { success: true, message: "Sample grades added successfully" };
  } catch (error) {
    console.error("Error adding sample grades:", error);
    return { success: false, error: error.message };
  }
};
