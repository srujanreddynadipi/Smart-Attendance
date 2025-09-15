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

// Create a new student with enhanced data
export const createStudent = async (email, password, studentData) => {
  try {
    console.log('🎓 Creating new student:', studentData.name);
    
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not properly configured. Please set up your Firebase project.');
    }
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: studentData.name
    });

    // Generate student ID if not provided
    const studentId = studentData.studentId || `ST${Date.now().toString().slice(-6)}`;

    // Comprehensive student data
    const fullStudentData = {
      uid: user.uid,
      name: studentData.name,
      email: studentData.email,
      role: 'student',
      studentId: studentId,
      phone: studentData.phone || '',
      class: studentData.class || '',
      department: studentData.department || '',
      address: studentData.address || '',
      dateOfBirth: studentData.dateOfBirth || '',
      parentContact: studentData.parentContact || '',
      admissionDate: studentData.admissionDate || new Date().toISOString().split('T')[0],
      status: 'active',
      attendance: {
        totalDays: 0,
        presentDays: 0,
        percentage: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save to users collection
    await setDoc(doc(db, 'users', user.uid), fullStudentData);
    
    // Also save to students collection for easy querying
    await setDoc(doc(db, 'students', user.uid), fullStudentData);

    console.log('✅ Student created successfully:', studentId);
    return {
      success: true,
      user: fullStudentData
    };
  } catch (error) {
    console.error('Error creating student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create a new teacher with enhanced data
export const createTeacher = async (email, password, teacherData) => {
  try {
    console.log('👨‍🏫 Creating new teacher:', teacherData.name);
    
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not properly configured. Please set up your Firebase project.');
    }
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: teacherData.name
    });

    // Generate teacher ID if not provided
    const teacherId = teacherData.employeeId || `T${Date.now().toString().slice(-6)}`;

    // Comprehensive teacher data
    const fullTeacherData = {
      uid: user.uid,
      name: teacherData.name,
      email: teacherData.email,
      role: 'teacher',
      teacherId: teacherId,
      employeeId: teacherId,
      phone: teacherData.phone || '',
      subject: teacherData.subject || '',
      department: teacherData.department || '',
      designation: teacherData.designation || 'Teacher',
      address: teacherData.address || '',
      qualification: teacherData.qualification || '',
      experience: teacherData.experience || '',
      dateOfJoining: teacherData.dateOfJoining || new Date().toISOString().split('T')[0],
      salary: teacherData.salary || '',
      status: 'active',
      classesAssigned: teacherData.classesAssigned || [],
      subjects: teacherData.subjects || [teacherData.subject].filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save to users collection
    await setDoc(doc(db, 'users', user.uid), fullTeacherData);
    
    // Also save to teachers collection for easy querying
    await setDoc(doc(db, 'teachers', user.uid), fullTeacherData);

    console.log('✅ Teacher created successfully:', teacherId);
    return {
      success: true,
      user: fullTeacherData
    };
  } catch (error) {
    console.error('Error creating teacher:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create a new parent with enhanced data
export const createParent = async (email, password, parentData) => {
  try {
    console.log('👨‍👩‍👧‍👦 Creating new parent:', parentData.name);
    
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not properly configured. Please set up your Firebase project.');
    }
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: parentData.name
    });

    // Generate parent ID if not provided
    const parentId = parentData.parentId || `P${Date.now().toString().slice(-6)}`;

    // Comprehensive parent data
    const fullParentData = {
      uid: user.uid,
      name: parentData.name,
      email: parentData.email,
      role: 'parent',
      parentId: parentId,
      phone: parentData.phone || '',
      address: parentData.address || '',
      occupation: parentData.occupation || '',
      alternatePhone: parentData.alternatePhone || '',
      children: parentData.children || [], // Array of student IDs
      emergencyContact: parentData.emergencyContact || '',
      relationship: parentData.relationship || 'Parent',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save to users collection
    await setDoc(doc(db, 'users', user.uid), fullParentData);
    
    // Also save to parents collection for easy querying
    await setDoc(doc(db, 'parents', user.uid), fullParentData);

    console.log('✅ Parent created successfully:', parentId);
    return {
      success: true,
      user: fullParentData
    };
  } catch (error) {
    console.error('Error creating parent:', error);
    return {
      success: false,
      error: error.message
    };
  }
};