import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  MapPin, 
  BookOpen, 
  Clock, 
  Users, 
  Download, 
  Copy, 
  Check, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { createAttendanceSession, getTeacherSessions, endAttendanceSession } from '../firebase/attendance';
import { useAuth } from '../contexts/AuthContext';

const QRGenerator = ({ onClose, classroomId = null, subjectData = null }) => {
  const { userData } = useAuth();
  const [step, setStep] = useState('form'); // form, generating, generated, error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    subject: subjectData?.name || '',
    subjectCode: subjectData?.code || '',
    classroomId: classroomId || '',
    latitude: '',
    longitude: '',
    address: '',
    duration: '180' // 3 hours default
  });

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setLoading(false);
        setSuccess('Location obtained successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      (error) => {
        setError('Unable to get location: ' + error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateQRCode = async () => {
    if (!formData.subject || !formData.latitude || !formData.longitude) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if userData and uid are available
    if (!userData) {
      setError('User data not available. Please log in again.');
      return;
    }

    if (!userData.uid) {
      setError('User ID not available. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    setStep('generating');

    try {
      // Create attendance session in Firebase
      const result = await createAttendanceSession(userData.uid, {
        subject: formData.subject,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address
      });

      if (result.success) {
        // Generate QR code
        const qrOptions = {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        };

        const qrURL = await QRCode.toDataURL(result.qrData, qrOptions);
        setQrCodeURL(qrURL);
        setSessionData({
          ...result,
          subject: formData.subject,
          location: {
            latitude: formData.latitude,
            longitude: formData.longitude,
            address: formData.address
          }
        });
        setStep('generated');
      } else {
        setError(result.error || 'Failed to create attendance session');
        setStep('form');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
      setStep('form');
    }

    setLoading(false);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `attendance-qr-${formData.subject}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrCodeURL;
    link.click();
  };

  const copyQRData = () => {
    if (sessionData) {
      navigator.clipboard.writeText(sessionData.qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History',
    'Geography',
    'Economics',
    'Psychology'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                  {subjectData ? `Generate QR - ${subjectData.name}` : 'Generate Attendance QR'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {subjectData ? `Create QR code for ${subjectData.code} attendance` : 'Create QR code for class attendance'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          {step === 'form' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Location Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </label>
                  <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Getting...' : 'Get Current'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="0.000001"
                      placeholder="e.g., 40.712776"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="0.000001"
                      placeholder="e.g., -74.005974"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Building, Room 101"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="60">1 Hour</option>
                  <option value="90">1.5 Hours</option>
                  <option value="120">2 Hours</option>
                  <option value="180">3 Hours</option>
                  <option value="240">4 Hours</option>
                </select>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateQRCode}
                disabled={loading || !formData.subject || !formData.latitude || !formData.longitude}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Generating QR Code...' : 'Generate QR Code'}
              </button>
            </div>
          )}

          {step === 'generating' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <QrCode className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Generating QR Code</h3>
              <p className="text-gray-600">Creating attendance session...</p>
            </div>
          )}

          {step === 'generated' && sessionData && (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-2xl">
                  <img 
                    src={qrCodeURL} 
                    alt="Attendance QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-3">Session Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{sessionData.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session ID:</span>
                    <span className="font-mono text-xs">{sessionData.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-xs">{sessionData.location.latitude}, {sessionData.location.longitude}</span>
                  </div>
                  {sessionData.location.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-xs">{sessionData.location.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
                <button
                  onClick={copyQRData}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">Instructions for Students:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Allow location access when prompted</li>
                  <li>Be within 50 meters of the class location</li>
                  <li>Scan this QR code using the app</li>
                  <li>Complete facial recognition verification</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;