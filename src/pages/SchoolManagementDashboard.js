import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart2, 
  GraduationCap, 
  Bell, 
  Settings, 
  LogOut, 
  ClipboardCheck,
  Menu,
  X,
  Trophy,
  Award,
  Gift,
  History,
  Target
} from 'lucide-react';
import { logoutUser } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// Import Admin components
import {
  UserManagement,
  UserFormModal,
  ChildRequestsModal,
  useChildRequests,
  useUserManagement
} from './Admin';

// Import optimized components
import { useDashboardDataOptimized } from './Admin/hooks/useDashboardDataOptimized';
import DashboardOverviewOptimized from './Admin/components/DashboardOverviewOptimized';
import { DashboardSkeleton } from '../components/SkeletonLoaders';
import { PerformanceMonitor } from '../components/PerformanceMonitor';

// Import Points and Coupon components
import PointsBalance from '../components/PointsBalance';
import PointsLeaderboard from '../components/PointsLeaderboard';
import TransactionHistory from '../components/TransactionHistory';
import CouponStore from '../components/CouponStore';
import RedeemedCoupons from '../components/RedeemedCoupons';
import QuickAwardPoints from '../components/QuickAwardPoints';

// Rewards Admin Panel Component
const RewardsAdminPanel = () => {
  const [activeRewardTab, setActiveRewardTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Rewards Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">🏆 School Rewards Management</h2>
        <p className="text-gray-600">Comprehensive management of the school's rewards and recognition system</p>
      </div>

      {/* Rewards Sub-tabs */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/50">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: Award },
            { id: 'manage', label: 'Manage Points', icon: Target },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'history', label: 'History', icon: History },
            { id: 'coupons', label: 'Coupons', icon: Gift }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveRewardTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeRewardTab === id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">12,543</div>
                  <div className="text-sm text-gray-600">Total Points Awarded</div>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">1,234</div>
                  <div className="text-sm text-gray-600">Active Students</div>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">456</div>
                  <div className="text-sm text-gray-600">Coupons Redeemed</div>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">89%</div>
                  <div className="text-sm text-gray-600">Student Engagement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">System Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Bulk Award Points
                </button>
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Create New Coupon Campaign
                </button>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Export Rewards Report
                </button>
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Reset Monthly Leaderboard
                </button>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Points Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-800">Green Points</span>
                  </div>
                  <span className="text-green-600 font-bold">3,456</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-blue-800">Blue Points</span>
                  </div>
                  <span className="text-blue-600 font-bold">4,123</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="font-semibold text-yellow-800">Yellow Points</span>
                  </div>
                  <span className="text-yellow-600 font-bold">2,789</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span className="font-semibold text-purple-800">Purple Points</span>
                  </div>
                  <span className="text-purple-600 font-bold">2,175</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeRewardTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickAwardPoints isAdminView={true} />
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Bulk Point Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Award Points to Grade/Class</label>
                <select className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Grade 9 - Section A</option>
                  <option>Grade 10 - Section B</option>
                  <option>Grade 11 - Section A</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Points Amount</label>
                <input type="number" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter points amount" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" rows="3" placeholder="Enter reason for points award"></textarea>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Award Points to Group
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRewardTab === 'leaderboard' && (
        <div className="space-y-6">
          <PointsLeaderboard isAdminView={true} />
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboard Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Monthly Reset
              </button>
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Award Top Performers
              </button>
              <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Export Rankings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRewardTab === 'history' && (
        <TransactionHistory showAllUsers={true} isAdminView={true} />
      )}

      {activeRewardTab === 'coupons' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CouponStore isAdminView={true} />
            <RedeemedCoupons isAdminView={true} />
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Coupon Campaign Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Create New Campaign
              </button>
              <button className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Manage Partnerships
              </button>
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Analytics Dashboard
              </button>
              <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Export Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SchoolManagementDashboard = ({ onLogout }) => {
  const { userData } = useAuth();
  const { confirmDialog, showSuccess } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailView, setDetailView] = useState(null); // 'students', 'teachers', 'parents', or null
  const [showChildRequestsModal, setShowChildRequestsModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Custom hooks for data management
  const { 
    users, 
    analytics, 
    dashboardLoading, 
    loadingStates, 
    loadDashboardData, 
    refreshData 
  } = useDashboardDataOptimized();
  const { 
    childRequests, 
    pendingRequestsCount, 
    loading: requestsLoading,
    loadChildRequests,
    handleApproveChildRequest, 
    handleRejectChildRequest 
  } = useChildRequests();

  // User management hook
  const {
    loading: userLoading,
    showAddModal,
    setShowAddModal,
    modalType,
    selectedUser,
    formData,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleDeactivateUser,
    handleSubmitUser,
    handleInputChange,
    handleResetPassword
    // resetForm - currently unused
  } = useUserManagement(() => {
    loadDashboardData();
    loadChildRequests();
  });

  // Navigation handlers - currently commented out since not used in current view
  // const handleViewDetails = (viewType) => {
  //   setDetailView(viewType);
  //   setActiveTab('management');
  // };

  const handleBackToOverview = () => {
    setDetailView(null);
    setActiveTab('overview');
  };

  const handleApproveStudent = (studentId) => {
    showSuccess(`Student ${studentId} approved successfully`);
    loadDashboardData();
  };

  const handleLogout = async () => {
    const confirmed = await confirmDialog(
      'Logout Confirmation',
      'Are you sure you want to logout?'
    );
    
    if (confirmed) {
      await logoutUser();
      if (onLogout) onLogout();
    }
  };

  const handleBulkUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      // Add bulk upload logic here
      showSuccess('File uploaded successfully');
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'parents', label: 'Parents', icon: BookOpen },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'requests', label: 'Requests', icon: ClipboardCheck, badge: pendingRequestsCount },
  ];

  const handleSidebarClick = (itemId) => {
    if (itemId === 'requests') {
      setShowChildRequestsModal(true);
      setSidebarOpen(false); // Close mobile sidebar
      return;
    }
    
    if (['students', 'teachers', 'parents'].includes(itemId)) {
      setDetailView(itemId);
      setActiveTab('management');
    } else {
      setActiveTab(itemId);
      setDetailView(null);
    }
    
    // Close mobile sidebar after selection
    setSidebarOpen(false);
  };

  if (dashboardLoading && !analytics.totalStudents) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="w-24 h-5 bg-gray-200 rounded mb-2"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="px-6 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Hidden file input for bulk upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        safe-area-left
      `}>
        <div className="p-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:justify-start lg:space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SchoolAdmin</h1>
                <p className="text-sm text-gray-600">Management Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="mt-6 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 mb-1 text-left rounded-lg transition-all duration-200 ${
                (activeTab === item.id || detailView === item.id)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userData?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userData?.name || 'Admin'}</p>
              <p className="text-xs text-gray-600 truncate">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8 safe-area-top safe-area-right">
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChildRequestsModal(true)}
                  className="relative p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {detailView 
                  ? `${detailView.charAt(0).toUpperCase() + detailView.slice(1)} Management`
                  : activeTab === 'overview' 
                    ? 'Dashboard Overview' 
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                }
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {detailView 
                  ? `Manage ${detailView} in your school`
                  : 'Welcome to your school management dashboard'
                }
              </p>
            </div>
            {/* Desktop Header Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => setShowChildRequestsModal(true)}
                className="relative p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
              <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {detailView ? (
            <UserManagement
              type={detailView}
              users={users[detailView] || []}
              onAdd={handleAddUser}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onDeactivate={handleDeactivateUser}
              onResetPassword={handleResetPassword}
              onApprove={handleApproveStudent}
              onBulkUpload={handleBulkUpload}
              onBack={handleBackToOverview}
            />
          ) : activeTab === 'overview' ? (
            <DashboardOverviewOptimized 
              analytics={analytics}
              loadingStates={loadingStates}
              onRefresh={refreshData}
            />
          ) : activeTab === 'rewards' ? (
            <RewardsAdminPanel />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Content for {activeTab} coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        modalType={modalType}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmitUser}
        loading={userLoading}
        selectedUser={selectedUser}
      />

      <ChildRequestsModal
        isOpen={showChildRequestsModal}
        onClose={() => setShowChildRequestsModal(false)}
        requests={childRequests}
        onApprove={handleApproveChildRequest}
        onReject={handleRejectChildRequest}
        loading={requestsLoading}
      />

      {/* Performance Monitor (only in development) */}
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default SchoolManagementDashboard;