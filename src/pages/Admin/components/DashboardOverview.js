import React from 'react';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import RecentActivities from './RecentActivities';

const DashboardOverview = ({ analytics, onViewDetails }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <DashboardStats analytics={analytics} onViewDetails={onViewDetails} />
      
      {/* Charts */}
      <DashboardCharts analytics={analytics} />
      
      {/* Recent Activities */}
      <RecentActivities activities={analytics.recentActivities} />
    </div>
  );
};

export default DashboardOverview;