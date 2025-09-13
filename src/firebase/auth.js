import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Helper function to check if Firebase is properly configured
const isFirebaseConfigured = () => {
  try {
    // Check if Firebase app is properly initialized
    return auth && auth.app && auth.app.options && auth.app.options.apiKey !== "AIzaSyDevelopmentKeyForTesting123456789";
  } catch {
    return false;
  }
};

// Register a new user
export const registerUser = async (email, password, userData) => {
  try {
    console.log('🔥 Firebase Auth - Starting registration process');
    console.log('🔥 Auth instance:', auth);
    
    // Check if Firebase is properly configured
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not properly configured. Please set up your Firebase project.');
    }
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User created successfully:', user.uid);

    // Update user profile with display name
    await updateProfile(user, {
      displayName: userData.name
    });

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: userData.name,
      email: userData.email,
      role: userData.role, // 'teacher' or 'student'
      studentId: userData.studentId || null,
      teacherId: userData.teacherId || null,
      createdAt: new Date().toISOString(),
      isActive: true
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign in a user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: userData.name,
          role: userData.role,
          studentId: userData.studentId,
          teacherId: userData.teacherId
        }
      };
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign out a user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get current user data from Firestore
export const getCurrentUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return {
        success: true,
        userData: userDoc.data()
      };
    } else {
      return {
        success: false,
        error: 'User data not found'
      };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};