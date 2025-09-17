import React, { useState, useEffect } from 'react';
import { 
  User, ArrowLeft, Edit3, Save, X,
  Home, BookOpen, Users, AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ProfilePage = ({ onBack }) => {
  const { userData, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    // Personal Information (from registration)
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    
    // Address Information (new)
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Academic Information (new)
    studentId: '',
    course: '',
    semester: '',
    batch: '',
    previousEducation: '',
    
    // Emergency Contact (new)
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    
    // Additional
    bloodGroup: '',
    profileCompleted: false
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        address: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        zipCode: userData.address?.zipCode || '',
        country: userData.address?.country || '',
        studentId: userData.studentId || '',
        course: userData.academic?.course || '',
        semester: userData.academic?.semester || '',
        batch: userData.academic?.batch || '',
        previousEducation: userData.academic?.previousEducation || '',
        emergencyName: userData.emergencyContact?.name || '',
        emergencyPhone: userData.emergencyContact?.phone || '',
        emergencyRelation: userData.emergencyContact?.relation || '',
        bloodGroup: userData.bloodGroup || '',
        profileCompleted: userData.profileCompleted || false
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        address: {
          street: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
          country: profileData.country
        },
        academic: {
          course: profileData.course,
          semester: profileData.semester,
          batch: profileData.batch,
          previousEducation: profileData.previousEducation
        },
        emergencyContact: {
          name: profileData.emergencyName,
          phone: profileData.emergencyPhone,
          relation: profileData.emergencyRelation
        },
        bloodGroup: profileData.bloodGroup,
        studentId: profileData.studentId,
        profileCompleted: true,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(userDocRef, updateData);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        address: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        zipCode: userData.address?.zipCode || '',
        country: userData.address?.country || '',
        studentId: userData.studentId || '',
        course: userData.academic?.course || '',
        semester: userData.academic?.semester || '',
        batch: userData.academic?.batch || '',
        previousEducation: userData.academic?.previousEducation || '',
        emergencyName: userData.emergencyContact?.name || '',
        emergencyPhone: userData.emergencyContact?.phone || '',
        emergencyRelation: userData.emergencyContact?.relation || '',
        bloodGroup: userData.bloodGroup || '',
        profileCompleted: userData.profileCompleted || false
      });
    }
    setIsEditing(false);
    setError('');
  };

  const isProfileIncomplete = () => {
    return !profileData.address || !profileData.course || !profileData.emergencyName;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
          <Info className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Profile Completion Warning */}
      {isProfileIncomplete() && !isEditing && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">Complete Your Profile</p>
            <p className="text-yellow-700 text-sm">Add your address, academic details, and emergency contact to complete your profile.</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{profileData.name || 'Student Name'}</h2>
            <p className="text-gray-600">{profileData.studentId || 'Student ID not set'}</p>
            <p className="text-gray-600">{profileData.course || 'Course not specified'}</p>
            {profileData.profileCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mt-1">
                <Info className="w-3 h-3" />
                Profile Complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.name || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="p-3 bg-gray-100 rounded-xl text-gray-600">{profileData.email} (Cannot be changed)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.phone || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.dateOfBirth || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              {isEditing ? (
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.gender || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              {isEditing ? (
                <select
                  name="bloodGroup"
                  value={profileData.bloodGroup}
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
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.bloodGroup || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            Address Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street, Apartment 4B"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl min-h-[80px]">{profileData.address || 'Not specified'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.city || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.state || 'Not specified'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="zipCode"
                    value={profileData.zipCode}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.zipCode || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                {isEditing ? (
                  <select
                    name="country"
                    value={profileData.country}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                ) : (
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.country || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Academic Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              {isEditing ? (
                <input
                  type="text"
                  name="studentId"
                  value={profileData.studentId}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ST2024001"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.studentId || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program</label>
              {isEditing ? (
                <select
                  name="course"
                  value={profileData.course}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Course</option>
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
                <p className="p-3 bg-white/60 rounded-xl">{profileData.course || 'Not specified'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                {isEditing ? (
                  <select
                    name="semester"
                    value={profileData.semester}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
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
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.semester ? `${profileData.semester}st Semester` : 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch/Year</label>
                {isEditing ? (
                  <select
                    name="batch"
                    value={profileData.batch}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Batch</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                ) : (
                  <p className="p-3 bg-white/60 rounded-xl">{profileData.batch || 'Not specified'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Education</label>
              {isEditing ? (
                <textarea
                  name="previousEducation"
                  value={profileData.previousEducation}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="High School Name, Board/University, Year of Graduation, Percentage/GPA"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl min-h-[80px]">{profileData.previousEducation || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Emergency Contact
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="emergencyName"
                  value={profileData.emergencyName}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.emergencyName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={profileData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 987-6543"
                />
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.emergencyPhone || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              {isEditing ? (
                <select
                  name="emergencyRelation"
                  value={profileData.emergencyRelation}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Relationship</option>
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse</option>
                  <option value="relative">Relative</option>
                  <option value="friend">Friend</option>
                </select>
              ) : (
                <p className="p-3 bg-white/60 rounded-xl">{profileData.emergencyRelation || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
