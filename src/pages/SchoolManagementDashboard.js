import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart2, 
  GraduationCap, 
  UserCheck, 
  Bell, 
  Settings, 
  LogOut, 
  ClipboardCheck,
  Upload,
  Menu,
  X
} from 'lucide-react';
import { logoutUser } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// Import Admin components
import {
  DashboardOverview,
  UserManagement,
  UserFormModal,
  ChildRequestsModal,
  useDashboardData,
  useChildRequests,
  useUserManagement
} from './Admin';

const SchoolManagementDashboard = ({ onLogout }) => {
  const { userData } = useAuth();
  const { confirmDialog, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [detailView, setDetailView] = useState(null); // 'students', 'teachers', 'parents', or null
  const [showChildRequestsModal, setShowChildRequestsModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Custom hooks for data management
  const { users, analytics, dashboardLoading, loadDashboardData } = useDashboardData();
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
    handleSubmitUser,
    handleInputChange,
    handleResetPassword,
    resetForm
  } = useUserManagement(() => {
    loadDashboardData();
    loadChildRequests();
  });

  // Navigation handlers
  const handleViewDetails = (viewType) => {
    setDetailView(viewType);
    setActiveTab('management');
  };

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

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
              onResetPassword={handleResetPassword}
              onApprove={handleApproveStudent}
              onBulkUpload={handleBulkUpload}
              onBack={handleBackToOverview}
            />
          ) : activeTab === 'overview' ? (
            <DashboardOverview 
              analytics={analytics}
              onViewDetails={handleViewDetails}
            />
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
    </div>
  );
};

export default SchoolManagementDashboard;