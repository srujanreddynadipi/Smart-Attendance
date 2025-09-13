// Teacher Account Creation Script
// Copy and paste this into your browser console while on your app page

(async function createTeacherAccount() {
  try {
    console.log('🔄 Creating teacher account...');
    
    // Import the registerUser function
    const { registerUser } = await import('./firebase/auth');
    
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
      address: 'Hyderabad, Telangana',
    };

    const user = await registerUser(
      'srujanreddy1980@gmail.com',
      '12345678',
      teacherData
    );

    console.log('✅ SUCCESS! Teacher account created!');
    console.log('📧 Email: srujanreddy1980@gmail.com');
    console.log('🔑 Password: 12345678');
    console.log('🆔 User ID:', user.uid);
    console.log('👨‍🏫 You can now login as a teacher!');
    
    // Show success alert
    alert('✅ Teacher account created successfully!\n\nEmail: srujanreddy1980@gmail.com\nPassword: 12345678\n\nYou can now login as a teacher!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ Teacher account already exists!');
      console.log('📧 Email: srujanreddy1980@gmail.com');
      console.log('🔑 Password: 12345678');
      alert('⚠️ Teacher account already exists!\n\nEmail: srujanreddy1980@gmail.com\nPassword: 12345678\n\nYou can login now!');
    } else {
      console.error('❌ Error creating teacher account:', error);
      alert('❌ Error: ' + error.message);
    }
  }
})();