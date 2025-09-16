import { lazy } from 'react';

// Lazy load heavy components for better performance
export const LazyFaceRecognition = lazy(() => import('../components/FaceRecognition'));
export const LazyQRScanner = lazy(() => import('../components/QRScanner'));
export const LazyQRGenerator = lazy(() => import('../components/QRGenerator'));

// Lazy load dashboard components
export const LazySchoolManagementDashboard = lazy(() => import('../pages/SchoolManagementDashboard'));
export const LazyClassroomManagement = lazy(() => import('../pages/ClassroomManagement'));
export const LazyClassroomDetails = lazy(() => import('../pages/ClassroomDetails'));

// Loading fallback component
export const ComponentLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[200px] sm:min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  </div>
);

// Error boundary for lazy components
export const LazyErrorBoundary = ({ children, fallback }) => {
  return (
    <div>
      {children}
    </div>
  );
};