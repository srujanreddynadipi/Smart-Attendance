import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import WorkflowTest from './pages/WorkflowTest';
import SchoolManagementDashboard from './pages/SchoolManagementDashboard';

function AppContent() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  // Memoize these functions using useCallback
  const handleLogin = useCallback((user) => {
    console.log('User logged in:', user);
  }, []);

  const handleRegister = useCallback((user) => {
    navigate('/login');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    console.log('User logged out');
  }, []);

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRole = null }) => {
    if (!currentUser || !userData) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && userData.role !== requiredRole) {
      if (userData.role === 'teacher') return <Navigate to="/teacher" replace />;
      if (userData.role === 'student') return <Navigate to="/student" replace />;
      if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    }
    
    return children;
  };

  // Public Route Component (redirect if already logged in)
  const PublicRoute = ({ children }) => {
    if (currentUser && userData) {
      if (userData.role === 'teacher') return <Navigate to="/teacher" replace />;
      if (userData.role === 'student') return <Navigate to="/student" replace />;
      if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/workflow-test" element={<WorkflowTest />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login
            onLogin={handleLogin}
            onNavigateToRegister={() => navigate('/register')}
          />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage
            onRegister={handleRegister}
            onNavigateToLogin={() => navigate('/login')}
            initialUserType="student"
          />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <StudentDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <SchoolManagementDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={
        currentUser && userData ? (
          userData.role === 'teacher' ? <Navigate to="/teacher" replace /> :
          userData.role === 'student' ? <Navigate to="/student" replace /> :
          userData.role === 'admin' ? <Navigate to="/admin" replace /> :
          <Navigate to="/login" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}