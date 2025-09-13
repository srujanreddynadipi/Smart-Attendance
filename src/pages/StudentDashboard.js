import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  MapPin, 
  Camera, 
  User,
  CheckCircle, 
  XCircle, 
  Clock, 
  Scan,
  Eye,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  GraduationCap,
  Bell,
  Settings,
  Home,
  Users,
  Activity
} from 'lucide-react';

const StudentDashboard = () => {
  const [currentStep, setCurrentStep] = useState('home'); // home, scan, location, face, success
  const [studentData, setStudentData] = useState({
    name: 'John Doe',
    id: 'ST2024001',
    class: 'Computer Science - Final Year',
    profileImage: '/api/placeholder/80/80'
  });
  
  const [attendanceProcess, setAttendanceProcess] = useState({
    qrScanned: false,
    locationVerified: false,
    faceVerified: false,
    sessionData: null
  });

  const [attendanceRecords, setAttendanceRecords] = useState([
    { date: '2024-09-12', subject: 'Data Structures', status: 'present', time: '09:15 AM' },
    { date: '2024-09-11', subject: 'Web Development', status: 'present', time: '10:30 AM' },
    { date: '2024-09-10', subject: 'Database Systems', status: 'late', time: '09:45 AM' },
    { date: '2024-09-09', subject: 'Software Engineering', status: 'present', time: '11:15 AM' },
    { date: '2024-09-08', subject: 'Machine Learning', status: 'absent', time: '-' },
    { date: '2024-09-07', subject: 'Data Structures', status: 'present', time: '09:10 AM' },
    { date: '2024-09-06', subject: 'Web Development', status: 'present', time: '10:25 AM' }
  ]);

  const [subjectMarks, setSubjectMarks] = useState([
    { subject: 'Data Structures', totalMarks: 100, obtainedMarks: 85, percentage: 85, grade: 'A' },
    { subject: 'Web Development', totalMarks: 100, obtainedMarks: 92, percentage: 92, grade: 'A+' },
    { subject: 'Database Systems', totalMarks: 100, obtainedMarks: 78, percentage: 78, grade: 'B+' },
    { subject: 'Software Engineering', totalMarks: 100, obtainedMarks: 88, percentage: 88, grade: 'A' },
    { subject: 'Machine Learning', totalMarks: 100, obtainedMarks: 75, percentage: 75, grade: 'B' },
  ]);

  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Calculate attendance percentage
  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'present').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length
  };
  const attendancePercentage = Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100);

  // Calculate overall grade
  const overallPercentage = Math.round(subjectMarks.reduce((sum, subject) => sum + subject.percentage, 0) / subjectMarks.length);

  // Start QR Scanner
  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCurrentStep('scan');

      // Simulate QR scan after 3 seconds
      setTimeout(() => {
        setAttendanceProcess(prev => ({
          ...prev,
          qrScanned: true,
          sessionData: {
            sessionId: 'ABC123XYZ',
            teacher: 'Prof. Anderson',
            subject: 'Data Structures',
            class: 'CS-301',
            timestamp: new Date().toISOString()
          }
        }));
        stopCamera();
        setCurrentStep('location');
        verifyLocation();
      }, 3000);
    } catch (error) {
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  // Verify Location
  const verifyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Simulate location verification
        setTimeout(() => {
          setAttendanceProcess(prev => ({
            ...prev,
            locationVerified: true
          }));
          setCurrentStep('face');
        }, 2000);
      },
      (error) => {
        alert('Location access denied. Please enable location permissions.');
      }
    );
  };

  // Start Face Recognition
  const startFaceRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);

      // Simulate face recognition after 3 seconds
      setTimeout(() => {
        setAttendanceProcess(prev => ({
          ...prev,
          faceVerified: true
        }));
        stopCamera();
        markAttendance();
      }, 3000);
    } catch (error) {
      alert('Camera access denied for face recognition.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Mark Attendance
  const markAttendance = () => {
    // Add new attendance record
    const newRecord = {
      date: new Date().toISOString().split('T')[0],
      subject: attendanceProcess.sessionData.subject,
      status: 'present',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    setCurrentStep('success');

    // Reset after 3 seconds
    setTimeout(() => {
      setCurrentStep('home');
      setAttendanceProcess({
        qrScanned: false,
        locationVerified: false,
        faceVerified: false,
        sessionData: null
      });
    }, 3000);
  };

  // Home Dashboard
  const HomeDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800">{attendancePercentage}%</div>
              <div className="text-gray-600">Attendance Rate</div>
              <div className="text-sm text-gray-500">{attendanceStats.present + attendanceStats.late}/{attendanceStats.total} Classes</div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800">{overallPercentage}%</div>
              <div className="text-gray-600">Overall Grade</div>
              <div className="text-sm text-gray-500">Across {subjectMarks.length} subjects</div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800">4.2</div>
              <div className="text-gray-600">CGPA</div>
              <div className="text-sm text-gray-500">Current Semester</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={startQRScanner}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <QrCode className="w-8 h-8" />
              <div className="text-left">
                <div className="text-lg">Mark Attendance</div>
                <div className="text-sm opacity-90">Scan QR code to check in</div>
              </div>
            </div>
          </button>
          <button className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8" />
              <div className="text-left">
                <div className="text-lg">View Assignments</div>
                <div className="text-sm opacity-90">Check pending work</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Recent Attendance</h3>
          <button className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">View All</button>
        </div>
        <div className="space-y-3">
          {attendanceRecords.slice(0, 5).map((record, index) => (
            <div key={index} className="bg-white/60 rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{record.subject}</div>
                    <div className="text-sm text-gray-600">{record.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-700">{record.time}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    record.status === 'present' 
                      ? 'bg-green-100 text-green-700' 
                      : record.status === 'late'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status === 'present' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                    {record.status === 'absent' && <XCircle className="w-4 h-4 inline mr-1" />}
                    {record.status === 'late' && <Clock className="w-4 h-4 inline mr-1" />}
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Grades */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Subject Performance</h3>
          <button className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">View Details</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectMarks.map((subject, index) => (
            <div key={index} className="bg-white/60 rounded-2xl p-4 border border-white/50">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-gray-800">{subject.subject}</div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  subject.grade === 'A+' ? 'bg-green-100 text-green-800' :
                  subject.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                  subject.grade === 'B+' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {subject.grade}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{subject.obtainedMarks}/{subject.totalMarks}</span>
                <span>{subject.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${subject.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Attendance Process Steps
  const AttendanceSteps = () => {
    if (currentStep === 'scan') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Scan className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Scanning QR Code</h3>
              <p className="text-gray-600">Point camera at teacher's QR code</p>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-900 rounded-2xl mb-4"
            />
            <button
              onClick={() => {
                stopCamera();
                setCurrentStep('home');
              }}
              className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 'location') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Verifying Location</h3>
            <p className="text-gray-600 mb-6">Checking if you're in the correct classroom...</p>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">QR Code Verified</span>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 'face') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Face Recognition</h3>
              <p className="text-gray-600">Look directly at the camera</p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">QR Code Verified</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Location Verified</span>
              </div>
            </div>
            <button
              onClick={startFaceRecognition}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 mb-3"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Start Face Recognition
              </div>
            </button>
            <button
              onClick={() => setCurrentStep('home')}
              className="w-full bg-gray-500 text-white py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 'success') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Attendance Marked!</h3>
            <p className="text-gray-600 mb-4">Successfully checked in to {attendanceProcess.sessionData?.subject}</p>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-semibold">{attendanceProcess.sessionData?.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teacher:</span>
                  <span className="font-semibold">{attendanceProcess.sessionData?.teacher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{studentData.name}</h1>
                <p className="text-sm text-gray-600">{studentData.id} • {studentData.class}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <HomeDashboard />
      </div>

      {/* Attendance Process Modals */}
      <AttendanceSteps />

      {/* Camera for face recognition */}
      {cameraActive && currentStep === 'face' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Face Recognition Active</h3>
              <p className="text-gray-600">Analyzing facial features...</p>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-900 rounded-2xl mb-4"
            />
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;