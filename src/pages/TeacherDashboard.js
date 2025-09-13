import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Users, 
  Clock, 
  User,
  LogOut,
  Plus,
  Eye,
  StopCircle,
  Calendar,
  MapPin,
  Bug
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
      
      // Auto-refresh sessions every 30 seconds
      const interval = setInterval(loadActiveSessions, 30000);
      return () => clearInterval(interval);
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

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    await loadSessionAttendance(session.sessionId);
  };

  const handleEndSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
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

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
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
                <h1 className="text-xl font-bold text-gray-800">{userData?.name || 'Teacher'}</h1>
                <p className="text-sm text-gray-600">Teacher Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowQRGenerator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Generate QR
              </button>
              <button 
                onClick={() => window.location.href = '?test=true'}
                className="p-2 bg-yellow-100 rounded-xl border border-yellow-200 hover:bg-yellow-200 transition-all duration-300"
                title="Open Workflow Test"
              >
                <Bug className="w-5 h-5 text-yellow-600" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 bg-red-100 rounded-xl border border-red-200 hover:bg-red-200 transition-all duration-300"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Sessions */}
          <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                Active Sessions
              </h2>
              <button
                onClick={loadActiveSessions}
                disabled={loading}
                className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active sessions</p>
                <button
                  onClick={() => setShowQRGenerator(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Create First Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{session.subject}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewSession(session)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEndSession(session.sessionId)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        >
                          End
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {session.location?.address || 'Manual Location'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        {session.attendeeCount || 0} students
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {selectedSession ? 'Session Attendance' : 'Select a Session'}
            </h2>

            {selectedSession ? (
              <div className="space-y-4">
                {/* Session Info */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">{selectedSession.subject}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                    <div>Started: {formatTime(selectedSession.createdAt)}</div>
                    <div>Attendees: {selectedSession.attendeeCount || 0}</div>
                    <div>Session ID: {selectedSession.sessionId}</div>
                    <div>Status: {selectedSession.isActive ? 'Active' : 'Ended'}</div>
                  </div>
                </div>

                {/* Attendance List */}
                <div className="space-y-3">
                  {sessionAttendance.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No attendance records yet</p>
                  ) : (
                    sessionAttendance.map((record) => (
                      <div key={record.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{record.studentName}</div>
                            <div className="text-sm text-gray-600">{record.studentId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">Present</div>
                            <div className="text-xs text-gray-500">{formatTime(record.markedAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a session to view attendance details</p>
              </div>
            )}
          </div>
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