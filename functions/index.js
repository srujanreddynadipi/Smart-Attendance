/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

/**
 * Cloud Function to completely delete a user
 * Deletes both Firestore data and Firebase Auth account
 */
exports.deleteUserCompletely = onCall(async (request) => {
  try {
    const {userId, userType, email} = request.data;

    if (!userId || !userType) {
      throw new Error("Missing required parameters: userId and userType");
    }

    logger.info(`Attempting to delete user: ${userId} of type: ${userType}`);

    // Delete from Firestore first
    await admin.firestore().collection(userType).doc(userId).delete();
    logger.info(`Deleted Firestore document for user: ${userId}`);

    // If email is provided, try to find and delete the Auth user
    if (email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(userRecord.uid);
        logger.info(`Deleted Auth user: ${userRecord.uid} ` +
          `with email: ${email}`);
      } catch (authError) {
        logger.warn(`Auth user not found or already deleted: ${email}`,
            authError);
        // Continue execution - Firestore deletion was successful
      }
    } else {
      // Try to delete by UID if no email provided
      try {
        await admin.auth().deleteUser(userId);
        logger.info(`Deleted Auth user by UID: ${userId}`);
      } catch (authError) {
        logger.warn(`Auth user not found or already deleted: ${userId}`,
            authError);
        // Continue execution - Firestore deletion was successful
      }
    }

    return {
      success: true,
      message: `User ${userId} deleted completely`,
    };
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
});

/**
 * Cloud Function to deactivate a user (soft delete)
 * Marks user as inactive in Firestore and disables Auth account
 */
exports.deactivateUserCompletely = onCall(async (request) => {
  try {
    const {userId, userType, email} = request.data;

    if (!userId || !userType) {
      throw new Error("Missing required parameters: userId and userType");
    }

    logger.info(`Attempting to deactivate user: ${userId} ` +
      `of type: ${userType}`);

    // Update Firestore document to mark as inactive
    await admin.firestore().collection(userType).doc(userId).update({
      isActive: false,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Deactivated Firestore document for user: ${userId}`);

    // Disable the Auth account if email is provided
    if (email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, {disabled: true});
        logger.info(`Disabled Auth user: ${userRecord.uid} ` +
          `with email: ${email}`);
      } catch (authError) {
        logger.warn(`Auth user not found: ${email}`, authError);
        // Continue execution - Firestore update was successful
      }
    } else {
      // Try to disable by UID if no email provided
      try {
        await admin.auth().updateUser(userId, {disabled: true});
        logger.info(`Disabled Auth user by UID: ${userId}`);
      } catch (authError) {
        logger.warn(`Auth user not found: ${userId}`, authError);
        // Continue execution - Firestore update was successful
      }
    }

    return {
      success: true,
      message: `User ${userId} deactivated completely`,
    };
  } catch (error) {
    logger.error("Error deactivating user:", error);
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }
});
