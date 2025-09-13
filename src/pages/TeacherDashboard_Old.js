import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Shield,
  Calendar,
  Edit3,
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase/auth';
import QRGenerator from '../components/QRGenerator';
import { 
  getTeacherSessions, 
  endAttendanceSession, 
  getSessionAttendance 
} from '../firebase/attendance';

const TeacherDashboard = ({ onLogout }) => {
  const { userData } = useAuth();
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load teacher's active sessions
  useEffect(() => {
    if (userData?.uid) {
      loadActiveSessions();
    }
  }, [userData]);

  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const result = await getTeacherSessions(userData.uid);
      if (result.success) {
        setActiveSessions(result.sessions);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load sessions');
    }
    setLoading(false);
  };

  const loadSessionAttendance = async (sessionId) => {
    try {
      const result = await getSessionAttendance(sessionId);
      if (result.success) {
        setSessionAttendance(result.records);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      const result = await endAttendanceSession(sessionId);
      if (result.success) {
        await loadActiveSessions();
        if (selectedSession?.sessionId === sessionId) {
          setSelectedSession(null);
          setSessionAttendance([]);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to end session');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load students from database
  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await studentService.getStudentsByClass(classId);
      
      // If no students exist, create some sample data
      if (studentsData.length === 0) {
        await createSampleStudents();
        const newStudentsData = await studentService.getStudentsByClass(classId);
        setStudents(newStudentsData);
      } else {
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Create sample students for demonstration
  const createSampleStudents = async () => {
    const sampleStudents = [
      { studentId: 'ST001', name: 'John Doe', email: 'john.doe@email.com', classId },
      { studentId: 'ST002', name: 'Jane Smith', email: 'jane.smith@email.com', classId },
      { studentId: 'ST003', name: 'Mike Johnson', email: 'mike.johnson@email.com', classId },
      { studentId: 'ST004', name: 'Sarah Wilson', email: 'sarah.wilson@email.com', classId },
      { studentId: 'ST005', name: 'David Brown', email: 'david.brown@email.com', classId },
      { studentId: 'ST006', name: 'Emily Davis', email: 'emily.davis@email.com', classId },
      { studentId: 'ST007', name: 'Chris Miller', email: 'chris.miller@email.com', classId },
      { studentId: 'ST008', name: 'Lisa Anderson', email: 'lisa.anderson@email.com', classId },
    ];

    for (const student of sampleStudents) {
      await studentService.addStudent(student);
    }
  };

  // Check for active session
  const checkActiveSession = async () => {
    try {
      const session = await sessionService.getActiveSession(teacherId);
      if (session) {
        setActiveSession(session);
        loadSessionAttendance(session.id);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  // Load attendance for current session
  const loadSessionAttendance = async (sessionId) => {
    try {
      const attendanceData = await attendanceService.getSessionAttendance(sessionId);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };
  // Auto-detect location
  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        // Simulate reverse geocoding
        const address = `Classroom Building, Room 101, University Campus`;
        
        setLocation({ lat, lng, address });
        setIsManualLocation(false);
      },
      (error) => {
        alert('Unable to detect location. Please enter manually.');
        setIsManualLocation(true);
      }
    );
  };

  // Generate QR Code Session
  const generateQRSession = async () => {
    if (!location.lat || !location.lng) {
      alert('Please set location first');
      return;
    }

    try {
      setLoading(true);
      const sessionData = {
        teacherId,
        classId,
        subject,
        location: {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lng),
          address: location.address
        },
        startTime: new Date().toISOString(),
        qrCode: Math.random().toString(36).substr(2, 9).toUpperCase()
      };

      const newSession = await sessionService.createSession(sessionData);
      setActiveSession(newSession);
      
      // Set up real-time listener for attendance
      const unsubscribe = realtimeService.subscribeToSessionAttendance(
        newSession.id,
        (attendanceData) => {
          setAttendance(attendanceData);
        }
      );

      // Store unsubscribe function for cleanup
      newSession.unsubscribe = unsubscribe;
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // End session
  const endSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      await sessionService.endSession(activeSession.id);
      
      // Cleanup real-time listener
      if (activeSession.unsubscribe) {
        activeSession.unsubscribe();
      }
      
      setActiveSession(null);
      setAttendance([]);
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  // Get students with their attendance status
  const getStudentsWithAttendance = () => {
    return students.map(student => {
      const studentAttendance = attendance.find(a => a.studentId === student.studentId);
      return {
        ...student,
        status: studentAttendance ? studentAttendance.status : 'absent',
        time: studentAttendance ? dbUtils.formatTimestamp(studentAttendance.timestamp) : '-',
        attendanceId: studentAttendance?.id
      };
    });
  };

  // Filter students
  const filteredStudents = getStudentsWithAttendance().filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Get attendance stats
  const getAttendanceStats = () => {
    const studentsWithAttendance = getStudentsWithAttendance();
    return {
      total: studentsWithAttendance.length,
      present: studentsWithAttendance.filter(s => s.status === 'present').length,
      absent: studentsWithAttendance.filter(s => s.status === 'absent').length,
      late: studentsWithAttendance.filter(s => s.status === 'late').length
    };
  };

  const attendanceStats = getAttendanceStats();

  // Manual attendance update
  const updateStudentAttendance = async (studentId, newStatus) => {
    if (!activeSession) {
      alert('No active session. Please start a session first.');
      return;
    }

    try {
      const existingAttendance = attendance.find(a => a.studentId === studentId);
      
      if (existingAttendance) {
        await attendanceService.updateAttendanceStatus(existingAttendance.id, newStatus);
      } else {
        await attendanceService.markAttendance({
          studentId,
          sessionId: activeSession.id,
          status: newStatus,
          timestamp: new Date().toISOString(),
          method: 'manual'
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError('Failed to update attendance');
    }
  };

  useEffect(() => {
    loadStudents();
    checkActiveSession();
    detectLocation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Manage attendance with QR codes and location verification</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/50">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/50">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="mb-6 bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - QR Generation & Location */}
          <div className="xl:col-span-1 space-y-6">
            {/* Location Settings */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Location Settings</h3>
                  <p className="text-sm text-gray-600">Set classroom location for attendance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={detectLocation}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Auto-Detect
                    </div>
                  </button>
                  <button
                    onClick={() => setIsManualLocation(!isManualLocation)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-xl transition-all duration-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {isManualLocation ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={location.lat}
                      onChange={(e) => setLocation(prev => ({ ...prev, lat: e.target.value }))}
                      className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={location.lng}
                      onChange={(e) => setLocation(prev => ({ ...prev, lng: e.target.value }))}
                      className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Address/Room Name"
                      value={location.address}
                      onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  location.lat && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-800">Location Set</span>
                        </div>
                        <p className="text-green-700">{location.address}</p>
                        <p className="text-green-600">Lat: {location.lat}, Lng: {location.lng}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* QR Code Generation */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">QR Code Session</h3>
                  <p className="text-sm text-gray-600">Generate attendance QR code</p>
                </div>
              </div>

              {!activeSession ? (
                <button
                  onClick={generateQRSession}
                  disabled={!location.lat || !location.lng}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    location.lat && location.lng
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-inner">
                    <div className="w-48 h-48 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl mx-auto flex items-center justify-center mb-4">
                      <QrCode className="w-24 h-24 text-gray-600" />
                    </div>
                    <div className="text-center space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Session: {activeSession.qrCode || activeSession.id}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(activeSession.startTime || activeSession.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 break-all">
                        QR: {activeSession.qrCode}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={endSession}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300"
                  >
                    End Session
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Stats */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Attendance Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                  <div className="text-sm text-green-700">Present</div>
                </div>
                <div className="bg-red-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                  <div className="text-sm text-red-700">Absent</div>
                </div>
                <div className="bg-yellow-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                  <div className="text-sm text-yellow-700">Late</div>
                </div>
                <div className="bg-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{attendanceStats.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Student List */}
          <div className="xl:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Student List</h3>
                    <p className="text-sm text-gray-600">Track student attendance status</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-all duration-300">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="bg-gray-200 text-gray-700 p-2 rounded-xl hover:bg-gray-300 transition-all duration-300">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>

              {/* Student List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white/60 rounded-2xl p-4 border border-white/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-700">{student.time}</div>
                          <div className="text-xs text-gray-500">Check-in Time</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeSession && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateStudentAttendance(student.studentId, 'present')}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  student.status === 'present' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => updateStudentAttendance(student.studentId, 'late')}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  student.status === 'late' 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-yellow-100'
                                }`}
                              >
                                L
                              </button>
                              <button
                                onClick={() => updateStudentAttendance(student.studentId, 'absent')}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                  student.status === 'absent' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                                }`}
                              >
                                A
                              </button>
                            </div>
                          )}
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            student.status === 'present' 
                              ? 'bg-green-100 text-green-700' 
                              : student.status === 'late'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {student.status === 'present' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                            {student.status === 'absent' && <XCircle className="w-4 h-4 inline mr-1" />}
                            {student.status === 'late' && <Clock className="w-4 h-4 inline mr-1" />}
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;