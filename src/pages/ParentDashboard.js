import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  TrendingUp,
  MessageCircle,
  Download,
  Settings,
  LogOut,
  Home,
  Bell,
  Mail,
  Phone,
  BookOpen,
  BarChart3,
  Filter,
  Search,
  Plus,
  Eye,
  AlertTriangle,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase/auth';
import { 
  getParentChildren, 
  getChildrenAttendance, 
  getChildAttendanceStats,
  getChildrenTeachers,
  sendMessageToTeacher 
} from '../firebase/parent';

const ParentDashboard = ({ onLogout }) => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('this-week');

  // Load parent data from Firebase
  useEffect(() => {
    const loadParentData = async () => {
      if (!userData || !userData.uid) {
        setError('User not authenticated');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Load children data
        const childrenResult = await getParentChildren(userData.uid);
        if (childrenResult.success) {
          setChildren(childrenResult.children);
          
          // Load attendance data for all children
          const attendanceResult = await getChildrenAttendance(userData.uid, dateFilter);
          if (attendanceResult.success) {
            setAttendanceData(attendanceResult.attendance);
          } else {
            console.error('Failed to load attendance:', attendanceResult.error);
          }
        } else {
          setError('Failed to load children data: ' + childrenResult.error);
        }
      } catch (error) {
        console.error('Error loading parent data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadParentData();
  }, [userData, dateFilter]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAttendanceStats = (studentId) => {
    const childAttendance = attendanceData.filter(record => record.studentId === studentId);
    const totalClasses = childAttendance.length;
    const presentClasses = childAttendance.filter(record => record.status === 'present').length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    return {
      totalClasses,
      presentClasses,
      absentClasses: childAttendance.filter(record => record.status === 'absent').length,
      lateClasses: childAttendance.filter(record => record.status === 'late').length,
      attendanceRate
    };
  };

  // Load teachers data when needed
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const loadTeachers = async () => {
    if (!userData || !userData.uid || loadingTeachers) return;
    
    setLoadingTeachers(true);
    try {
      const teachersResult = await getChildrenTeachers(userData.uid);
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Load teachers when communication tab is accessed
  useEffect(() => {
    if (activeTab === 'communication') {
      loadTeachers();
    }
  }, [activeTab]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Children</p>
              <p className="text-3xl font-bold text-gray-800">{children.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Present Today</p>
              <p className="text-3xl font-bold text-emerald-600">
                {attendanceData.filter(record => {
                  const recordDate = new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp);
                  const today = new Date();
                  return recordDate.toDateString() === today.toDateString() && record.status === 'present';
                }).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Absent Today</p>
              <p className="text-3xl font-bold text-rose-600">
                {attendanceData.filter(record => {
                  const recordDate = new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp);
                  const today = new Date();
                  return recordDate.toDateString() === today.toDateString() && record.status === 'absent';
                }).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-rose-400 to-rose-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Children Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => {
          const stats = getAttendanceStats(child.studentId);
          return (
            <div key={child.id} className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{child.name}</h3>
                    <p className="text-sm text-purple-600">{child.academic?.course || child.class || 'N/A'}</p>
                    <p className="text-xs text-gray-500">ID: {child.studentId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedChild(child)}
                  className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Attendance Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="text-sm font-semibold text-gray-800">{stats.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stats.attendanceRate >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                        stats.attendanceRate >= 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'
                      }`}
                      style={{ width: `${stats.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Today's Status */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                  <span className="text-sm text-gray-600">Today's Status</span>
                  <div className="flex space-x-2">
                    {attendanceData
                      .filter(record => {
                        const recordDate = new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp);
                        const today = new Date();
                        return record.studentId === child.studentId && recordDate.toDateString() === today.toDateString();
                      })
                      .map((record, index) => (
                        <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {record.status === 'present' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {record.subject}
                        </span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Notifications</h3>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                notification.type === 'absence' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {notification.type === 'absence' ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Child</label>
            <select 
              className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedChild?.id || ''}
              onChange={(e) => setSelectedChild(children.find(child => child.id === e.target.value))}
            >
              <option value="">All Children</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select 
              className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData
                .filter(record => !selectedChild || record.studentId === selectedChild.studentId)
                .length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="ml-2">Loading attendance data...</span>
                      </div>
                    ) : (
                      <>
                        <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p>No attendance records found for the selected criteria.</p>
                        <p className="text-sm">Try selecting a different date range or child.</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                attendanceData
                  .filter(record => !selectedChild || record.studentId === selectedChild.studentId)
                  .map((record, index) => {
                    const child = children.find(c => c.studentId === record.studentId);
                    const recordDate = new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recordDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {child?.name || record.childName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.subject || record.sessionName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.teacherName || record.teacher || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recordDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'present' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : record.status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.status === 'present' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {record.status === 'absent' && <XCircle className="w-3 h-3 mr-1" />}
                            {record.status === 'late' && <Clock className="w-3 h-3 mr-1" />}
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-6">
      {/* Teacher Contacts */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Teacher Contacts</h3>
        {loadingTeachers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading teachers...</span>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="p-4 border border-purple-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{teacher.name}</h4>
                    <p className="text-sm text-purple-600">{teacher.department}</p>
                    <p className="text-xs text-gray-500">
                      Teaching: {teacher.students.join(', ')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(`mailto:${teacher.email}`)}
                      className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{teacher.email}</p>
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Subjects: {teacher.subjects.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No teachers found for your children.</p>
        )}
      </div>

      {/* Quick Message */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Quick Message</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Child</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Choose a teacher</option>
              {children.flatMap(child => 
                child.teachers.map((teacher, index) => (
                  <option key={`${child.id}-${index}`} value={teacher.email}>
                    {teacher.name} - {teacher.subject}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Type your message here..."
            ></textarea>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Options */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-purple-200 rounded-lg hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-800 mb-2">Monthly Attendance Report</h4>
            <p className="text-sm text-gray-600 mb-3">Get detailed attendance summary for the month</p>
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
          <div className="p-4 border border-purple-200 rounded-lg hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-800 mb-2">Subject-wise Report</h4>
            <p className="text-sm text-gray-600 mb-3">Attendance breakdown by subjects</p>
            <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Analytics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => {
            const stats = getAttendanceStats(child.studentId);
            return (
              <div key={child.id} className="p-4 border border-purple-200 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-800 mb-3">{child.name}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className={`font-semibold ${
                      stats.attendanceRate >= 90 ? 'text-emerald-600' :
                      stats.attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {stats.attendanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present Days</span>
                    <span className="text-emerald-600 font-semibold">{stats.presentClasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent Days</span>
                    <span className="text-red-600 font-semibold">{stats.absentClasses}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Parent Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{userData?.name || 'Parent'}</p>
                <p className="text-xs text-purple-600">{userData?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'communication', label: 'Communication', icon: MessageCircle },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-purple-700 hover:border-purple-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'attendance' && renderAttendance()}
            {activeTab === 'communication' && renderCommunication()}
            {activeTab === 'reports' && renderReports()}
          </>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;