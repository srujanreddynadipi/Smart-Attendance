import React, { memo } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  UserCheck,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  ChartSkeleton, 
  PieChartSkeleton, 
  ActivitiesListSkeleton,
  ProgressiveLoader 
} from '../../../components/SkeletonLoaders';

// Memoized stat card component for better performance
const StatCard = memo(({ title, value, icon: Icon, change, changeType, color, isLoading }) => (
  <ProgressiveLoader
    isLoading={isLoading}
    skeleton={
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
    }
  >
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <TrendingUp className="w-3 h-3" />
            {change}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value?.toLocaleString() || '0'}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  </ProgressiveLoader>
));

// Memoized chart components
const EnrollmentChart = memo(({ data, isLoading }) => (
  <ProgressiveLoader
    isLoading={isLoading}
    skeleton={<ChartSkeleton />}
  >
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment & Attendance Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="attendance" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ProgressiveLoader>
));

const DepartmentPieChart = memo(({ data, isLoading }) => (
  <ProgressiveLoader
    isLoading={isLoading}
    skeleton={<PieChartSkeleton />}
  >
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm text-gray-600 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  </ProgressiveLoader>
));

const RecentActivities = memo(({ activities, isLoading }) => (
  <ProgressiveLoader
    isLoading={isLoading}
    skeleton={<ActivitiesListSkeleton />}
  >
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {activities.length > 0 ? activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {activity.type === 'success' ? (
                <UserCheck className="w-4 h-4 text-green-600" />
              ) : (
                <Users className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
              <p className="text-xs text-gray-600 truncate">{activity.user}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activities</p>
          </div>
        )}
      </div>
    </div>
  </ProgressiveLoader>
));

// Main optimized dashboard overview component
const DashboardOverviewOptimized = ({ analytics, loadingStates, onRefresh }) => {
  const statsData = [
    {
      title: 'Total Students',
      value: analytics.totalStudents,
      icon: GraduationCap,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: 12,
      changeType: 'positive'
    },
    {
      title: 'Total Teachers',
      value: analytics.totalTeachers,
      icon: Users,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: 5,
      changeType: 'positive'
    },
    {
      title: 'Total Parents',
      value: analytics.totalParents,
      icon: BookOpen,
      color: 'bg-gradient-to-r from-pink-500 to-pink-600',
      change: 8,
      changeType: 'positive'
    },
    {
      title: 'Avg Attendance',
      value: analytics.averageAttendance,
      icon: Calendar,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: 3,
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome to the school management system</p>
        </div> */}
        <button
          onClick={onRefresh}
          disabled={loadingStates.overview}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStates.overview ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            {...stat}
            isLoading={loadingStates.overview}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentChart 
          data={analytics.monthlyData} 
          isLoading={loadingStates.analytics}
        />
        <DepartmentPieChart 
          data={analytics.departmentData} 
          isLoading={loadingStates.analytics}
        />
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities 
          activities={analytics.recentActivities} 
          isLoading={loadingStates.activities}
        />
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-900">Add User</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center">
              <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-900">View Reports</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-900">Manage Classes</span>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-center">
              <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-orange-900">Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DashboardOverviewOptimized);