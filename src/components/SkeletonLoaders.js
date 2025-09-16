import React from 'react';

// Skeleton loader for dashboard cards
export const DashboardCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="w-16 h-6 bg-gray-200 rounded"></div>
    </div>
    <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
    <div className="w-32 h-4 bg-gray-200 rounded"></div>
  </div>
);

// Skeleton loader for stats grid
export const StatsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, index) => (
      <DashboardCardSkeleton key={index} />
    ))}
  </div>
);

// Skeleton loader for chart
export const ChartSkeleton = ({ height = "h-64" }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm animate-pulse ${height}`}>
    <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
    <div className="flex items-end space-x-2 h-40">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-200 rounded-t flex-1"
          style={{
            height: `${Math.random() * 80 + 20}%`
          }}
        ></div>
      ))}
    </div>
  </div>
);

// Skeleton loader for activities list
export const ActivitiesListSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="w-48 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton loader for user table
export const UserTableSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
    <div className="p-6 border-b border-gray-200">
      <div className="w-32 h-6 bg-gray-200 rounded"></div>
    </div>
    <div className="p-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton loader for pie chart
export const PieChartSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="w-40 h-6 bg-gray-200 rounded mb-4"></div>
    <div className="flex items-center justify-center h-48">
      <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
    </div>
    <div className="mt-4 space-y-2">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <div className="w-20 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Comprehensive dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="w-64 h-8 bg-gray-200 rounded mb-2"></div>
      <div className="w-96 h-4 bg-gray-200 rounded"></div>
    </div>

    {/* Stats cards skeleton */}
    <StatsGridSkeleton />

    {/* Charts row skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <PieChartSkeleton />
    </div>

    {/* Activities and users skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ActivitiesListSkeleton />
      <div className="lg:col-span-1">
        <UserTableSkeleton />
      </div>
    </div>
  </div>
);

// Progressive loading component
export const ProgressiveLoader = ({ 
  isLoading, 
  skeleton, 
  children, 
  className = "",
  showShimmer = true 
}) => {
  if (isLoading) {
    return (
      <div className={`${showShimmer ? 'animate-pulse' : ''} ${className}`}>
        {skeleton}
      </div>
    );
  }
  
  return children;
};