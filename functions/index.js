const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const haversineDistance = require("haversine-distance");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Helper function to verify teacher ownership of classroom
const verifyTeacherOwnership = async (classroomId, teacherId) => {
  const classroomDoc = await db.collection("classrooms").doc(classroomId).get();

  if (!classroomDoc.exists) {
    throw new HttpsError("not-found", "Classroom not found");
  }

  const classroomData = classroomDoc.data();
  if (classroomData.teacherId !== teacherId) {
    throw new HttpsError(
      "permission-denied",
      "Not authorized to access this classroom"
    );
  }

  return classroomData;
};

/**
 * Cloud Function to mark attendance with geofencing validation
 * @param {Object} data - Function parameters
 * @param {string} data.sessionId - Session ID
 * @param {string} data.studentId - Student ID
 * @param {number} data.studentLatitude - Student's latitude
 * @param {number} data.studentLongitude - Student's longitude
 * @param {Object} context - Function context with auth
 * @return {Promise<Object>} Result object
 */
exports.markAttendance = onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { sessionId, studentId, studentLatitude, studentLongitude } = data;

  // Validate required parameters
  if (!sessionId || !studentId) {
    throw new HttpsError(
      "invalid-argument",
      "sessionId and studentId are required."
    );
  }

  try {
    // Get session document
    const sessionQuery = db
      .collection("attendanceSessions")
      .where("sessionId", "==", sessionId)
      .where("isActive", "==", true)
      .limit(1);

    const sessionSnapshot = await sessionQuery.get();

    if (sessionSnapshot.empty) {
      throw new HttpsError("not-found", "Session not found or inactive.");
    }

    const sessionDoc = sessionSnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Check if session is geofenced
    if (sessionData.isGeofenced) {
      console.log("🌐 Validating geofence for session:", sessionId);

      // Ensure student location is provided
      if (studentLatitude === undefined || studentLongitude === undefined) {
        throw new HttpsError(
          "invalid-argument",
          "Location coordinates are required for this geofenced session."
        );
      }

      // Calculate distance between student and session location
      const teacherLocation = {
        latitude: sessionData.locationLatitude,
        longitude: sessionData.locationLongitude,
      };

      const studentLocation = {
        latitude: studentLatitude,
        longitude: studentLongitude,
      };

      const distance = haversineDistance(teacherLocation, studentLocation);

      console.log("📍 Distance calculated:", {
        distance: Math.round(distance),
        allowedRadius: sessionData.geofenceRadius,
        studentLocation,
        teacherLocation,
      });

      // Check if student is within the allowed radius
      if (distance > sessionData.geofenceRadius) {
        throw new HttpsError(
          "permission-denied",
          `You are not within the allowed location to mark attendance. ` +
            `You are ${Math.round(distance)}m away, but need to be within ` +
            `${sessionData.geofenceRadius}m of the session location.`
        );
      }
    }

    // Check if student already marked attendance
    const existingAttendee = sessionData.attendees?.find(
      (attendee) => attendee.studentId === studentId
    );

    if (existingAttendee) {
      throw new HttpsError(
        "already-exists",
        "Attendance already marked for this session."
      );
    }

    // Get student information from auth context
    const studentData = {
      studentId,
      studentName: context.auth.token.name || context.auth.token.email,
      studentEmail: context.auth.token.email,
    };

    // Create attendance record
    const attendanceRecord = {
      sessionId,
      studentId: studentData.studentId,
      studentName: studentData.studentName,
      studentEmail: studentData.studentEmail,
      markedAt: FieldValue.serverTimestamp(),
      location: {
        latitude: studentLatitude,
        longitude: studentLongitude,
      },
      locationVerified: sessionData.isGeofenced,
      qrVerified: true,
      faceVerified: false,
      status: "present",
    };

    // Add attendance record to collection
    const attendanceRef = await db
      .collection("attendanceRecords")
      .add(attendanceRecord);

    // Update session with new attendee
    await sessionDoc.ref.update({
      attendees: FieldValue.arrayUnion({
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        markedAt: new Date(),
        location: {
          latitude: studentLatitude,
          longitude: studentLongitude,
        },
      }),
      attendeeCount: FieldValue.increment(1),
    });

    console.log("✅ Attendance marked successfully for:", studentId);

    return {
      success: true,
      message: "Attendance marked successfully!",
      recordId: attendanceRef.id,
    };
  } catch (error) {
    console.error("❌ Error marking attendance:", error);

    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new HttpsError("internal", error.message);
  }
});

// ========================
// GRADEBOOK CLOUD FUNCTIONS
// ========================

/**
 * Create a new assessment for a classroom
 */
