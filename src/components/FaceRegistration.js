import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertCircle, RefreshCw, User } from 'lucide-react';
import faceRecognitionService from '../services/faceRecognitionService';

// Note: This component now ONLY captures face data and returns it to the parent.
// It no longer attempts to persist to Firestore; the parent should do so after the user is created.
const FaceRegistration = ({ onFaceRegistered, onRegistrationComplete, onSkip }) => {
  const webcamRef = useRef(null);
  const [step, setStep] = useState('instructions'); // instructions, capture, processing, success, error
  const [capturedImage, setCapturedImage] = useState(null);
  // removed isProcessing state; processing UI uses dedicated 'processing' step
  const [error, setError] = useState('');
  const [faceQuality, setFaceQuality] = useState(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Initialize face recognition service
  useEffect(() => {
    const initService = async () => {
      try {
        await faceRecognitionService.initialize();
      } catch (error) {
        setError('Failed to initialize face recognition: ' + error.message);
      }
    };
    initService();
  }, []);

  // Check face quality in real-time
  useEffect(() => {
    if (step === 'capture' && webcamRef.current) {
      const interval = setInterval(async () => {
        const video = webcamRef.current.video;
        if (video && video.readyState === 4) {
          try {
            const quality = await faceRecognitionService.validateImageQuality(video);
            setFaceQuality(quality);
          } catch (error) {
            // Ignore errors during quality check
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step]);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setStep('processing');
      processFaceRegistration(imageSrc);
    }
  };

  const processFaceRegistration = async (imageDataUrl) => {
    setError('');

    try {
      // Create image element from data URL
      const img = new Image();
      img.onload = async () => {
        try {
          // Register the face
          const result = await faceRecognitionService.registerFace(img);
          
          if (result.success) {
            // Emit the descriptor to parent for later persistence
            setStep('success');
            setTimeout(() => {
              // Support both new and old callback prop names for compatibility
              if (onFaceRegistered) onFaceRegistered(result.descriptor);
              if (onRegistrationComplete) onRegistrationComplete(result.descriptor);
            }, 1200);
          } else {
            throw new Error(result.error || 'Face registration failed');
          }
        } catch (error) {
          setError(error.message);
          setStep('error');
        } finally {
          // no processing state toggle needed; step controls the UI
        }
      };
      img.src = imageDataUrl;
    } catch (error) {
      setError(error.message);
      setStep('error');
      // no processing state toggle needed; step controls the UI
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setError('');
    setStep('capture');
  };

  const skipRegistration = () => {
    onSkip && onSkip();
  };

  if (step === 'instructions') {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Face Registration</h3>
          <p className="text-gray-600">Register your face for secure attendance verification</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure good lighting</li>
              <li>• Look directly at the camera</li>
              <li>• Keep your face centered</li>
              <li>• Remove glasses if possible</li>
              <li>• Avoid shadows on your face</li>
              <li>• Your face data will be linked to your account after you finish registration</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setStep('capture')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Start Face Registration
          </button>
          <button
            onClick={skipRegistration}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Skip for Now
          </button>
        </div>
      </div>
    );
  }

  if (step === 'capture') {
    return (
      <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Position Your Face</h3>
          <p className="text-gray-600">Look directly at the camera</p>
        </div>

        <div className="relative mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full rounded-xl"
          />
          
          {/* Face quality indicator */}
          {faceQuality && (
            <div className={`absolute top-2 left-2 px-3 py-1 rounded-lg text-sm font-medium ${
              faceQuality.valid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {faceQuality.message}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={capturePhoto}
            disabled={faceQuality && !faceQuality.valid}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              faceQuality && !faceQuality.valid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Camera className="w-5 h-5 inline mr-2" />
            Capture Photo
          </button>
          <button
            onClick={skipRegistration}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Skip Registration
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-6">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Face...</h3>
        <p className="text-gray-600">Please wait while we register your face</p>
        
        {capturedImage && (
          <div className="mt-4">
            <img 
              src={capturedImage} 
              alt="Captured face" 
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-200"
            />
          </div>
        )}
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-600 mb-2">Face Registered!</h3>
        <p className="text-gray-600 mb-4">Your face has been successfully registered for attendance</p>
        
        {capturedImage && (
          <div className="mt-4">
            <img 
              src={capturedImage} 
              alt="Registered face" 
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-green-200"
            />
          </div>
        )}
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-red-600 mb-2">Registration Failed</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        
        <div className="space-y-3">
          <button
            onClick={retryCapture}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={skipRegistration}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Skip Registration
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FaceRegistration;