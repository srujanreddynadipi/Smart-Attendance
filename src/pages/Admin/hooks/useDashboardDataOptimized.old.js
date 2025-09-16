import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardOverviewOptimized,
  getEnrollmentTrendOptimized,
  getDepartmentDistributionOptimized,
  getRecentActivitiesOptimized,
  getAllUsersOptimized,
  clearDashboardCache
} from '../../../firebase/adminDashboardOptimized';
import { useNotifications } from '../../../contexts/NotificationContext';

export const useDashboardDataOptimized = () => {
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

  const [loadingStates, setLoadingStates] = useState({
    overview: true,
    analytics: true,
    users: true,
    activities: true
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [lastUserDoc, setLastUserDoc] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  // Update overall loading state
  const updateLoadingState = useCallback((section, isLoading) => {
    setLoadingStates(prev => {
      const newState = { ...prev, [section]: isLoading };
      // Update overall loading state
      const stillLoading = Object.values(newState).some(loading => loading);
      setDashboardLoading(stillLoading);
      return newState;
    });
  }, []);

  // Load dashboard overview data
  const loadOverviewData = useCallback(async () => {
    try {
      updateLoadingState('overview', true);
      console.log('🔄 Loading dashboard overview...');

      const overviewResult = await getDashboardOverviewOptimized();
      if (overviewResult.success) {
        setAnalytics(prev => ({
          ...prev,
          totalStudents: overviewResult.data.totalStudents,
          totalTeachers: overviewResult.data.totalTeachers,
          totalParents: overviewResult.data.totalParents,
          averageAttendance: overviewResult.data.avgAttendance
        }));
        
        if (overviewResult.fromCache) {
          console.log('✅ Overview loaded from cache');
        }
      } else {
        showError('Failed to load overview data');
      }
    } catch (error) {
      console.error('❌ Error loading overview:', error);
      showError('Failed to load overview data');
    } finally {
      updateLoadingState('overview', false);
    }
  }, [showError, updateLoadingState]);

  // Load analytics data in parallel
  const loadAnalyticsData = useCallback(async () => {
    try {
      updateLoadingState('analytics', true);
      console.log('🔄 Loading analytics data...');

      const [trendResult, deptResult] = await Promise.all([
        getEnrollmentTrendOptimized(),
        getDepartmentDistributionOptimized()
      ]);

      if (trendResult.success) {
        setAnalytics(prev => ({
          ...prev,
          monthlyData: trendResult.data
        }));
      }

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

      console.log('✅ Analytics data loaded');
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      updateLoadingState('analytics', false);
    }
  }, [showError, updateLoadingState]);

  // Load recent activities
  const loadActivitiesData = useCallback(async () => {
    try {
      updateLoadingState('activities', true);
      console.log('🔄 Loading recent activities...');

      const activitiesResult = await getRecentActivitiesOptimized(8);
      if (activitiesResult.success) {
        const formattedActivities = activitiesResult.data.map((activity, index) => ({
          id: activity.id,
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

      console.log('✅ Activities loaded');
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      showError('Failed to load recent activities');
    } finally {
      updateLoadingState('activities', false);
    }
  }, [showError, updateLoadingState]);

  // Load users data with pagination
  const loadUsersData = useCallback(async (reset = false) => {
    try {
      if (reset) {
        updateLoadingState('users', true);
        setLastUserDoc(null);
        setHasMoreUsers(true);
      }

      console.log('🔄 Loading users data...');

      const usersResult = await getAllUsersOptimized(null, 50, reset ? null : lastUserDoc);
      if (usersResult.success) {
        if (reset) {
          setUsers(usersResult.data);
        } else {
          // Append new users for pagination
          setUsers(prev => ({
            students: [...prev.students, ...usersResult.data.students],
            teachers: [...prev.teachers, ...usersResult.data.teachers],
            parents: [...prev.parents, ...usersResult.data.parents]
          }));
        }
        
        setLastUserDoc(usersResult.lastDoc);
        setHasMoreUsers(usersResult.hasMore);
      }

      console.log('✅ Users data loaded');
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showError('Failed to load users data');
    } finally {
      if (reset) {
        updateLoadingState('users', false);
      }
    }
  }, [lastUserDoc, showError, updateLoadingState]);

  // Main data loading function - inline the logic to avoid circular deps
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clearDashboardCache();
      }

      console.log('🔄 Loading dashboard data (optimized)...');

      // Load overview data first
      try {
        updateLoadingState('overview', true);
        console.log('🔄 Loading overview data...');
        
        const overviewResult = await getDashboardOverviewOptimized();
        if (overviewResult.success) {
          const data = overviewResult.data;
          if (data) {
            setAnalytics(prev => ({
              ...prev,
              totalStudents: data.totalStudents || 0,
              totalTeachers: data.totalTeachers || 0,
              totalParents: data.totalParents || 0,
              averageAttendance: data.averageAttendance || 0
            }));
            console.log('✅ Overview data loaded:', data);
          }
        } else {
          showError('Failed to load overview data');
        }
      } catch (error) {
        console.error('❌ Error loading overview:', error);
        showError('Failed to load overview data');
      } finally {
        updateLoadingState('overview', false);
      }

      // Load other data in parallel
      Promise.all([
        // Analytics data
        (async () => {
          try {
            updateLoadingState('analytics', true);
            console.log('🔄 Loading analytics data...');

            const [trendResult, deptResult] = await Promise.all([
              getEnrollmentTrendOptimized(),
              getDepartmentDistributionOptimized()
            ]);

            if (trendResult.success) {
              setAnalytics(prev => ({
                ...prev,
                monthlyData: trendResult.data
              }));
            }

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

            console.log('✅ Analytics data loaded');
          } catch (error) {
            console.error('❌ Error loading analytics:', error);
            showError('Failed to load analytics data');
          } finally {
            updateLoadingState('analytics', false);
          }
        })(),

        // Activities data
        (async () => {
          try {
            updateLoadingState('activities', true);
            console.log('🔄 Loading activities data...');
            
            const activitiesResult = await getRecentActivitiesOptimized();
            if (activitiesResult.success) {
              setAnalytics(prev => ({
                ...prev,
                recentActivities: activitiesResult.data
              }));
              console.log('✅ Activities data loaded');
            }
          } catch (error) {
            console.error('❌ Error loading activities:', error);
            showError('Failed to load activities data');
          } finally {
            updateLoadingState('activities', false);
          }
        })(),

        // Users data
        (async () => {
          try {
            updateLoadingState('users', true);
            setLastUserDoc(null);
            setHasMoreUsers(true);
            console.log('🔄 Loading users data...');

            const usersResult = await getAllUsersOptimized(null, 50, null);
            if (usersResult.success) {
              setUsers(usersResult.data);
              setLastUserDoc(usersResult.lastDoc);
              setHasMoreUsers(usersResult.hasMore);
            }

            console.log('✅ Users data loaded');
          } catch (error) {
            console.error('❌ Error loading users:', error);
            showError('Failed to load users data');
          } finally {
            updateLoadingState('users', false);
          }
        })()
      ]);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      showError('Failed to load dashboard data: ' + error.message);
    }
  }, [showError, updateLoadingState]);

  // Load more users (pagination)
  const loadMoreUsers = useCallback(async () => {
    if (hasMoreUsers && !loadingStates.users) {
      try {
        updateLoadingState('users', true);
        console.log('🔄 Loading more users data...');

        const usersResult = await getAllUsersOptimized(null, 50, lastUserDoc);
        if (usersResult.success) {
          // Append new users for pagination
          setUsers(prev => ({
            students: [...prev.students, ...usersResult.data.students],
            teachers: [...prev.teachers, ...usersResult.data.teachers],
            parents: [...prev.parents, ...usersResult.data.parents]
          }));
          
          setLastUserDoc(usersResult.lastDoc);
          setHasMoreUsers(usersResult.hasMore);
        }

        console.log('✅ More users data loaded');
      } catch (error) {
        console.error('❌ Error loading more users:', error);
        showError('Failed to load more users');
      } finally {
        updateLoadingState('users', false);
      }
    }
  }, [hasMoreUsers, loadingStates.users, lastUserDoc, showError, updateLoadingState]);

  // Auto-load on mount
  useEffect(() => {
    loadDashboardData();
  }, []); // Empty dependency array to run only on mount

  return {
    users,
    analytics,
    dashboardLoading,
    loadingStates,
    hasMoreUsers,
    loadDashboardData,
    loadMoreUsers,
    refreshData: () => loadDashboardData(true)
  };
};