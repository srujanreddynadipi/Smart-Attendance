import React from 'react';
import { Activity, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className={`p-4 rounded-xl ${getBgColor(activity.type)} border border-gray-100 hover:shadow-sm transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {activity.action}
          </p>
          <p className="text-sm text-gray-600">
            {activity.user}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {activity.time}
          </p>
        </div>
      </div>
    </div>
  );
};

const RecentActivities = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Recent Activities</h3>
        <Activity className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;