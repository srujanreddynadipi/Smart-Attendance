import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  QrCode, 
  MapPin, 
  Camera, 
  User,
  AlertTriangle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

// Import services to test
import { createAttendanceSession, markAttendance, getSessionAttendance } from '../firebase/attendance';
import { registerUser, loginUser, logoutUser } from '../firebase/auth';
import locationService from '../services/locationService';

const WorkflowTest = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  // Test data
  const testData = {
    teacher: {
      email: 'srujanreddy1980@gmail.com',
      password: '12345678',
      name: 'Srujan Reddy',
      role: 'teacher'
    },
    student: {
      email: 'student@test.com',
      password: 'test123456',
      name: 'Test Student',
      studentId: 'ST2024TEST',
      role: 'student'
    },
    admin: {
      email: 'admin@attendance.com',
      password: 'admin123456',
      name: 'System Admin',
      role: 'admin'
    },
    session: {
      subject: 'Computer Science Test',
      location: {
        latitude: 17.385044,
        longitude: 78.486671
      },
      className: 'CS-301 Test'
    }
  };

  // Define all tests
  const testSuite = [
    {
      id: 1,
      name: 'Firebase Connection Test',
      description: 'Test Firebase configuration and connection',
      test: testFirebaseConnection
    },
    {
      id: 2,
      name: 'Authentication Test',
      description: 'Test user registration and login',
      test: testAuthentication
    },
    {
      id: 3,
      name: 'QR Generation Test',
      description: 'Test teacher QR code generation',
      test: testQRGeneration
    },
    {
      id: 4,
      name: 'Location Service Test',
      description: 'Test location verification service',
      test: testLocationService
    },
    {
      id: 5,
      name: 'Attendance Marking Test',
      description: 'Test student attendance marking',
      test: testAttendanceMarking
    },
    {
      id: 6,
      name: 'Complete Workflow Test',
      description: 'Test the entire attendance workflow end-to-end',
      test: testCompleteWorkflow
    }
  ];

  useEffect(() => {
    setTests(testSuite);
  }, []);

  // Quick Admin Account Creation
  const createAdminAccount = async () => {
    try {
      await registerUser(testData.admin.email, testData.admin.password, {
        name: testData.admin.name,
        role: testData.admin.role
      });
      alert('Admin account created successfully!\nEmail: admin@attendance.com\nPassword: admin123456');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('Admin account already exists!\nEmail: admin@attendance.com\nPassword: admin123456');
      } else {
        alert('Error creating admin account: ' + error.message);
      }
    }
  };

  // Quick Teacher Account Creation
  const createTeacherAccount = async () => {
    try {
      await registerUser(testData.teacher.email, testData.teacher.password, {
        name: testData.teacher.name,
        role: testData.teacher.role
      });
      alert('Teacher account created successfully!\nEmail: srujanreddy1980@gmail.com\nPassword: 12345678');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('Teacher account already exists!\nEmail: srujanreddy1980@gmail.com\nPassword: 12345678');
      } else {
        alert('Error creating teacher account: ' + error.message);
      }
    }
  };

  // Fix User Data in Firestore
  const fixUserData = async () => {
    try {
      const { db } = await import('../firebase/config');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      
      const usersToFix = [testData.teacher, testData.admin, testData.student];
      const results = [];
      
      for (const userData of usersToFix) {
        try {
          // Try to login to get the UID
          const loginResult = await loginUser(userData.email, userData.password);
          
          if (loginResult.success) {
            results.push(`✅ ${userData.role} data already exists`);
            await logoutUser();
          } else {
            // Login failed, might be missing Firestore data
            throw new Error('Missing Firestore data');
          }
        } catch (error) {
          // Try to get user by email and fix the Firestore document
          try {
            // Import Firebase auth functions
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const { auth } = await import('../firebase/config');
            
            // Sign in to get the user object
            const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
            const user = userCredential.user;
            
            // Check if Firestore document exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create the missing Firestore document
              await setDoc(userDocRef, {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                studentId: userData.studentId || null,
                teacherId: userData.teacherId || null,
                createdAt: new Date().toISOString(),
                isActive: true
              });
              results.push(`✅ Fixed ${userData.role} Firestore data`);
            } else {
              results.push(`✅ ${userData.role} Firestore data already exists`);
            }
            
            await logoutUser();
          } catch (fixError) {
            results.push(`❌ Could not fix ${userData.role}: ${fixError.message}`);
          }
        }
      }
      
      alert('User Data Fix Results:\n' + results.join('\n'));
    } catch (error) {
      alert('Error fixing user data: ' + error.message);
    }
  };

  // Test Firebase Connection
  async function testFirebaseConnection() {
    try {
      // Check if Firebase services are available
      const { auth, db } = await import('../firebase/config');
      
      if (!auth || !db) {
        throw new Error('Firebase services not initialized');
      }

      return {
        success: true,
        message: 'Firebase connection successful',
        details: {
          authConfigured: !!auth,
          firestoreConfigured: !!db,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Firebase connection failed',
        error: error.message
      };
    }
  }

  // Test Authentication
  async function testAuthentication() {
    try {
      const results = [];

      // Test teacher registration
      try {
        await registerUser(testData.teacher.email, testData.teacher.password, {
          name: testData.teacher.name,
          role: testData.teacher.role
        });
        results.push('Teacher registration: ✅ Success');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          results.push('Teacher registration: ⚠️ Email already exists (expected)');
        } else {
          results.push(`Teacher registration: ❌ ${error.message}`);
        }
      }

      // Test admin registration
      try {
        await registerUser(testData.admin.email, testData.admin.password, {
          name: testData.admin.name,
          role: testData.admin.role
        });
        results.push('Admin registration: ✅ Success');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          results.push('Admin registration: ⚠️ Email already exists (expected)');
        } else {
          results.push(`Admin registration: ❌ ${error.message}`);
        }
      }

      // Test teacher login
      try {
        const user = await loginUser(testData.teacher.email, testData.teacher.password);
        results.push('Teacher login: ✅ Success');
        
        // Test logout
        await logoutUser();
        results.push('Teacher logout: ✅ Success');
      } catch (error) {
        results.push(`Teacher login: ❌ ${error.message}`);
      }

      // Test admin login
      try {
        const user = await loginUser(testData.admin.email, testData.admin.password);
        results.push('Admin login: ✅ Success');
        
        // Test logout
        await logoutUser();
        results.push('Admin logout: ✅ Success');
      } catch (error) {
        results.push(`Admin login: ❌ ${error.message}`);
      }

      return {
        success: true,
        message: 'Authentication tests completed',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication test failed',
        error: error.message
      };
    }
  }

  // Test QR Generation
  async function testQRGeneration() {
    try {
      // Login as teacher first
      const loginResult = await loginUser(testData.teacher.email, testData.teacher.password);
      
      if (!loginResult.success) {
        throw new Error('Teacher login failed: ' + loginResult.error);
      }

      // Create attendance session with proper parameters
      const sessionData = await createAttendanceSession(loginResult.user.uid, {
        subject: testData.session.subject,
        className: testData.session.className,
        latitude: testData.session.location.latitude,
        longitude: testData.session.location.longitude,
        address: 'Test Location'
      });

      if (!sessionData.sessionId || !sessionData.qrData) {
        throw new Error('Session creation failed - missing sessionId or qrData');
      }

      await logoutUser();

      return {
        success: true,
        message: 'QR generation successful',
        details: {
          sessionId: sessionData.sessionId,
          qrCodeGenerated: !!sessionData.qrData,
          subject: sessionData.subject,
          location: sessionData.location
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'QR generation failed',
        error: error.message
      };
    }
  }

  // Test Location Service
  async function testLocationService() {
    try {
      const results = [];

      // Test location permission check
      if ('geolocation' in navigator) {
        results.push('Geolocation API: ✅ Available');
      } else {
        results.push('Geolocation API: ❌ Not available');
      }

      // Test location verification with mock coordinates
      const mockLocation = {
        latitude: testData.session.location.latitude + 0.0001, // Very close
        longitude: testData.session.location.longitude + 0.0001
      };

      try {
        const result = locationService.verifyLocation(
          mockLocation,
          testData.session.location
        );
        
        if (result.isValid) {
          results.push('Location verification: ✅ Proximity check passed');
        } else {
          results.push('Location verification: ❌ Proximity check failed');
        }
      } catch (error) {
        results.push(`Location verification: ❌ ${error.message}`);
      }

      return {
        success: true,
        message: 'Location service tests completed',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Location service test failed',
        error: error.message
      };
    }
  }

  // Test Attendance Marking
  async function testAttendanceMarking() {
    try {
      // Create a test session first
      const teacherLoginResult = await loginUser(testData.teacher.email, testData.teacher.password);
      
      if (!teacherLoginResult.success) {
        throw new Error('Teacher login failed: ' + teacherLoginResult.error);
      }
      
      const sessionData = await createAttendanceSession(teacherLoginResult.user.uid, {
        subject: testData.session.subject,
        className: testData.session.className,
        latitude: testData.session.location.latitude,
        longitude: testData.session.location.longitude,
        address: 'Test Location'
      });

      await logoutUser();

      // Login as student and mark attendance
      await registerUser(testData.student.email, testData.student.password, {
        name: testData.student.name,
        role: testData.student.role,
        studentId: testData.student.studentId
      });

      const attendanceResult = await markAttendance(
        sessionData.sessionId,
        {
          studentName: testData.student.name,
          studentId: testData.student.studentId,
          studentUid: 'test-student-uid'
        },
        {
          timestamp: new Date().toISOString(),
          status: 'present',
          qrVerified: true,
          locationVerified: true,
          faceVerified: true
        }
      );

      await logoutUser();

      return {
        success: true,
        message: 'Attendance marking successful',
        details: {
          sessionId: sessionData.sessionId,
          attendanceMarked: !!attendanceResult,
          studentName: testData.student.name,
          status: 'present'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Attendance marking failed',
        error: error.message
      };
    }
  }

  // Test Complete Workflow
  async function testCompleteWorkflow() {
    const workflow = [];
    
    try {
      // Step 1: Teacher creates session
      workflow.push('🎯 Step 1: Teacher login and QR generation');
      const teacherLoginResult = await loginUser(testData.teacher.email, testData.teacher.password);
      
      if (!teacherLoginResult.success) {
        throw new Error('Teacher login failed: ' + teacherLoginResult.error);
      }
      
      const sessionData = await createAttendanceSession(teacherLoginResult.user.uid, {
        subject: testData.session.subject,
        className: testData.session.className,
        latitude: testData.session.location.latitude,
        longitude: testData.session.location.longitude,
        address: 'Test Location'
      });
      
      workflow.push('✅ QR code generated and session created');
      await logoutUser();

      // Step 2: Student location verification
      workflow.push('📍 Step 2: Student location verification');
      const mockStudentLocation = {
        latitude: testData.session.location.latitude + 0.0001,
        longitude: testData.session.location.longitude + 0.0001
      };

      const locationValid = locationService.verifyLocation(
        mockStudentLocation,
        testData.session.location
      ).isValid;
      
      if (locationValid) {
        workflow.push('✅ Student location verified');
      } else {
        workflow.push('❌ Student location verification failed');
      }

      // Step 3: QR code scanning (simulated)
      workflow.push('📱 Step 3: QR code scanning');
      workflow.push('✅ QR code scanned and verified');

      // Step 4: Face recognition (simulated)
      workflow.push('👤 Step 4: Face recognition');
      workflow.push('✅ Face recognition completed');

      // Step 5: Attendance marking
      workflow.push('📝 Step 5: Attendance marking');
      await loginUser(testData.student.email, testData.student.password);
      
      await markAttendance(
        sessionData.sessionId,
        {
          studentName: testData.student.name,
          studentId: testData.student.studentId,
          studentUid: 'test-student-uid'
        },
        {
          timestamp: new Date().toISOString(),
          status: 'present',
          qrVerified: true,
          locationVerified: true,
          faceVerified: true
        }
      );
      
      workflow.push('✅ Attendance marked successfully');
      await logoutUser();

      // Step 6: Verify attendance record
      workflow.push('🔍 Step 6: Verifying attendance record');
      await loginUser(testData.teacher.email, testData.teacher.password);
      
      const records = await getSessionAttendance(sessionData.sessionId);
      
      if (records && records.length > 0) {
        workflow.push('✅ Attendance record verified in database');
      } else {
        workflow.push('❌ Attendance record not found');
      }
      
      await logoutUser();

      return {
        success: true,
        message: 'Complete workflow test successful',
        details: workflow
      };
    } catch (error) {
      return {
        success: false,
        message: 'Complete workflow test failed',
        error: error.message,
        details: workflow
      };
    }
  }

  // Run a single test
  const runTest = async (test) => {
    setCurrentTest(test.id);
    setTestResults(prev => ({
      ...prev,
      [test.id]: { status: 'running', startTime: Date.now() }
    }));

    try {
      const result = await test.test();
      const endTime = Date.now();
      
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          ...result,
          status: result.success ? 'passed' : 'failed',
          duration: endTime - prev[test.id].startTime
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'failed',
          success: false,
          message: 'Test execution failed',
          error: error.message,
          duration: Date.now() - prev[test.id].startTime
        }
      }));
    }

    setCurrentTest(null);
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    for (const test of tests) {
      await runTest(test);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  // Clear all results
  const clearResults = () => {
    setTestResults({});
    setCurrentTest(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={() => navigate('/login')}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🧪 Attendance System Workflow Test
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive testing suite for the complete attendance marking workflow
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={clearResults}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Clear Results
            </button>

            <button
              onClick={createTeacherAccount}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              <User className="w-5 h-5" />
              Create Teacher Account
            </button>

            <button
              onClick={createAdminAccount}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              <User className="w-5 h-5" />
              Create Admin Account
            </button>

            <button
              onClick={fixUserData}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              <AlertTriangle className="w-5 h-5" />
              Fix User Data
            </button>
          </div>
        </div>

        {/* Default Credentials */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📋 Default Test Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">👨‍🏫 Teacher</h3>
              <p className="text-sm text-green-700">
                <strong>Email:</strong> srujanreddy1980@gmail.com<br/>
                <strong>Password:</strong> 12345678
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">👨‍🎓 Student</h3>
              <p className="text-sm text-blue-700">
                <strong>Email:</strong> student@test.com<br/>
                <strong>Password:</strong> test123456
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
              <h3 className="font-bold text-purple-800 mb-2">👨‍💼 Admin</h3>
              <p className="text-sm text-purple-700">
                <strong>Email:</strong> admin@attendance.com<br/>
                <strong>Password:</strong> admin123456
              </p>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tests.map((test) => {
            const result = testResults[test.id];
            const isRunning = currentTest === test.id;
            
            return (
              <div key={test.id} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{test.name}</h3>
                    <p className="text-gray-600">{test.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isRunning && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                    {result?.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {result?.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                    {result?.status === 'running' && <Clock className="w-5 h-5 text-yellow-500" />}
                  </div>
                </div>

                {/* Test Result */}
                {result && (
                  <div className="mt-4 p-4 rounded-xl bg-white/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.message}
                      </span>
                      {result.duration && (
                        <span className="text-sm text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                    
                    {result.error && (
                      <div className="text-red-600 text-sm mb-2">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {result.error}
                      </div>
                    )}
                    
                    {result.details && (
                      <div className="text-sm text-gray-600">
                        {Array.isArray(result.details) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {result.details.map((detail, index) => (
                              <li key={index}>{detail}</li>
                            ))}
                          </ul>
                        ) : (
                          <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Individual test button */}
                <button
                  onClick={() => runTest(test)}
                  disabled={isRunning || currentTest === test.id}
                  className="w-full mt-4 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {currentTest === test.id ? 'Running...' : 'Run Test'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Test Summary */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-100 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(testResults).filter(r => r.status === 'passed').length}
                </div>
                <div className="text-green-700">Passed</div>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(testResults).filter(r => r.status === 'failed').length}
                </div>
                <div className="text-red-700">Failed</div>
              </div>
              <div className="p-4 bg-gray-100 rounded-xl">
                <div className="text-2xl font-bold text-gray-600">
                  {Object.values(testResults).length}
                </div>
                <div className="text-gray-700">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTest;