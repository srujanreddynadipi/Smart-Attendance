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
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';
import { db } from './config';

// Generate unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Convert to meters
  return distance;
};

// Create attendance session (Teacher)
export const createAttendanceSession = async (teacherId, sessionData) => {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required but was undefined or null');
    }

    const sessionId = generateSessionId();
    const location = {
      latitude: parseFloat(sessionData.latitude),
      longitude: parseFloat(sessionData.longitude),
      address: sessionData.address || 'Manual Location'
    };

    // Create QR data object with all necessary information
    const qrDataObject = {
      sessionId,
      location,
      subject: sessionData.subject,
      teacherId,
      timestamp: Date.now()
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
      attendees: []
    };

    const docRef = await addDoc(collection(db, 'attendanceSessions'), session);
    
    return {
      success: true,
      sessionId,
      docId: docRef.id,
      qrData: JSON.stringify(qrDataObject)
    };
  } catch (error) {
    console.error('Error creating attendance session:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get active attendance sessions for a teacher
export const getTeacherSessions = async (teacherId) => {
  try {
    // Use only a simple where query to avoid index requirements
    const q = query(
      collection(db, 'attendanceSessions'),
      where('teacherId', '==', teacherId)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for active sessions and sort in JavaScript
      if (data.isActive === true) {
        sessions.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort by createdAt in JavaScript (newest first)
    sessions.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bTime - aTime;
    });
    
    return {
      success: true,
      sessions
    };
  } catch (error) {
    console.error('Error getting teacher sessions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify location proximity
export const verifyLocationProximity = (sessionLocation, studentLocation, toleranceMeters = 50) => {
  const distance = calculateDistance(
    sessionLocation.latitude,
    sessionLocation.longitude,
    studentLocation.latitude,
    studentLocation.longitude
  );
  
  return {
    isValid: distance <= toleranceMeters,
    distance: Math.round(distance),
    tolerance: toleranceMeters
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
      collection(db, 'attendanceSessions'),
      where('sessionId', '==', sessionId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Invalid or expired QR code'
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
        error: 'QR code has expired'
      };
    }
    
    return {
      success: true,
      session: {
        id: sessionDoc.id,
        ...sessionData
      }
    };
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Mark attendance (after all verifications)
export const markAttendance = async (sessionId, studentData, verificationData) => {
  try {
    // Get session document
    const sessionQuery = query(
      collection(db, 'attendanceSessions'),
      where('sessionId', '==', sessionId)
    );
    
    const sessionSnapshot = await getDocs(sessionQuery);
    
    if (sessionSnapshot.empty) {
      return {
        success: false,
        error: 'Session not found'
      };
    }
    
    const sessionDoc = sessionSnapshot.docs[0];
    const sessionData = sessionDoc.data();
    
    // Check if student already marked attendance
    const existingAttendee = sessionData.attendees?.find(
      attendee => attendee.studentId === studentData.studentId
    );
    
    if (existingAttendee) {
      return {
        success: false,
        error: 'Attendance already marked for this session'
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
      status: 'present'
    };
    
    // Add to attendance records collection
    await addDoc(collection(db, 'attendanceRecords'), attendanceRecord);
    
    // Update session with new attendee
    await updateDoc(doc(db, 'attendanceSessions', sessionDoc.id), {
      attendees: arrayUnion({
        studentId: studentData.studentId,
        studentName: studentData.name,
        markedAt: new Date(),
        location: verificationData.location
      }),
      attendeeCount: (sessionData.attendeeCount || 0) + 1
    });
    
    return {
      success: true,
      message: 'Attendance marked successfully!'
    };
  } catch (error) {
    console.error('Error marking attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// End attendance session (Teacher)
export const endAttendanceSession = async (sessionId) => {
  try {
    const q = query(
      collection(db, 'attendanceSessions'),
      where('sessionId', '==', sessionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const sessionDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'attendanceSessions', sessionDoc.id), {
        isActive: false,
        endedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      message: 'Session ended successfully'
    };
  } catch (error) {
    console.error('Error ending session:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance records for a session
export const getSessionAttendance = async (sessionId) => {
  try {
    const q = query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      orderBy('markedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      records
    };
  } catch (error) {
    console.error('Error getting session attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get student's attendance history
export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(
      collection(db, 'attendanceRecords'),
      where('studentId', '==', studentId),
      orderBy('markedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      records
    };
  } catch (error) {
    console.error('Error getting student attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};