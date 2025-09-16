import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  User,
  RefreshCw,
  Loader,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import faceRecognitionService from '../services/faceRecognitionService';
import { getFaceEncoding } from '../firebase/faceDatabase';

const FaceRecognition = ({ onVerificationSuccess, onClose, studentData, expectedStudentId }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('capture'); // capture, liveness, verify, success, error
  const [livenessStep, setLivenessStep] = useState('detect'); // detect, blink, complete
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [eyesOpen, setEyesOpen] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [multiFrameResults, setMultiFrameResults] = useState([]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user', // Front camera
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setStep('liveness');
      setLivenessStep('detect');
      setBlinkDetected(false);
      setEyesOpen(false);
      setLivenessProgress(0);
      startLivenessCheck();
    }
  };

  const startLivenessCheck = async () => {
    if (!webcamRef.current) return;
    
    try {
      console.log('🔍 Starting liveness detection...');
      
      if (!faceRecognitionService.modelsLoaded) {
        await faceRecognitionService.initialize();
      }

      let eyesOpenDetected = false;
      let blinkCount = 0;
      let frameCount = 0;
      const maxFrames = 100; // ~5 seconds at 20 FPS
      
      const checkLiveness = async () => {
        if (frameCount >= maxFrames) {
          if (blinkDetected && blinkCount >= 1) {
            setLivenessStep('complete');
            setLivenessProgress(100);
            setTimeout(() => {
              setStep('verify');
              performMultiFrameVerification();
            }, 1000);
          } else {
            setError('Liveness check failed. Please blink clearly and try again.');
            setStep('error');
          }
          return;
        }

        try {
          const video = webcamRef.current?.video;
          if (!video) return;

          const blinkResult = await faceRecognitionService.detectBlink(video);
          
          if (blinkResult.success) {
            frameCount++;
            const progress = Math.min((frameCount / maxFrames) * 100, 90);
            setLivenessProgress(progress);

            // Detect eyes open state
            if (blinkResult.avgEAR > 0.3 && !eyesOpenDetected) {
              eyesOpenDetected = true;
              setEyesOpen(true);
              setLivenessStep('blink');
            }

            // Detect blink (eyes closed after being open)
            if (blinkResult.isBlinking && eyesOpenDetected && !blinkDetected) {
              blinkCount++;
              setBlinkDetected(true);
              console.log(`✅ Blink detected! Count: ${blinkCount}`);
              
              if (blinkCount >= 1) {
                setLivenessStep('complete');
                setLivenessProgress(100);
                setTimeout(() => {
                  setStep('verify');
                  performMultiFrameVerification();
                }, 1000);
                return;
              }
            }
          }

          // Continue checking
          setTimeout(checkLiveness, 100);
        } catch (error) {
          console.warn('Liveness check frame error:', error);
          setTimeout(checkLiveness, 200);
        }
      };

      checkLiveness();
    } catch (error) {
      console.error('❌ Liveness check initialization failed:', error);
      setError('Liveness detection failed to start. Proceeding with standard verification.');
      setStep('verify');
      performMultiFrameVerification();
    }
  };

  const performMultiFrameVerification = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      console.log('🔍 Starting multi-frame face verification...');
      
      // Check if we have the video element
      const video = webcamRef.current?.video;
      if (!video) {
        throw new Error('Camera not available for verification');
      }

      // Get expected student's face encoding
      const targetId = expectedStudentId || studentData?.studentId || studentData?.uid;
      if (!targetId) {
        throw new Error('Missing student ID for verification.');
      }

      console.log('📊 Retrieving face encoding for student:', targetId);
      const encodingResult = await getFaceEncoding(targetId);
      if (!encodingResult?.success || !encodingResult?.data?.descriptor) {
        throw new Error('No face registered for this account. Please register your face first.');
      }

      // Check encoding quality
      const qualityCheck = await faceRecognitionService.checkEncodingQuality(encodingResult.data.descriptor);
      if (!qualityCheck.isGoodQuality) {
        console.warn('⚠️ Poor encoding quality detected:', qualityCheck.message);
        // Continue but warn user
      }

      const storedDescriptor = new Float32Array(encodingResult.data.descriptor);
      
      // Perform multi-frame verification
      const multiFrameResult = await faceRecognitionService.verifyFaceMultiFrame(
        video, 
        storedDescriptor, 
        3, // 3 frames
        0.45 // threshold
      );

      setMultiFrameResults(multiFrameResult.results || []);

      if (multiFrameResult.success) {
        console.log('🎉 Multi-frame verification successful!');
        setVerificationResult({
          success: true,
          confidence: multiFrameResult.avgConfidence,
          message: `Face verified! ${multiFrameResult.successRate}% frame match rate`,
          multiFrame: true,
          frameDetails: multiFrameResult
        });
        setStep('success');
        
        // Call success callback after a brief delay
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess({
              verified: true,
              success: true,
              confidence: multiFrameResult.avgConfidence,
              studentId: encodingResult.data.studentId || targetId,
              studentName: encodingResult.data.name,
              faceVerified: true,
              livenessVerified: blinkDetected,
              multiFrameVerified: true,
              frameMatchRate: multiFrameResult.successRate,
              timestamp: new Date(),
              image: capturedImage
            });
          }
        }, 1500);
      } else {
        throw new Error(multiFrameResult.message || 'Multi-frame verification failed');
      }
      
    } catch (error) {
      console.error('❌ Multi-frame verification error:', error);
      setVerificationResult({
        success: false,
        confidence: 0,
        message: error.message || 'Face verification failed. Please try again.'
      });
      setError(error.message || 'Verification failed');
      setStep('error');
    }
    
    setIsVerifying(false);
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError('');
    setStep('capture');
    setLivenessStep('detect');
    setBlinkDetected(false);
    setEyesOpen(false);
    setLivenessProgress(0);
    setMultiFrameResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[95vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Face Verification</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Verify your identity to mark attendance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-80px)]">
          {step === 'capture' && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Student:</strong> {studentData?.name || 'Unknown'}
                </p>
                <p className="text-xs sm:text-sm text-blue-600">
                  Position your face in the camera frame and click capture
                </p>
              </div>

              {/* Camera */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] max-w-full">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
                
                {/* Face detection overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-40 sm:w-48 sm:h-56 border-2 border-white rounded-full relative opacity-75">
                    <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    <div className="absolute bottom-12 sm:bottom-16 left-1/2 transform -translate-x-1/2 w-6 h-0.5 sm:w-8 sm:h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Make sure your face is clearly visible and well-lit
                </p>
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base min-h-12 touch-manipulation"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          )}

          {step === 'liveness' && (
            <div className="space-y-4">
              {/* Liveness Check Instructions */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <p className="text-xs sm:text-sm font-medium text-blue-800">Liveness Check</p>
                </div>
                <p className="text-xs sm:text-sm text-blue-600">
                  {livenessStep === 'detect' && "Looking for your face..."}
                  {livenessStep === 'blink' && "Please blink naturally"}
                  {livenessStep === 'complete' && "Liveness verified!"}
                </p>
              </div>

              {/* Live Camera Feed */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] max-w-full">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
                
                {/* Liveness Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-40 sm:w-48 sm:h-56 border-2 border-white rounded-full relative opacity-75">
                    <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    <div className="absolute bottom-12 sm:bottom-16 left-1/2 transform -translate-x-1/2 w-6 h-0.5 sm:w-8 sm:h-1 bg-white rounded-full"></div>
                    
                    {/* Eye indicators */}
                    {eyesOpen && (
                      <div className="absolute top-8 sm:top-12 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-4">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      </div>
                    )}
                    
                    {blinkDetected && (
                      <div className="absolute top-6 sm:top-8 left-1/2 transform -translate-x-1/2">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <div className="bg-black/50 rounded-lg p-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                      <div 
                        className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${livenessProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-xs mt-1 text-center">
                      {livenessStep === 'detect' && "Detecting face..."}
                      {livenessStep === 'blink' && "Blink to continue"}
                      {livenessStep === 'complete' && "Liveness verified!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {eyesOpen ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                  <span className="text-xs sm:text-sm text-gray-600">
                    {eyesOpen ? "Eyes detected" : "Looking for eyes..."}
                  </span>
                </div>
                
                {blinkDetected && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Blink detected!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              {/* Multi-frame Verification Status */}
              {isVerifying ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm sm:text-base text-blue-600 font-medium">Verifying face across multiple frames...</p>
                  <p className="text-xs sm:text-sm text-gray-600">This ensures accurate recognition</p>
                  
                  {/* Frame Results */}
                  {multiFrameResults.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-2">Frame Analysis:</p>
                      <div className="flex justify-center gap-1">
                        {multiFrameResults.map((result, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              result.error ? 'bg-gray-300' :
                              result.match ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={`Frame ${index + 1}: ${result.match ? 'Match' : 'No match'} (${result.confidence}%)`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                    <p className="text-blue-800 text-xs sm:text-sm">
                      Liveness check completed! Proceeding with face verification...
                    </p>
                  </div>
                  <button
                    onClick={retryCapture}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base min-h-10 touch-manipulation"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'success' && verificationResult?.success && (
            <div className="text-center py-6 sm:py-8">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-green-600 mb-2">Verification Successful!</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Confidence: {Math.round(verificationResult.confidence)}%
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="space-y-1 text-xs text-green-800">
                  <div className="flex justify-between items-center">
                    <span>Liveness Check:</span>
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Multi-frame Verification:</span>
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  {verificationResult.frameDetails && (
                    <div className="flex justify-between items-center">
                      <span>Frame Match Rate:</span>
                      <span>{verificationResult.frameDetails.successRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6 sm:py-8">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-red-600 mb-2">Verification Failed</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                {error || verificationResult?.message || 'Please try again'}
              </p>
              <button
                onClick={retryCapture}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base min-h-10 touch-manipulation"
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