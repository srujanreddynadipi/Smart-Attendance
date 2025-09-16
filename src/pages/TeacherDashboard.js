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
  LogOut,
  Eye,
  StopCircle,
  School
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { logoutUser } from '../firebase/auth';
import QRGenerator from '../components/QRGenerator';
import { 
  getTeacherSessions, 
  endAttendanceSession, 
  getSessionAttendance 
} from '../firebase/attendance';
import { getTeacherClassrooms } from '../firebase/classrooms';

const TeacherDashboard = ({ onLogout }) => {
  const { userData } = useAuth();
  const { confirmDialog, showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Helper functions for date/time formatting
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Attendance statistics calculation
  const calculateAttendanceStats = () => {
    const total = sessionAttendance.length;
    const present = sessionAttendance.filter(record => record.status === 'present' || !record.status).length;
    const late = sessionAttendance.filter(record => record.status === 'late').length;
    const absent = total - present - late;

    return { total, present, late, absent };
  };

  const attendanceStats = calculateAttendanceStats();

  // Load teacher's active sessions
  useEffect(() => {
    if (userData?.uid) {
      loadActiveSessions();
      loadClassrooms();
      
      // Auto-refresh sessions every 30 seconds
      const interval = setInterval(loadActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  // Auto-refresh attendance for selected session
  useEffect(() => {
    if (selectedSession?.sessionId) {
      // Initial load
      loadSessionAttendance(selectedSession.sessionId);
      
      // Auto-refresh attendance every 10 seconds for selected session
      const attendanceInterval = setInterval(() => {
        loadSessionAttendance(selectedSession.sessionId);
      }, 10000);
      
      return () => clearInterval(attendanceInterval);
    }
  }, [selectedSession]);

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

  const loadClassrooms = async () => {
    try {
      console.log('Loading classrooms for teacher dashboard');
      const result = await getTeacherClassrooms(userData.uid);
      if (result.success) {
        setClassrooms(result.classrooms);
        console.log('Classrooms loaded:', result.classrooms);
      } else {
        console.error('Failed to load classrooms:', result.error);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  };

  const loadSessionAttendance = async (sessionId) => {
    try {
      console.log('🔄 Loading attendance for session:', sessionId);
      const result = await getSessionAttendance(sessionId);
      if (result.success) {
        console.log('✅ Loaded attendance records:', result.records);
        setSessionAttendance(result.records);
      } else {
        console.error('❌ Failed to load attendance:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to load attendance:', error);
      setError('Failed to load attendance data');
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    await loadSessionAttendance(session.sessionId);
  };

  const handleEndSession = async (sessionId) => {
    const confirmed = await confirmDialog(
      'End Session',
      'Are you sure you want to end this session? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        const result = await endAttendanceSession(sessionId);
        if (result.success) {
          showSuccess('Session ended successfully');
          await loadActiveSessions();
          if (selectedSession?.sessionId === sessionId) {
            setSelectedSession(null);
            setSessionAttendance([]);
          }
        } else {
          showError(result.error || 'Failed to end session');
        }
      } catch (error) {
        console.error('Error ending session:', error);
        showError('Failed to end session. Please try again.');
      }
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

  // Filter sessions and attendance based on search and filter
  const filteredAttendance = sessionAttendance.filter(record => {
    const matchesSearch = record.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus || 
                         (filterStatus === 'present' && !record.status);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 safe-area-top safe-area-bottom">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">
                  Welcome, {userData?.firstName || 'Teacher'}!
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 hidden sm:block">Manage your class attendance efficiently</p>
                <p className="text-xs text-gray-600 sm:hidden">Attendance Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => loadActiveSessions()}
                className="bg-blue-100 text-blue-700 p-2 sm:p-3 rounded-xl hover:bg-blue-200 transition-all duration-300"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 p-2 sm:p-3 rounded-xl hover:bg-red-200 transition-all duration-300"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
                  <p className="text-sm text-gray-600">Create new attendance session</p>
                </div>
              </div>

              <button
                onClick={() => setShowQRGenerator(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Generate QR Code
                </div>
              </button>

              <button
                onClick={() => navigate('/teacher/classrooms')}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <School className="w-5 h-5" />
                  Manage Classrooms
                </div>
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Active Sessions</h3>
                  <p className="text-sm text-gray-600">{activeSessions.length} active sessions</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading sessions...</p>
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active sessions</p>
                  <p className="text-sm text-gray-500">Create a QR code to start</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="bg-white/60 rounded-2xl p-4 border border-white/50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{session.subject}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewSession(session)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => handleEndSession(session.sessionId)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <StopCircle className="w-3 h-3" />
                            End
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.createdAt)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3 h-3" />
                          {formatTime(session.createdAt)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {session.location?.address || 'Manual Location'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-3 h-3" />
                          {session.attendeeCount || 0} students
                        </div>
                      </div>
                    </div>
                  ))}
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

          {/* Right Column - Session Details */}
          <div className="xl:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedSession ? `${selectedSession.subject} - Attendance` : 'Select a Session'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedSession ? 'Track student attendance status' : 'Choose a session to view details'}
                    </p>
                  </div>
                </div>
                {selectedSession && (
                  <div className="flex gap-2">
                    <button className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-all duration-300">
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => loadSessionAttendance(selectedSession.sessionId)}
                      className="bg-gray-200 text-gray-700 p-2 rounded-xl hover:bg-gray-300 transition-all duration-300"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {selectedSession ? (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">{selectedSession.subject}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Started: {formatTime(selectedSession.createdAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Attendees: {selectedSession.attendeeCount || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Session: {selectedSession.sessionId}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Status: {selectedSession.isActive ? 'Active' : 'Ended'}
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex gap-4">
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

                  {/* Attendance List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAttendance.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No attendance records found</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Students will appear here after scanning QR codes'}
                        </p>
                      </div>
                    ) : (
                      filteredAttendance.map((record) => (
                        <div key={record.id} className="bg-white/60 rounded-2xl p-4 border border-white/50 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{record.studentName}</h4>
                                <p className="text-sm text-gray-600">{record.studentId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-700">{formatTime(record.markedAt)}</div>
                                <div className="text-xs text-gray-500">Check-in Time</div>
                              </div>
                              <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                                !record.status || record.status === 'present' 
                                  ? 'bg-green-100 text-green-700' 
                                  : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {(!record.status || record.status === 'present') && <CheckCircle className="w-4 h-4" />}
                                {record.status === 'absent' && <XCircle className="w-4 h-4" />}
                                {record.status === 'late' && <Clock className="w-4 h-4" />}
                                {(record.status || 'Present').charAt(0).toUpperCase() + (record.status || 'Present').slice(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Session Selected</h4>
                  <p className="text-gray-500 mb-6">Select an active session from the left panel to view attendance details</p>
                  <button
                    onClick={() => setShowQRGenerator(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Create New Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Classrooms Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">My Classrooms</h3>
            <p className="text-gray-600">Click on a classroom to view details and manage subjects</p>
          </div>
          <button
            onClick={() => navigate('/teacher/classrooms')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classrooms.map((classroom) => (
            <div 
              key={classroom.id} 
              onClick={() => navigate(`/teacher/classroom/${classroom.id}`)}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <School className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-gray-800 mb-2">{classroom.name}</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono font-semibold text-blue-600">{classroom.code || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-semibold text-gray-800">{classroom.studentCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subjects:</span>
                  <span className="font-semibold text-gray-800">{classroom.subjects?.length || 0}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Academic Year</span>
                  <span>{classroom.academicYear || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
          
          {classrooms.length === 0 && (
            <div className="col-span-full text-center py-16">
              <School className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No Classrooms Yet</h4>
              <p className="text-gray-500 mb-6">Create your first classroom to get started</p>
              <button
                onClick={() => navigate('/teacher/classrooms')}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Create Classroom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Generator Modal */}
      {showQRGenerator && (
        <QRGenerator 
          onClose={() => {
            setShowQRGenerator(false);
            loadActiveSessions(); // Refresh sessions after creating new one
          }} 
        />
      )}
    </div>
  );
};

export default TeacherDashboard;