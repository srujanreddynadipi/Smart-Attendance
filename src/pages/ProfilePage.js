import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = ({ onBack }) => {
  const { userData } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-white/70 rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{userData?.name || 'Student Name'}</h2>
            <p className="text-gray-600">{userData?.studentId || 'ST2024001'}</p>
            <p className="text-gray-600">{userData?.academic?.course || 'Computer Science - Final Year'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{userData?.email || 'student@example.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-800">{userData?.phone || '+1 (555) 123-4567'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium text-gray-800">{userData?.dateOfBirth || 'January 15, 2000'}</p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h3>
            
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <User className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium text-gray-800">{userData?.academic?.department || 'Computer Science'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <Calendar className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="font-medium text-gray-800">{userData?.academic?.year || 'Final Year'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
              <MapPin className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm text-gray-600">Campus</p>
                <p className="font-medium text-gray-800">{userData?.academic?.campus || 'Main Campus'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-blue-100 hover:bg-blue-200 rounded-xl text-blue-700 font-medium transition-colors">
            Change Password
          </button>
          <button className="p-4 bg-green-100 hover:bg-green-200 rounded-xl text-green-700 font-medium transition-colors">
            Update Profile
          </button>
          <button className="p-4 bg-purple-100 hover:bg-purple-200 rounded-xl text-purple-700 font-medium transition-colors">
            Privacy Settings
          </button>
          <button className="p-4 bg-orange-100 hover:bg-orange-200 rounded-xl text-orange-700 font-medium transition-colors">
            Notification Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
