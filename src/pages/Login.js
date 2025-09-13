import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Shield, 
  Eye, 
  EyeOff, 
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { loginUser } from '../firebase/auth';

const Login = ({ onLogin, onNavigateToRegister }) => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userRoles = [
    {
      id: 'student',
      label: 'Student',
      icon: GraduationCap,
      gradient: 'from-blue-400 via-purple-500 to-pink-500',
      bgGradient: 'from-blue-50 to-purple-50',
      description: 'Access your courses, grades, and assignments'
    },
    {
      id: 'teacher',
      label: 'Teacher',
      icon: BookOpen,
      gradient: 'from-green-400 via-teal-500 to-blue-500',
      bgGradient: 'from-green-50 to-teal-50',
      description: 'Manage classes, track attendance, and grade students'
    },
    {
      id: 'parent',
      label: 'Parent',
      icon: Users,
      gradient: 'from-orange-400 via-pink-500 to-red-500',
      bgGradient: 'from-orange-50 to-pink-50',
      description: 'Monitor your child\'s progress and communicate with teachers'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      gradient: 'from-purple-400 via-indigo-500 to-blue-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      description: 'System administration and user management'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Use Firebase authentication
      const result = await loginUser(formData.email, formData.password);
      
      if (result.success) {
        // Check if user role matches selected type
        if (result.user.role === selectedRole) {
          if (onLogin) {
            onLogin(result.user);
          }
        } else {
          setError(`Please select the correct user type. You are registered as a ${result.user.role}.`);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = userRoles.find(role => role.id === selectedRole);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentRole.bgGradient} via-white to-gray-50 transition-all duration-700 ease-in-out`}>
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-200/20 to-green-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Branding & Welcome */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/50">
                  <div className={`w-8 h-8 bg-gradient-to-r ${currentRole.gradient} rounded-lg flex items-center justify-center`}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    EduManage Pro
                  </span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent">
                    Welcome
                  </span>
                  <br />
                  <span className={`bg-gradient-to-r ${currentRole.gradient} bg-clip-text text-transparent`}>
                    {currentRole.label}
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  {currentRole.description}
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">Real-time Updates</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">Secure Access</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">Mobile Friendly</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
                
                {/* Role Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Select Your Role</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {userRoles.map((role) => {
                      const IconComponent = role.icon;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                            selectedRole === role.id
                              ? `border-transparent bg-gradient-to-br ${role.gradient} text-white shadow-lg`
                              : 'border-gray-200 bg-white/70 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <IconComponent className="w-6 h-6" />
                            <span className="text-sm font-medium">{role.label}</span>
                          </div>
                          {selectedRole === role.id && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 bg-white/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={formData.remember}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${currentRole.gradient} hover:shadow-xl`
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          Sign In as {currentRole.label}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Footer Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-600">
                      Don't have an account?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => onNavigateToRegister && onNavigateToRegister()}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Register as Student
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        Contact Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;