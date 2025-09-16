import { useState, useEffect, useCallback, useRef } from 'react';
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
  const mountedRef = useRef(true);
  
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Update overall loading state
  const updateLoadingState = useCallback((section, isLoading) => {
    if (!mountedRef.current) return;
    
    setLoadingStates(prev => {
      const newState = { ...prev, [section]: isLoading };
      const stillLoading = Object.values(newState).some(loading => loading);
      setDashboardLoading(stillLoading);
      return newState;
    });
  }, []);

  // Main data loading function
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
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
        if (!mountedRef.current) return;
        
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
        if (mountedRef.current) {
          updateLoadingState('overview', false);
        }
      }

      // Load other data in parallel
      const parallelTasks = [
        // Analytics data
        (async () => {
          try {
            updateLoadingState('analytics', true);
            console.log('🔄 Loading analytics data...');

            const [trendResult, deptResult] = await Promise.all([
              getEnrollmentTrendOptimized(),
              getDepartmentDistributionOptimized()
            ]);

            if (!mountedRef.current) return;

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
            if (mountedRef.current) {
              showError('Failed to load analytics data');
            }
          } finally {
            if (mountedRef.current) {
              updateLoadingState('analytics', false);
            }
          }
        })(),

        // Activities data
        (async () => {
          try {
            updateLoadingState('activities', true);
            console.log('🔄 Loading activities data...');
            
            const activitiesResult = await getRecentActivitiesOptimized();
            if (!mountedRef.current) return;
            
            if (activitiesResult.success) {
              setAnalytics(prev => ({
                ...prev,
                recentActivities: activitiesResult.data
              }));
              console.log('✅ Activities data loaded');
            }
          } catch (error) {
            console.error('❌ Error loading activities:', error);
            if (mountedRef.current) {
              showError('Failed to load activities data');
            }
          } finally {
            if (mountedRef.current) {
              updateLoadingState('activities', false);
            }
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
            if (!mountedRef.current) return;
            
            if (usersResult.success) {
              setUsers(usersResult.data);
              setLastUserDoc(usersResult.lastDoc);
              setHasMoreUsers(usersResult.hasMore);
            }

            console.log('✅ Users data loaded');
          } catch (error) {
            console.error('❌ Error loading users:', error);
            if (mountedRef.current) {
              showError('Failed to load users data');
            }
          } finally {
            if (mountedRef.current) {
              updateLoadingState('users', false);
            }
          }
        })()
      ];

      await Promise.allSettled(parallelTasks);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      if (mountedRef.current) {
        showError('Failed to load dashboard data: ' + error.message);
      }
    }
  }, [showError, updateLoadingState]);

  // Load more users (pagination)
  const loadMoreUsers = useCallback(async () => {
    if (!hasMoreUsers || loadingStates.users || !mountedRef.current) return;
    
    try {
      updateLoadingState('users', true);
      console.log('🔄 Loading more users data...');

      const usersResult = await getAllUsersOptimized(null, 50, lastUserDoc);
      if (!mountedRef.current) return;
      
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
      if (mountedRef.current) {
        showError('Failed to load more users');
      }
    } finally {
      if (mountedRef.current) {
        updateLoadingState('users', false);
      }
    }
  }, [hasMoreUsers, loadingStates.users, lastUserDoc, showError, updateLoadingState]);

  // Initialize data on mount (run only once)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      loadDashboardData();
    }
  }, [isInitialized, loadDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

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