import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Users,
  Edit3,
  Save,
  X,
  Camera,
  Upload,
  Settings,
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Home,
  FileText,
  Award,
  Star,
  Sparkles,
  Lock,
  Globe,
  Heart,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = ({ onBack }) => {
  const { userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // User data from Firebase
  const [userProfile, setUserProfile] = useState({
    firstName: userData?.name?.split(' ')[0] || 'John',
    lastName: userData?.name?.split(' ')[1] || 'Doe',
    email: userData?.email || 'john.doe@university.edu',
    phone: userData?.phone || '+1 (555) 123-4467',
    dateOfBirth: userData?.dateOfBirth || '1999-03-15',
    gender: userData?.gender || 'male',
    bloodGroup: userData?.bloodGroup || 'O+',
    address: userData?.address || '123 University Drive, Apt 4B',
    city: userData?.city || 'New York',
    state: userData?.state || 'New York',
    zipCode: userData?.zipCode || '10001',
    country: userData?.country || 'US',
    studentId: userData?.studentId || 'ST2024001',
    course: userData?.course || 'Computer Science',
    semester: userData?.semester || '3',
    batch: userData?.batch || '2023',
    previousEducation: userData?.previousEducation || 'Central High School, State Board, 2021, 95%',
    emergencyName: userData?.emergencyContactName || 'Jane Doe',
    emergencyPhone: userData?.emergencyContactPhone || '+1 (555) 987-6543',
    emergencyRelation: userData?.emergencyContactRelation || 'parent',
    joinDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '2023-08-15',
    gpa: userData?.gpa || '3.85',
    profileImage: userData?.profileImage || null,
    role: userData?.role || 'student',
    isActive: userData?.isActive || true
  });

  const [editData, setEditData] = useState({ ...userProfile });

  // Update profile when userData changes
  useEffect(() => {
    if (userData) {
      const updatedProfile = {
        firstName: userData?.name?.split(' ')[0] || 'John',
        lastName: userData?.name?.split(' ')[1] || 'Doe',
        email: userData?.email || 'john.doe@university.edu',
        phone: userData?.phone || '+1 (555) 123-4467',
        dateOfBirth: userData?.dateOfBirth || '1999-03-15',
        gender: userData?.gender || 'male',
        bloodGroup: userData?.bloodGroup || 'O+',
        address: userData?.address || '123 University Drive, Apt 4B',
        city: userData?.city || 'New York',
        state: userData?.state || 'New York',
        zipCode: userData?.zipCode || '10001',
        country: userData?.country || 'US',
        studentId: userData?.studentId || 'ST2024001',
        course: userData?.course || 'Computer Science',
        semester: userData?.semester || '3',
        batch: userData?.batch || '2023',
        previousEducation: userData?.previousEducation || 'Central High School, State Board, 2021, 95%',
        emergencyName: userData?.emergencyContactName || 'Jane Doe',
        emergencyPhone: userData?.emergencyContactPhone || '+1 (555) 987-6543',
        emergencyRelation: userData?.emergencyContactRelation || 'parent',
        joinDate: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '2023-08-15',
        gpa: userData?.gpa || '3.85',
        profileImage: userData?.profileImage || null,
        role: userData?.role || 'student',
        isActive: userData?.isActive || true
      };
      setUserProfile(updatedProfile);
      setEditData(updatedProfile);
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
        setEditData(prev => ({ ...prev, profileImage: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserProfile({ ...editData });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
    setProfileImage(userData.profileImage);
  };

  const courseNames = {
    'computer-science': 'Computer Science',
    'information-technology': 'Information Technology',
    'business-administration': 'Business Administration',
    'engineering': 'Engineering',
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'english': 'English Literature',
    'psychology': 'Psychology'
  };

  const countryNames = {
    'US': 'United States',
    'CA': 'Canada',
    'UK': 'United Kingdom',
    'AU': 'Australia',
    'IN': 'India',
    'DE': 'Germany',
    'FR': 'France'
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Profile Overview Section
  const ProfileOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1">
            <div className="w-full h-full rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {profileImage || userData.profileImage ? (
                  <img 
                    src={profileImage || userData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          {isEditing && (
            <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {userData.firstName} {userData.lastName}
        </h1>
        <p className="text-gray-600 text-lg flex items-center justify-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {courseNames[userData.course]} Student
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {new Date(userData.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            GPA: {userData.gpa}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Current Semester</p>
              <p className="text-2xl font-bold text-blue-800">{userData.semester}rd</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Batch Year</p>
              <p className="text-2xl font-bold text-green-800">{userData.batch}</p>
            </div>
            <Award className="w-10 h-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Student ID</p>
              <p className="text-2xl font-bold text-purple-800">{userData.studentId}</p>
            </div>
            <FileText className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Personal Information
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={editData.firstName}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={editData.lastName}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={editData.phone}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </label>
            {isEditing ? (
              <input
                type="date"
                name="dateOfBirth"
                value={editData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">
                {new Date(userData.dateOfBirth).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            {isEditing ? (
              <select
                name="gender"
                value={editData.gender}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700 capitalize">{userData.gender}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Blood Group
            </label>
            {isEditing ? (
              <select
                name="bloodGroup"
                value={editData.bloodGroup}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.bloodGroup}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <MapPin className="w-6 h-6 text-green-500" />
          Address Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            {isEditing ? (
              <textarea
                name="address"
                value={editData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={editData.city}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
            {isEditing ? (
              <input
                type="text"
                name="state"
                value={editData.state}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
            {isEditing ? (
              <input
                type="text"
                name="zipCode"
                value={editData.zipCode}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.zipCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Country
            </label>
            {isEditing ? (
              <select
                name="country"
                value={editData.country}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{countryNames[userData.country]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-red-500" />
          Emergency Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="emergencyName"
                value={editData.emergencyName}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.emergencyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                name="emergencyPhone"
                value={editData.emergencyPhone}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.emergencyPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            {isEditing ? (
              <select
                name="emergencyRelation"
                value={editData.emergencyRelation}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sibling">Sibling</option>
                <option value="spouse">Spouse</option>
                <option value="relative">Relative</option>
                <option value="friend">Friend</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700 capitalize">{userData.emergencyRelation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Academic Information Section
  const AcademicSection = () => (
    <div className="space-y-6">
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-purple-500" />
          Academic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
            <p className="p-3 bg-gray-50 rounded-xl text-gray-700 font-mono">{userData.studentId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course/Program</label>
            {isEditing ? (
              <select
                name="course"
                value={editData.course}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="computer-science">Computer Science</option>
                <option value="information-technology">Information Technology</option>
                <option value="business-administration">Business Administration</option>
                <option value="engineering">Engineering</option>
                <option value="mathematics">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
                <option value="english">English Literature</option>
                <option value="psychology">Psychology</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{courseNames[userData.course]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
            {isEditing ? (
              <select
                name="semester"
                value={editData.semester}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.semester}rd Semester</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch/Year</label>
            {isEditing ? (
              <select
                name="batch"
                value={editData.batch}
                onChange={handleInputChange}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.batch}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous Education</label>
            {isEditing ? (
              <textarea
                name="previousEducation"
                value={editData.previousEducation}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="School/College name, Board/University, Year, Percentage/GPA"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-xl text-gray-700">{userData.previousEducation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Academic Performance */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-yellow-500" />
          Academic Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Current GPA</p>
                <p className="text-3xl font-bold text-green-700">{userData.gpa}</p>
                <p className="text-xs text-green-500">out of 4.0</p>
              </div>
              <Star className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Academic Status</p>
                <p className="text-xl font-bold text-blue-700">Good Standing</p>
                <p className="text-xs text-blue-500">No academic warnings</p>
              </div>
              <Activity className="w-12 h-12 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      {/* Account Security */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-red-500" />
          Account Security
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="w-full pl-10 pr-12 p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button className="mt-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
              Update Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-yellow-500" />
          Notification Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive updates about your account and courses</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">SMS Notifications</h4>
              <p className="text-sm text-gray-600">Get text messages for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Push Notifications</h4>
              <p className="text-sm text-gray-600">Browser notifications for real-time updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Eye className="w-6 h-6 text-purple-500" />
          Privacy Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Profile Visibility</h4>
              <p className="text-sm text-gray-600">Control who can see your profile information</p>
            </div>
            <select className="p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Contact Information</h4>
              <p className="text-sm text-gray-600">Allow others to see your contact details</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-gray-500" />
          Account Actions
        </h3>

        <div className="space-y-4">
          <button className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-left">
            Download My Data
          </button>
          
          <button className="w-full p-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors text-left">
            Deactivate Account
          </button>
          
          <button className="w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-left">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'profile': return <ProfileOverview />;
      case 'academic': return <AcademicSection />;
      case 'settings': return <SettingsSection />;
      default: return <ProfileOverview />;
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
        <div className="max-w-6xl mx-auto mb-8">
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
              Student Profile
            </h1>
            <p className="text-gray-600 text-lg">Manage your account and preferences</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/50">
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Success/Error Messages */}
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

          {renderContent()}

          {/* Action Buttons for Editing Mode */}
          {isEditing && (
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto mt-12 text-center">
          <p className="text-xs text-gray-500">
            Need help with your profile? Contact our support team at support@edumanagepro.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;