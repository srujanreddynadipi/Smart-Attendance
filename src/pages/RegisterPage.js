import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Upload,
  Camera,
  Sparkles,
  Users,
  Home,
  
  AlertCircle,
  Scan
} from 'lucide-react';
import { registerUser } from '../firebase/auth';
import { storeFaceEncoding } from '../firebase/faceDatabase';
import FaceRegistration from '../components/FaceRegistration';

const RegisterPage = ({ onRegister, onNavigateToLogin, initialUserType }) => {
  // console.log('RegisterPage is re-rendering...'); // You can remove this line now
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Personal Information (Only essential fields for registration)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    
    // Account Information
    password: '',
    confirmPassword: '',
    
    // Face Registration
    profileImage: null,
    faceData: null,
    agreeTerms: false
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: User, description: 'Basic personal details' },
    { id: 2, title: 'Account', icon: Lock, description: 'Login credentials' },
    { id: 3, title: 'Face Setup', icon: Scan, description: 'Register your face' },
    { id: 4, title: 'Review', icon: CheckCircle, description: 'Final review' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
        setFormData(prev => ({ ...prev, profileImage: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCurrentStep = () => {
    switch(currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && 
               formData.phone && formData.dateOfBirth && formData.gender;
      case 2:
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailRegex.test(formData.email);
        
        // Validate password strength (at least 6 characters)
        const isPasswordValid = formData.password && formData.password.length >= 6;
        
        // Check passwords match
        const passwordsMatch = formData.password === formData.confirmPassword;
        
        return formData.password && formData.confirmPassword && 
               isEmailValid && isPasswordValid && passwordsMatch;
      case 3:
        return formData.faceData !== null; // Face registration required
      case 4:
        return formData.agreeTerms;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError(''); // Clear any previous errors
    } else {
      // Set specific error messages based on current step
      switch(currentStep) {
        case 1:
          setError('Please fill in all required personal information fields');
          break;
        case 2:
          if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
          } else if (!formData.password || formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
          } else if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
          } else {
            setError('Please complete all account information');
          }
          break;
        case 3:
          setError('Please capture your face for registration');
          break;
        case 4:
          setError('Please agree to the terms and conditions');
          break;
        default:
          setError('Please fill in all required fields correctly');
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setError('Please complete all required fields and agree to terms');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare simplified user data for Firebase (only essential information)
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: 'student', // Default to student for registration
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        // Include face data for attendance verification
        faceData: formData.faceData || null,
        // Profile completion status
        profileCompleted: false, // User can complete profile later
        registrationDate: new Date().toISOString()
      };

      // Debug: Log the registration attempt
      console.log('🔍 Attempting registration with:', {
        email: formData.email,
        name: userData.name
      });

      // Register user with Firebase
      const result = await registerUser(formData.email, formData.password, userData);
      
      if (result.success) {
        // After account creation, store the face encoding using the new uid
        try {
          if (formData.faceData) {
            const faceStore = await storeFaceEncoding(result.user.uid, formData.faceData, {
              studentId: result.user.uid, // Use uid as studentId for now
              name: userData.name,
              email: userData.email,
              confidence: 0.9, // High confidence for new registration
              faceQuality: 0.8
            }, true); // Pass true to indicate this is an embedding, not legacy descriptor
            if (!faceStore.success) {
              console.warn('Face encoding save failed:', faceStore.error);
            }
          }
        } catch (e) {
          console.warn('Face encoding save threw an error:', e);
        }

        setSuccess('Registration successful! You can complete your profile details later. Please sign in with your new account.');
        // Optionally call onRegister with the result
        if (onRegister) {
          onRegister(result.user);
        }
        // Optionally navigate to login after a delay
        setTimeout(() => {
          if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Personal Information
  const PersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john.doe@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleInputChange}
            className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Step 2: Address Information
  // Step 2: Account Information
  const AccountStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Account Security</h2>
        <p className="text-gray-600">Create your login credentials</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">At least 8 characters with uppercase, lowercase, number and special character</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Profile Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="profileImage"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </label>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 2MB)</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5: Face Registration
  const FaceRegistrationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Face Registration</h2>
        <p className="text-gray-600">Capture your face for secure attendance verification</p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Important Security Information:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Your face data will be encrypted and stored securely</li>
              <li>This enables automatic attendance verification</li>
              <li>Please ensure good lighting and look directly at the camera</li>
              <li>Remove any glasses, hats, or face coverings</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <FaceRegistration
          onFaceRegistered={(faceData) => {
            setFormData(prev => ({
              ...prev,
              faceData: faceData
            }));
          }}
          className="w-full"
        />
      </div>

      {formData.faceData && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Face registration completed successfully!</p>
              <p className="mt-1">Your face profile has been captured and will be used for attendance verification.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 4: Review
  const ReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/60 rounded-xl p-4 border border-white/50 md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
              <p><span className="font-medium">Email:</span> {formData.email}</p>
              <p><span className="font-medium">Phone:</span> {formData.phone}</p>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</p>
              <p><span className="font-medium">Gender:</span> {formData.gender}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 rounded-xl p-4 border border-white/50 md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Face Registration
          </h3>
          {formData.faceData ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Face profile captured successfully</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Face registration is required for attendance verification</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Complete Your Profile Later</p>
            <p className="mt-1">After registration, you can add additional information like address, academic details, and emergency contacts in your profile settings.</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
          />
          <div className="text-sm text-gray-700">
            I agree to the <button type="button" className="text-blue-600 hover:underline">Terms of Service</button> and 
            <button type="button" className="text-blue-600 hover:underline ml-1">Privacy Policy</button>. 
            I understand that my information will be used for educational purposes and account management.
          </div>
        </label>
      </div>
    </div>
  );

  // Important: call the step renderers as functions to avoid React treating them as new component types
  // on each render, which can cause inputs to lose focus. Returning JSX directly preserves focus.
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1: return PersonalInfoStep();
      case 2: return AccountStep();
      case 3: return FaceRegistrationStep();
      case 4: return ReviewStep();
      default: return PersonalInfoStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-200/20 to-green-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/50 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                EduManage Pro
              </span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Student Registration
            </h1>
            <p className="text-gray-600 text-lg">Join our educational community</p>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <IconComponent className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-center mt-2">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-400 hidden sm:block">{step.description}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                      } transition-all duration-300`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
            {/* Error and Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl mb-6">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600 hover:shadow-lg'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.agreeTerms}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    loading || !formData.agreeTerms
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-5 h-5" />
                      Register
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              Already have an account? 
              <button 
                onClick={() => onNavigateToLogin && onNavigateToLogin()}
                className="text-blue-600 hover:text-blue-800 font-medium ml-1 hover:underline"
              >
                Sign In
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at support@edumanagepro.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;