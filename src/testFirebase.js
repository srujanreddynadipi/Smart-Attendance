// Firebase Connection Test
import { db } from './firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Try to read from a collection (this will create it if it doesn't exist)
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Firebase connected successfully!');
    console.log(`📊 Test collection has ${snapshot.size} documents`);
    
    return {
      success: true,
      message: 'Firebase connected successfully!',
      documentCount: snapshot.size
    };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Test function to verify database operations
export const testDatabaseOperations = async () => {
  try {
    console.log('🧪 Testing database operations...');
    
    // Import database services
    const { studentService } = await import('./firebase/database');
    
    // Test reading students (this will create sample data if none exists)
    const students = await studentService.getAllStudents();
    
    console.log('✅ Database operations working!');
    console.log(`👥 Found ${students.length} students in database`);
    
    return {
      success: true,
      message: 'Database operations working!',
      studentCount: students.length
    };
  } catch (error) {
    console.error('❌ Database operations failed:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};