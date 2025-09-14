import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  arrayUnion,
  addDoc 
} from 'firebase/firestore';
import { db } from './config';

// Store face encoding for a user
export const storeFaceEncoding = async (userId, faceDescriptor, userData = {}) => {
  try {
    console.log('💾 Storing face encoding for user:', userId);
    
    const faceData = {
      userId,
      descriptor: faceDescriptor, // Array of numbers representing face encoding
      registeredAt: new Date(),
      studentId: userData.studentId || userId,
      name: userData.name || 'Unknown Student',
      email: userData.email || '',
      ...userData
    };

    // Store in faces collection
    await setDoc(doc(db, 'faceEncodings', userId), faceData);
    
    console.log('✅ Face encoding stored successfully');
    return { success: true, message: 'Face registered successfully' };
    
  } catch (error) {
    console.error('❌ Error storing face encoding:', error);
    return { success: false, error: error.message };
  }
};

// Get face encoding for a user
export const getFaceEncoding = async (userId) => {
  try {
    const docRef = doc(db, 'faceEncodings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'Face encoding not found' };
    }
  } catch (error) {
    console.error('❌ Error getting face encoding:', error);
    return { success: false, error: error.message };
  }
};

// Get all face encodings for identification
export const getAllFaceEncodings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'faceEncodings'));
    const faceDatabase = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      faceDatabase.push({
        id: doc.id,
        label: data.name || data.studentId,
        studentId: data.studentId,
        descriptor: data.descriptor,
        ...data
      });
    });
    
    console.log(`📊 Retrieved ${faceDatabase.length} face encodings`);
    return { success: true, data: faceDatabase };
    
  } catch (error) {
    console.error('❌ Error getting face encodings:', error);
    return { success: false, error: error.message };
  }
};

// Update face encoding for a user
export const updateFaceEncoding = async (userId, newDescriptor) => {
  try {
    const docRef = doc(db, 'faceEncodings', userId);
    await updateDoc(docRef, {
      descriptor: newDescriptor,
      updatedAt: new Date()
    });
    
    return { success: true, message: 'Face encoding updated successfully' };
  } catch (error) {
    console.error('❌ Error updating face encoding:', error);
    return { success: false, error: error.message };
  }
};

// Check if user has face encoding registered
export const hasFaceEncoding = async (userId) => {
  try {
    const result = await getFaceEncoding(userId);
    return result.success;
  } catch (error) {
    return false;
  }
};

// Get face encodings for multiple users
export const getFaceEncodingsForUsers = async (userIds) => {
  try {
    const faceEncodings = [];
    
    for (const userId of userIds) {
      const result = await getFaceEncoding(userId);
      if (result.success) {
        faceEncodings.push({
          userId,
          ...result.data
        });
      }
    }
    
    return { success: true, data: faceEncodings };
  } catch (error) {
    console.error('❌ Error getting face encodings for users:', error);
    return { success: false, error: error.message };
  }
};

// Store attendance with face verification details
export const markAttendanceWithFace = async (sessionId, studentData, verificationData, faceVerificationResult) => {
  try {
    const attendanceRecord = {
      sessionId,
      studentId: studentData.studentId,
      studentName: studentData.name,
      studentEmail: studentData.email,
      markedAt: new Date(),
      location: verificationData.location,
      locationVerified: verificationData.locationVerified,
      qrVerified: verificationData.qrVerified,
      faceVerified: verificationData.faceVerified,
      faceRecognition: {
        confidence: faceVerificationResult.confidence,
        method: faceVerificationResult.method || 'face-api.js',
        verified: faceVerificationResult.success
      },
      status: 'present'
    };

    // Add to attendance records collection
    const docRef = await addDoc(collection(db, 'attendanceRecords'), attendanceRecord);
    
    console.log('✅ Attendance with face verification saved:', docRef.id);
    return { success: true, recordId: docRef.id };
    
  } catch (error) {
    console.error('❌ Error marking attendance with face:', error);
    return { success: false, error: error.message };
  }
};

export default {
  storeFaceEncoding,
  getFaceEncoding,
  getAllFaceEncodings,
  updateFaceEncoding,
  hasFaceEncoding,
  getFaceEncodingsForUsers,
  markAttendanceWithFace
};