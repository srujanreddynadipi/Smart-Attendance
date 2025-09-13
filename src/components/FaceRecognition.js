import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  User,
  RefreshCw
} from 'lucide-react';

const FaceRecognition = ({ onVerificationSuccess, onClose, studentData }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('capture'); // capture, verify, success, error

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user', // Front camera
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setStep('verify');
    }
  };

  const simulateFaceVerification = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      // Simulate face recognition process (3-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, we'll simulate a successful verification
      // In a real app, this would call an actual face recognition API
      const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
      if (confidence > 0.75) {
        setVerificationResult({
          success: true,
          confidence: confidence,
          message: 'Face verification successful!'
        });
        setStep('success');
        
        // Call success callback after a brief delay
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess({
              verified: true,
              confidence: confidence,
              timestamp: new Date(),
              image: capturedImage
            });
          }
        }, 1500);
      } else {
        setVerificationResult({
          success: false,
          confidence: confidence,
          message: 'Face verification failed. Please try again.'
        });
        setStep('error');
      }
    } catch (error) {
      setError('Verification failed: ' + error.message);
      setStep('error');
    }
    
    setIsVerifying(false);
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError('');
    setStep('capture');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Face Verification</h3>
                <p className="text-sm text-gray-600">Verify your identity to mark attendance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'capture' && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Student:</strong> {studentData?.name || 'Unknown'}
                </p>
                <p className="text-sm text-blue-600">
                  Position your face in the camera frame and click capture
                </p>
              </div>

              {/* Camera */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-64 object-cover"
                />
                
                {/* Face detection overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-56 border-2 border-white rounded-full relative opacity-75">
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Make sure your face is clearly visible and well-lit
                </p>
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              {/* Captured Image */}
              <div className="text-center">
                <div className="inline-block p-2 bg-gray-100 rounded-xl">
                  <img 
                    src={capturedImage} 
                    alt="Captured face" 
                    className="w-48 h-36 object-cover rounded-lg"
                  />
                </div>
              </div>

              {/* Verification Status */}
              {isVerifying ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-blue-600 font-medium">Verifying face...</p>
                  <p className="text-sm text-gray-600">This may take a few seconds</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={retryCapture}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={simulateFaceVerification}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Verify Face
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'success' && verificationResult?.success && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Verification Successful!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Confidence: {Math.round(verificationResult.confidence * 100)}%
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  Your attendance has been marked successfully.
                </p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Verification Failed</h3>
              <p className="text-sm text-gray-600 mb-4">
                {error || verificationResult?.message || 'Please try again'}
              </p>
              <button
                onClick={retryCapture}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;