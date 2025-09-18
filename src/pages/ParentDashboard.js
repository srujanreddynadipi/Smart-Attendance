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
  GraduationCap,
  Star,
  Award,
  Target,
  UserPlus,
  Send,
  Loader,
  FileText,
  Trophy,
  Gift,
  History
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/Notifications';
import { 
  getParentChildren, 
  getChildrenAttendance, 
  getChildrenTeachers 
} from '../firebase/parent';
import { createChildRequest, getParentRequestHistory } from '../firebase/childRequests';
import { getChildDetails } from '../firebase/studentDetails';
import PointsBalance from '../components/PointsBalance';
import PointsLeaderboard from '../components/PointsLeaderboard';
import TransactionHistory from '../components/TransactionHistory';
import CouponStore from '../components/CouponStore';
import RedeemedCoupons from '../components/RedeemedCoupons';

const ParentDashboard = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const { success: showSuccess, error: showError, warning: showWarning } = useNotification();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  // Rewards sub-tab state (hoisted to top level to comply with Hooks rules)
  const [activeRewardTab, setActiveRewardTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('this-week');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [addChildRequest, setAddChildRequest] = useState({
    studentId: '',
    studentName: '',
    reason: ''
  });
  const [selectedChildDetails, setSelectedChildDetails] = useState(null);
  const [showChildDetailsModal, setShowChildDetailsModal] = useState(false);

  const [userData] = useState({
    name: currentUser?.displayName || currentUser?.email || 'Parent',
    email: currentUser?.email
  });

  // Load parent data on component mount
  useEffect(() => {
    loadParentData();
  }, [currentUser]);

  // Load parent data based on date filter
  useEffect(() => {
    if (currentUser) {
      loadAttendanceData();
    }
  }, [dateFilter, currentUser]);

  // Load teacher data when children change
  useEffect(() => {
    if (children.length > 0) {
      loadTeachers();
    }
  }, [children]);

  const loadParentData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading parent data for:', currentUser.uid);
      
      // Load children
      const childrenResult = await getParentChildren(currentUser.uid);
      if (childrenResult.success) {
        setChildren(childrenResult.children);
        console.log('✅ Loaded children:', childrenResult.children);
      } else {
        console.warn('⚠️ Failed to load children:', childrenResult.error);
        showWarning('No children found. Add children to view their data.');
      }

      // Load attendance data
      await loadAttendanceData();
      
    } catch (error) {
      console.error('❌ Error loading parent data:', error);
      showError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!currentUser) return;
    
    try {
      const attendanceResult = await getChildrenAttendance(currentUser.uid, dateFilter);
      if (attendanceResult.success) {
        const attendanceArray = attendanceResult.attendance || [];
        setAttendanceData(attendanceArray);
        
        // Generate notifications from recent absences/lates
        const recentNotifications = attendanceArray
          .filter(record => {
            const recordDate = new Date(record.date || record.createdAt);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return recordDate >= threeDaysAgo && record.status !== 'present';
          })
          .slice(0, 5)
          .map((record, index) => ({
            id: `notif_${index}`,
            type: record.status,
            message: `${record.studentName} was ${record.status} ${record.subject ? `in ${record.subject}` : ''}`,
            time: formatTimeAgo(new Date(record.date || record.createdAt))
          }));
        
        setNotifications(recentNotifications);
        console.log('✅ Loaded attendance data:', attendanceArray.length, 'records');
      } else {
        console.warn('⚠️ Failed to load attendance:', attendanceResult.error);
        // Ensure notifications is reset to empty array on error
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error loading attendance data:', error);
      // Ensure notifications is reset to empty array on error
      setNotifications([]);
    }
  };

  const loadTeachers = async () => {
    if (!currentUser) return;
    
    try {
      const teachersResult = await getChildrenTeachers(currentUser.uid);
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers);
        console.log('✅ Loaded teachers:', teachersResult.teachers);
      } else {
        console.warn('⚠️ Failed to load teachers:', teachersResult.error);
      }
    } catch (error) {
      console.error('❌ Error loading teachers:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Handle adding a child request
  const handleAddChildRequest = async (e) => {
    e.preventDefault();
    
    if (!addChildRequest.studentId.trim()) {
      showError('Please enter a student ID');
      return;
    }

    setLoading(true);
    try {
      const result = await createChildRequest(
        currentUser.uid,
        userData.name,
        userData.email,
        addChildRequest.studentId.trim(),
        addChildRequest.studentName.trim(),
        addChildRequest.reason.trim()
      );

      if (result.success) {
        showSuccess(result.message);
        setShowAddChildModal(false);
        setAddChildRequest({ studentId: '', studentName: '', reason: '' });
      } else {
        showError(result.error);
      }
    } catch (error) {
      console.error('Error submitting child request:', error);
      showError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing child details
  const handleViewChildDetails = async (child) => {
    console.log('🔍 Viewing child details for:', child);
    setLoading(true);
    try {
      const result = await getChildDetails(child.studentId);
      console.log('📋 Child details result:', result);
      if (result.success) {
        setSelectedChildDetails(result.data);
        setShowChildDetailsModal(true);
      } else {
        showError('Failed to load child details: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading child details:', error);
      showError('Failed to load child details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) onLogout();
  };

  const getAttendanceStats = (studentId) => {
    const safeAttendanceData = attendanceData || [];
    const childAttendance = safeAttendanceData.filter(record => record.studentId === studentId);
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

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-800">{children.length}</div>
              <div className="text-gray-600 font-medium">Total Children</div>
              <div className="text-sm text-purple-600">Enrolled Students</div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                {(attendanceData || []).filter(record => {
                  const recordDate = new Date(record.timestamp);
                  const today = new Date();
                  return recordDate.toDateString() === today.toDateString() && record.status === 'present';
                }).length}
              </div>
              <div className="text-gray-600 font-medium">Present Today</div>
              <div className="text-sm text-emerald-600">Attended Classes</div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">92%</div>
              <div className="text-gray-600 font-medium">Avg Attendance</div>
              <div className="text-sm text-orange-600">Overall Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Children Cards */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            My Children
          </h3>
          <button
            onClick={() => setShowAddChildModal(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Child
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading children data...</span>
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-600 mb-2">No children linked yet</h4>
            <p className="text-gray-500 mb-6">Add your children to start viewing their attendance and academic information.</p>
            <button
              onClick={() => setShowAddChildModal(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-5 h-5" />
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => {
            const stats = getAttendanceStats(child.studentId);
            return (
              <div 
                key={child.id} 
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-white/80"
                onClick={() => handleViewChildDetails(child)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{child.name}</h4>
                      <p className="text-purple-600 font-medium">{child.academic?.course || child.class || 'N/A'}</p>
                      <p className="text-sm text-gray-500 font-mono">ID: {child.studentId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 font-medium">Attendance Rate</span>
                      <span className="text-xl font-bold text-gray-800">{stats.attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          stats.attendanceRate >= 90 
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                            : stats.attendanceRate >= 75 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                            : 'bg-gradient-to-r from-red-400 to-rose-500'
                        }`}
                        style={{ width: `${stats.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Today's Status</span>
                    <div className="flex space-x-2">
                      {(attendanceData || [])
                        .filter(record => {
                          const recordDate = new Date(record.date || record.timestamp || record.createdAt);
                          const today = new Date();
                          return record.studentId === child.studentId && recordDate.toDateString() === today.toDateString();
                        })
                        .map((record, index) => (
                          <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            record.status === 'present' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {record.status === 'present' ? (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {record.subject}
                          </span>
                        ))
                      }
                      {(attendanceData || []).filter(record => {
                        const recordDate = new Date(record.date || record.timestamp || record.createdAt);
                        const today = new Date();
                        return record.studentId === child.studentId && recordDate.toDateString() === today.toDateString();
                      }).length === 0 && (
                        <span className="text-gray-500 text-sm">No classes today</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Click hint */}
                  <div className="mt-4 pt-3 border-t border-gray-200/50">
                    <div className="flex items-center justify-center text-purple-600 hover:text-purple-700 transition-colors">
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Click to view detailed information</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Recent Notifications */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="w-8 h-8 text-amber-600" />
            Recent Notifications
          </h3>
          <button className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {(notifications || []).map((notification) => (
            <div key={notification.id} className="bg-white/60 rounded-2xl p-4 border border-white/50">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${
                  notification.type === 'absence' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {notification.type === 'absence' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRewards = () => {
    return (
      <div className="space-y-6">
        {/* Rewards Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">🏆 Children's Rewards</h2>
          <p className="text-gray-600">Track your children's points, view their achievements, and monitor coupon redemptions</p>
        </div>

        {/* Rewards Sub-tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/50">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Award },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'history', label: 'History', icon: History },
              { id: 'coupons', label: 'Coupons', icon: Gift }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveRewardTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeRewardTab === id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rewards Content */}
        {activeRewardTab === 'overview' && (
          <div className="space-y-6">
            {/* Children's Points Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.grade || 'Grade N/A'}</p>
                    </div>
                  </div>
                  <PointsBalance userId={child.studentId} view="compact" />
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Reward Activity</h3>
              {children.length > 0 ? (
                <TransactionHistory userId={children[0]?.studentId} showRecentOnly={true} />
              ) : (
                <p className="text-gray-600">No children registered yet.</p>
              )}
            </div>
          </div>
        )}

        {activeRewardTab === 'leaderboard' && (
          <div className="space-y-6">
            <PointsLeaderboard />
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Children's Rankings</h3>
              <div className="space-y-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-4 p-3 bg-white/60 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{child.name}</div>
                      <div className="text-sm text-gray-600">Track their progress</div>
                    </div>
                    <PointsBalance userId={child.studentId} view="compact" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeRewardTab === 'history' && (
          <div className="space-y-6">
            {children.map((child) => (
              <div key={child.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{child.name}'s Transaction History</h3>
                </div>
                <TransactionHistory userId={child.studentId} />
              </div>
            ))}
          </div>
        )}

        {activeRewardTab === 'coupons' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Available Coupons</h3>
                <CouponStore isParentView={true} />
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Children's Redeemed Coupons</h3>
                {children.map((child) => (
                  <div key={child.id} className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">{child.name}</h4>
                    <RedeemedCoupons userId={child.studentId} isParentView={true} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAttendance = () => (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
              value={selectedChild?.id || ''}
              onChange={(e) => setSelectedChild(children.find(child => child.id === e.target.value))}
            >
              <option value="">All Children</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
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
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Attendance Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                {['Date', 'Child', 'Subject', 'Teacher', 'Time', 'Status'].map((header) => (
                  <th key={header} className="px-8 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(attendanceData || [])
                .filter(record => !selectedChild || record.studentId === selectedChild.studentId)
                .map((record, index) => {
                  const child = children.find(c => c.studentId === record.studentId);
                  const recordDate = new Date(record.date || record.timestamp || record.createdAt);
                  return (
                    <tr key={index} className="hover:bg-white/30 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {recordDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {child?.name || record.studentName || 'Unknown Student'}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-gray-900">
                        {record.subject || 'N/A'}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-gray-900">
                        {record.teacherName || 'N/A'}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-gray-900">
                        {record.timeIn || recordDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          record.status === 'present' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : record.status === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {record.status === 'present' && <CheckCircle className="w-4 h-4 mr-1" />}
                          {record.status === 'absent' && <XCircle className="w-4 h-4 mr-1" />}
                          {record.status === 'late' && <Clock className="w-4 h-4 mr-1" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-8">
      {/* Teacher Contacts */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-600" />
          Teacher Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white/60 rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{teacher.name}</h4>
                    <p className="text-blue-600 font-medium">{teacher.department}</p>
                    <p className="text-sm text-gray-500">
                      Teaching: {teacher.students.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.open(`mailto:${teacher.email}`)}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm font-medium">{teacher.email}</p>
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Subjects: {teacher.subjects.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Message */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Plus className="w-8 h-8 text-purple-600" />
          Send Quick Message
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50">
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Teacher</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50">
                <option value="">Choose a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.email}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea 
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
              rows={4}
              placeholder="Type your message here..."
            ></textarea>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-8">
      {/* Report Options */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Generate Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/60 rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Monthly Attendance Report</h4>
                <p className="text-gray-600 text-sm">Get detailed attendance summary for the month</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 w-full justify-center">
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
          
          <div className="bg-white/60 rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Subject-wise Report</h4>
                <p className="text-gray-600 text-sm">Attendance breakdown by subjects</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 w-full justify-center">
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Analytics */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-orange-600" />
          Attendance Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => {
            const stats = getAttendanceStats(child.studentId);
            return (
              <div key={child.id} className="bg-white/60 rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">{child.name}</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Attendance Rate</span>
                    <span className={`text-xl font-bold ${
                      stats.attendanceRate >= 90 ? 'text-emerald-600' :
                      stats.attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {stats.attendanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Present Days</span>
                    <span className="text-emerald-600 font-bold">{stats.presentClasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Absent Days</span>
                    <span className="text-red-600 font-bold">{stats.absentClasses}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{userData?.name || 'Parent'}</h1>
                <p className="text-sm text-purple-600">{userData?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-100 rounded-xl border border-red-200 hover:bg-red-200 transition-all duration-300"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/50 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'rewards', label: 'Rewards', icon: Trophy },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'communication', label: 'Communication', icon: MessageCircle },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-6 font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                      : 'text-gray-500 hover:text-purple-700 hover:bg-purple-50/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'communication' && renderCommunication()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <UserPlus className="w-8 h-8 text-purple-600" />
                Add Child Request
              </h3>
              <button
                onClick={() => setShowAddChildModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddChildRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter student ID (e.g., ST2024001)"
                  value={addChildRequest.studentId}
                  onChange={(e) => setAddChildRequest(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">The unique student ID assigned by the school</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter child's full name"
                  value={addChildRequest.studentName}
                  onChange={(e) => setAddChildRequest(prev => ({ ...prev, studentName: e.target.value }))}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70"
                />
                <p className="text-sm text-gray-500 mt-1">This helps admins verify the request</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Request (Optional)
                </label>
                <textarea
                  placeholder="Why do you want to link this child to your account?"
                  value={addChildRequest.reason}
                  onChange={(e) => setAddChildRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Request Process</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      Your request will be sent to the school administration for approval. You'll be notified once it's processed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

      {/* Child Details Modal */}
      {showChildDetailsModal && selectedChildDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-purple-600" />
                {selectedChildDetails.student.name} - Detailed Information
              </h3>
              <button
                onClick={() => setShowChildDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[75vh]">
              {/* Student Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/60 rounded-2xl p-6 border border-white/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{selectedChildDetails.student.name}</h4>
                      <p className="text-purple-600 font-medium">{selectedChildDetails.student.class}</p>
                      <p className="text-sm text-gray-500 font-mono">ID: {selectedChildDetails.student.studentId}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600"><strong>Department:</strong> {selectedChildDetails.student.department || 'N/A'}</p>
                    <p className="text-gray-600"><strong>Email:</strong> {selectedChildDetails.student.email || 'N/A'}</p>
                    <p className="text-gray-600"><strong>Phone:</strong> {selectedChildDetails.student.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl p-6 border border-white/50">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    Attendance Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className={`font-bold ${selectedChildDetails.statistics.attendanceRate >= 90 ? 'text-green-600' : selectedChildDetails.statistics.attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                        {selectedChildDetails.statistics.attendanceRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Present</span>
                      <span className="text-green-600 font-bold">{selectedChildDetails.statistics.presentClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Absent</span>
                      <span className="text-red-600 font-bold">{selectedChildDetails.statistics.absentClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late</span>
                      <span className="text-amber-600 font-bold">{selectedChildDetails.statistics.lateClasses}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl p-6 border border-white/50">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-600" />
                    Academic Performance
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average GPA</span>
                      <span className="text-purple-600 font-bold">{selectedChildDetails.statistics.averageGrade}</span>
                    </div>
                    {selectedChildDetails.statistics.currentRank && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class Rank</span>
                        <span className="text-blue-600 font-bold">
                          {selectedChildDetails.statistics.currentRank}/{selectedChildDetails.statistics.totalStudents}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Subjects</span>
                      <span className="text-indigo-600 font-bold">{selectedChildDetails.subjects.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timetable */}
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Calendar className="w-7 h-7 text-blue-600" />
                  Weekly Timetable
                </h4>
                <div className="bg-white/60 rounded-2xl overflow-hidden border border-white/50">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Day</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">9:00-10:00</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">10:15-11:15</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">11:30-12:30</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">1:30-2:30</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">2:45-3:45</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedChildDetails.timetable.map((day) => (
                        <tr key={day.id} className="hover:bg-white/30">
                          <td className="px-4 py-3 font-semibold text-gray-800">{day.day}</td>
                          {day.periods.map((period, index) => (
                            <td key={index} className="px-4 py-3">
                              <div className="text-sm">
                                <div className="font-medium text-gray-800">{period.subject}</div>
                                <div className="text-gray-500">{period.teacher}</div>
                                <div className="text-gray-400">{period.room}</div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grades */}
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Star className="w-7 h-7 text-yellow-600" />
                  Recent Grades
                </h4>
                <div className="bg-white/60 rounded-2xl overflow-hidden border border-white/50">
                  {selectedChildDetails.grades.map((semester) => (
                    <div key={semester.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xl font-bold text-gray-800">{semester.semester}</h5>
                        <div className="flex items-center gap-4">
                          <span className="text-purple-600 font-bold">GPA: {semester.gpa}</span>
                          <span className="text-blue-600 font-bold">Rank: {semester.rank}/{semester.totalStudents}</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-semibold text-gray-600">Subject</th>
                              <th className="text-center py-2 font-semibold text-gray-600">Midterm</th>
                              <th className="text-center py-2 font-semibold text-gray-600">Final</th>
                              <th className="text-center py-2 font-semibold text-gray-600">Assignments</th>
                              <th className="text-center py-2 font-semibold text-gray-600">Total</th>
                              <th className="text-center py-2 font-semibold text-gray-600">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semester.subjects.map((subject, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 font-medium text-gray-800">{subject.subject}</td>
                                <td className="text-center py-2">{subject.midterm}</td>
                                <td className="text-center py-2">{subject.final}</td>
                                <td className="text-center py-2">{subject.assignments}</td>
                                <td className="text-center py-2 font-bold">{subject.total}</td>
                                <td className="text-center py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    subject.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                                    subject.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {subject.grade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignments */}
              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-indigo-600" />
                  Recent Assignments
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedChildDetails.assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white/60 rounded-2xl p-6 border border-white/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h5 className="font-bold text-gray-800">{assignment.title}</h5>
                          <p className="text-purple-600 font-medium">{assignment.subject}</p>
                          <p className="text-sm text-gray-500">{assignment.type}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          assignment.status === 'submitted' ? 'bg-green-100 text-green-700' :
                          assignment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-600"><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        {assignment.score !== null && (
                          <p className="text-gray-600"><strong>Score:</strong> {assignment.score}/{assignment.maxScore}</p>
                        )}
                        {assignment.feedback && (
                          <p className="text-gray-600"><strong>Feedback:</strong> {assignment.feedback}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};export default ParentDashboard;