exports.createAssessment = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, name, type, totalMarks, date, description } = data;

  if (!classroomId || !name || !type || !totalMarks || !date) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required assessment data"
    );
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    const assessmentData = {
      name,
      type: type.toUpperCase(),
      totalMarks: parseInt(totalMarks),
      date: new Date(date),
      description: description || "",
      isPublished: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    };

    const docRef = await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("assessments")
      .add(assessmentData);

    console.log("✅ Assessment created:", docRef.id);
    return { success: true, assessmentId: docRef.id };
  } catch (error) {
    console.error("❌ Error creating assessment:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Update an existing assessment
 */
exports.updateAssessment = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, assessmentId, updates } = data;

  if (!classroomId || !assessmentId || !updates) {
    throw new HttpsError("invalid-argument", "Missing required data");
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    const updateData = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updates.totalMarks) {
      updateData.totalMarks = parseInt(updates.totalMarks);
    }

    if (updates.date) {
      updateData.date = new Date(updates.date);
    }

    if (updates.type) {
      updateData.type = updates.type.toUpperCase();
    }

    await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("assessments")
      .doc(assessmentId)
      .update(updateData);

    console.log("✅ Assessment updated:", assessmentId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating assessment:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Delete an assessment
 */
exports.deleteAssessment = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, assessmentId } = data;

  if (!classroomId || !assessmentId) {
    throw new HttpsError("invalid-argument", "Missing required data");
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    // Delete the assessment and all its marks
    const assessmentRef = db
      .collection("classrooms")
      .doc(classroomId)
      .collection("assessments")
      .doc(assessmentId);

    // Delete all marks for this assessment
    const marksSnapshot = await assessmentRef.collection("marks").get();
    const batch = db.batch();

    marksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the assessment
    batch.delete(assessmentRef);
    await batch.commit();

    console.log("✅ Assessment deleted:", assessmentId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting assessment:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Bulk update student marks for multiple students and assessments
 */
exports.updateStudentMarks = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, markUpdates } = data;

  if (!classroomId || !markUpdates || !Array.isArray(markUpdates)) {
    throw new HttpsError("invalid-argument", "Invalid mark updates data");
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    const batch = db.batch();

    for (const update of markUpdates) {
      const { studentId, assessmentId, marksObtained } = update;

      if (!studentId || !assessmentId || marksObtained === undefined) {
        continue; // Skip invalid updates
      }

      const markRef = db
        .collection("classrooms")
        .doc(classroomId)
        .collection("assessments")
        .doc(assessmentId)
        .collection("marks")
        .doc(studentId);

      batch.set(
        markRef,
        {
          studentId,
          marksObtained: parseFloat(marksObtained),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: context.auth.uid,
        },
        { merge: true }
      );
    }

    await batch.commit();

    console.log(`✅ Updated ${markUpdates.length} marks`);
    return { success: true, updatedCount: markUpdates.length };
  } catch (error) {
    console.error("❌ Error updating marks:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Calculate final grade for a student based on weights
 */
exports.calculateStudentGrade = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, studentId } = data;

  if (!classroomId || !studentId) {
    throw new HttpsError("invalid-argument", "Missing required data");
  }

  try {
    // Get grade weights configuration
    const configDoc = await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("configuration")
      .doc("gradeWeights")
      .get();

    const weights = configDoc.exists ? configDoc.data() : {};

    // Get all assessments for the classroom
    const assessmentsSnapshot = await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("assessments")
      .get();

    const assessments = [];
    for (const doc of assessmentsSnapshot.docs) {
      const assessmentData = doc.data();

      // Get student's mark for this assessment
      const markDoc = await db
        .collection("classrooms")
        .doc(classroomId)
        .collection("assessments")
        .doc(doc.id)
        .collection("marks")
        .doc(studentId)
        .get();

      const marksObtained = markDoc.exists ? markDoc.data().marksObtained : 0;

      assessments.push({
        id: doc.id,
        ...assessmentData,
        marksObtained,
        percentage: (marksObtained / assessmentData.totalMarks) * 100,
      });
    }

    // Calculate weighted grade
    let totalWeight = 0;
    let weightedScore = 0;

    const typeGroups = {};
    assessments.forEach((assessment) => {
      if (!typeGroups[assessment.type]) {
        typeGroups[assessment.type] = [];
      }
      typeGroups[assessment.type].push(assessment);
    });

    Object.keys(typeGroups).forEach((type) => {
      const weight = weights[type] || 0;
      if (weight > 0) {
        const typeAssessments = typeGroups[type];
        const avgPercentage =
          typeAssessments.reduce((sum, a) => sum + a.percentage, 0) /
          typeAssessments.length;

        totalWeight += weight;
        weightedScore += (avgPercentage * weight) / 100;
      }
    });

    const finalGrade =
      totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

    return {
      success: true,
      finalGrade: Math.round(finalGrade * 100) / 100,
      assessments,
      weights,
    };
  } catch (error) {
    console.error("❌ Error calculating grade:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Publish marks for an assessment (make visible to students)
 */
exports.publishAssessmentMarks = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, assessmentId, publish = true } = data;

  if (!classroomId || !assessmentId) {
    throw new HttpsError("invalid-argument", "Missing required data");
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("assessments")
      .doc(assessmentId)
      .update({
        isPublished: publish,
        publishedAt: publish ? FieldValue.serverTimestamp() : null,
        publishedBy: publish ? context.auth.uid : null,
      });

    console.log(
      `✅ Assessment ${publish ? "published" : "unpublished"}:`,
      assessmentId
    );
    return { success: true };
  } catch (error) {
    console.error("❌ Error publishing assessment:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Configure grade weights for a classroom
 */
exports.configureGradeWeights = onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { classroomId, weights } = data;

  if (!classroomId || !weights || typeof weights !== "object") {
    throw new HttpsError("invalid-argument", "Invalid weights configuration");
  }

  // Validate weights sum to 100
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + (parseFloat(weight) || 0),
    0
  );
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new HttpsError("invalid-argument", "Weights must sum to 100%");
  }

  try {
    // Verify teacher ownership
    await verifyTeacherOwnership(classroomId, context.auth.uid);

    await db
      .collection("classrooms")
      .doc(classroomId)
      .collection("configuration")
      .doc("gradeWeights")
      .set({
        ...weights,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid,
      });

    console.log("✅ Grade weights configured for classroom:", classroomId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error configuring weights:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});
