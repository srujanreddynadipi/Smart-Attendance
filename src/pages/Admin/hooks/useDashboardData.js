import { useState, useEffect } from 'react';
import {
  getDashboardOverview,
  getEnrollmentTrend,
  getDepartmentDistribution,
  getRecentActivities,
  getAllUsers
} from '../../../firebase/adminDashboard';
import { useNotifications } from '../../../contexts/NotificationContext';

export const useDashboardData = () => {
  const { showError } = useNotifications();
  const [users, setUsers] = useState({
    students: [],
    teachers: [],
    parents: []
  });

  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    averageAttendance: 0,
    monthlyData: [],
    departmentData: [],
    recentActivities: []
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      console.log('🔄 Loading dashboard data from Firebase...');

      // Load overview data
      const overviewResult = await getDashboardOverview();
      if (overviewResult.success) {
        setAnalytics(prev => ({
          ...prev,
          totalStudents: overviewResult.data.totalStudents,
          totalTeachers: overviewResult.data.totalTeachers,
          totalParents: overviewResult.data.totalParents,
          averageAttendance: overviewResult.data.avgAttendance
        }));
      }

      // Load enrollment trend data
      const trendResult = await getEnrollmentTrend();
      if (trendResult.success) {
        setAnalytics(prev => ({
          ...prev,
          monthlyData: trendResult.data
        }));
      }

      // Load department distribution
      const deptResult = await getDepartmentDistribution();
      if (deptResult.success) {
        const departmentData = deptResult.data.map((dept, index) => ({
          ...dept,
          color: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F97316'][index % 6]
        }));
        setAnalytics(prev => ({
          ...prev,
          departmentData
        }));
      }

      // Load recent activities
      const activitiesResult = await getRecentActivities();
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map((activity, index) => ({
          id: index + 1,
          action: activity.title,
          user: activity.description,
          time: activity.timeAgo,
          type: activity.type === 'student_registered' ? 'info' : 
                activity.type === 'teacher_added' ? 'success' : 'info'
        }));
        setAnalytics(prev => ({
          ...prev,
          recentActivities: formattedActivities
        }));
      }

      // Load all users
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      showError('Failed to load dashboard data: ' + error.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    users,
    setUsers,
    analytics,
    dashboardLoading,
    loadDashboardData
  };
};