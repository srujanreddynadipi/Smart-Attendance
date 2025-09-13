// One-time teacher registration script
// Run this to create a teacher account in Firebase

import { registerUser } from './firebase/auth';

const createTeacherAccount = async () => {
  try {
    console.log('Creating teacher account...');
    
    const teacherData = {
      firstName: 'Srujan',
      lastName: 'Reddy',
      name: 'Srujan Reddy',
      email: 'srujanreddy1980@gmail.com',
      phone: '+91 9876543210',
      role: 'teacher',
      department: 'Computer Science',
      employeeId: 'EMP001',
      designation: 'Professor',
      dateOfJoining: '2020-01-01',
      address: 'Hyderabad, Telangana',
      // Add any other teacher-specific fields you need
    };

    const user = await registerUser(
      'srujanreddy1980@gmail.com',
      '12345678',
      teacherData
    );

    console.log('✅ Teacher account created successfully!');
    console.log('Email: srujanreddy1980@gmail.com');
    console.log('Password: 12345678');
    console.log('User ID:', user.uid);
    
    return user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Teacher account already exists - you can login with:');
      console.log('Email: srujanreddy1980@gmail.com');
      console.log('Password: 12345678');
    } else {
      console.error('❌ Error creating teacher account:', error.message);
    }
    throw error;
  }
};

export default createTeacherAccount;