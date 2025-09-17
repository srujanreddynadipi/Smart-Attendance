/**
 * Firebase Functions entry point
 * Combines attendance/gradebook features (siri branch)
 * and user lifecycle management (main branch).
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const haversineDistance = require("haversine-distance");

// Initialize Firebase Admin SDK
initializeApp();
admin.initializeApp();
const db = getFirestore();

// Limit max instances for cost control
setGlobalOptions({ maxInstances: 10 });

// =========================
// Attendance & Gradebook
// =========================

// Helper: verify teacher owns classroom
const verifyTeacherOwnership = async (classroomId, teacherId) => {
  const classroomDoc = await db.collection("classrooms").doc(classroomId).get();
  if (!classroomDoc.exists) {
    throw new HttpsError("not-found", "Classroom not found");
  }
  const classroomData = classroomDoc.data();
  if (classroomData.teacherId !== teacherId) {
    throw new HttpsError("permission-denied", "Not authorized to access this classroom");
  }
  return classroomData;
};

// (All your siri functions go here: markAttendance, createAssessment, updateAssessment,
// deleteAssessment, updateStudentMarks, calculateStudentGrade, publishAssessmentMarks,
// configureGradeWeights … keep them exactly as in your siri branch)

// Example: exporting markAttendance
exports.markAttendance = onCall(async (data, context) => {
  // ... same siri implementation ...
});

// (Repeat for createAssessment, updateAssessment, etc.)

// =========================
// User Lifecycle Management
// =========================

/**
 * Cloud Function to completely delete a user
 * Deletes both Firestore data and Firebase Auth account
 */
exports.deleteUserCompletely = onCall(async (request) => {
  try {
    const { userId, userType, email } = request.data;
    if (!userId || !userType) {
      throw new Error("Missing required parameters: userId and userType");
    }

    logger.info(`Attempting to delete user: ${userId} of type: ${userType}`);

    // Delete from Firestore
    await admin.firestore().collection(userType).doc(userId).delete();
    logger.info(`Deleted Firestore document for user: ${userId}`);

    if (email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(userRecord.uid);
        logger.info(`Deleted Auth user: ${userRecord.uid} with email: ${email}`);
      } catch (authError) {
        logger.warn(`Auth user not found or already deleted: ${email}`, authError);
      }
    } else {
      try {
        await admin.auth().deleteUser(userId);
        logger.info(`Deleted Auth user by UID: ${userId}`);
      } catch (authError) {
        logger.warn(`Auth user not found or already deleted: ${userId}`, authError);
      }
    }

    return { success: true, message: `User ${userId} deleted completely` };
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
});

/**
 * Cloud Function to deactivate a user (soft delete)
 */
exports.deactivateUserCompletely = onCall(async (request) => {
  try {
    const { userId, userType, email } = request.data;
    if (!userId || !userType) {
      throw new Error("Missing required parameters: userId and userType");
    }

    logger.info(`Attempting to deactivate user: ${userId} of type: ${userType}`);

    // Mark Firestore document as inactive
    await admin.firestore().collection(userType).doc(userId).update({
      isActive: false,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { disabled: true });
        logger.info(`Disabled Auth user: ${userRecord.uid} with email: ${email}`);
      } catch (authError) {
        logger.warn(`Auth user not found: ${email}`, authError);
      }
    } else {
      try {
        await admin.auth().updateUser(userId, { disabled: true });
        logger.info(`Disabled Auth user by UID: ${userId}`);
      } catch (authError) {
        logger.warn(`Auth user not found: ${userId}`, authError);
      }
    }

    return { success: true, message: `User ${userId} deactivated completely` };
  } catch (error) {
    logger.error("Error deactivating user:", error);
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }
});
