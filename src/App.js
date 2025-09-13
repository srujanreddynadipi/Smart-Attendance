import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function AppContent() {
  const { currentUser, userData } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register'

  const handleLogin = (user) => {
    // User is logged in, authentication context will handle state
    console.log('User logged in:', user);
  };

  const handleRegister = (user) => {
    // Registration successful, redirect to login
    setCurrentView('login');
  };

  const handleLogout = () => {
    // User logged out, authentication context will handle state
    console.log('User logged out');
  };

  // If user is authenticated, show appropriate dashboard
  if (currentUser && userData) {
    if (userData.role === 'teacher') {
      return <TeacherDashboard onLogout={handleLogout} />;
    } else if (userData.role === 'student') {
      return <StudentDashboard onLogout={handleLogout} />;
    }
  }

  // If user is not authenticated, show login/register flow
  if (currentView === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onNavigateToRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onNavigateToLogin={() => setCurrentView('login')}
        initialUserType="student"
      />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}