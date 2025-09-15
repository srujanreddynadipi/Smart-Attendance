import React from 'react';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${color}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  </div>
);

const DashboardStats = ({ analytics, onViewDetails }) => {
  const stats = [
    {
      title: 'Total Students',
      value: analytics.totalStudents,
      icon: GraduationCap,
      trend: '+12% from last month',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      viewType: 'students'
    },
    {
      title: 'Total Teachers',
      value: analytics.totalTeachers,
      icon: Users,
      trend: '+3% from last month',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      viewType: 'teachers'
    },
    {
      title: 'Total Parents',
      value: analytics.totalParents,
      icon: BookOpen,
      trend: '+8% from last month',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      viewType: 'parents'
    },
    {
      title: 'Avg Attendance',
      value: `${analytics.averageAttendance}%`,
      icon: TrendingUp,
      trend: '+2% from last month',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={stat.viewType ? "cursor-pointer" : ""}
          onClick={stat.viewType ? () => onViewDetails(stat.viewType) : undefined}
        >
          <StatsCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;