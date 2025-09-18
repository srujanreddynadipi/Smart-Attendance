import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw, Zap, Activity } from 'lucide-react';
import mediaPipeArcFaceService from '../services/mediaPipeArcFaceService';
import faceEmbeddingDatabase from '../firebase/faceEmbeddingDatabase';

const FaceRecognition = ({ 
  onVerificationSuccess, 
  onClose, 
  studentData, 
  expectedStudentId 
}) => {
  const [step, setStep] = useState('camera'); // camera -> processing -> success/error
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    initializeCamera();
    return () => cleanup();
  }, []);

  const initializeCamera = async () => {
    try {
      setStatus('Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Camera ready - Click "Verify Face" to start verification');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('Camera access denied. Please allow camera permissions.');
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startVerification = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setStep('processing');
    setStatus('Initializing face recognition...');

    try {
      // Initialize MediaPipe + ArcFace
      setStatus('Loading AI models...');
      await mediaPipeArcFaceService.initialize();
      
      // Get stored face embedding
      setStatus('Retrieving your registered face...');
      const targetId = expectedStudentId || studentData?.studentId || studentData?.uid;
      if (!targetId) {
        throw new Error('Missing student ID for verification.');
      }

      let storedEmbedding = await faceEmbeddingDatabase.getFaceEmbedding(targetId);
      
      // If new embedding not found, check legacy storage and migrate
      if (!storedEmbedding.success) {
        setStatus('Checking legacy face data...');
        const legacyData = await faceEmbeddingDatabase.getLegacyFaceData(targetId);
        
        if (legacyData.success) {
          setStatus('Migrating your face data to new system...');
          // Convert legacy descriptor to embedding format if possible
          // For now, we'll show an error asking to re-register
          throw new Error('Your face data needs to be updated. Please register your face again using the new system.');
        } else {
          throw new Error('No registered face found. Please register your face first.');
        }
      }

      // Verify face quality first
      setStatus('Analyzing face quality...');
      const detectResult = await mediaPipeArcFaceService.detectFace(videoRef.current);
      
      if (!detectResult.success) {
        throw new Error('No face detected. Please ensure your face is clearly visible.');
      }

      // Perform verification
      setStatus('Verifying your identity...');
      const verifyResult = await mediaPipeArcFaceService.verifyFace(
        videoRef.current,
        storedEmbedding.embedding,
        0.6 // Threshold for ArcFace (more lenient than euclidean distance)
      );

      setConfidence(verifyResult.confidence);
      setVerificationDetails(verifyResult);

      if (verifyResult.success) {
        setStep('success');
        setStatus(`Identity verified with ${verifyResult.confidence}% confidence`);
        
        // Log successful verification
        await faceEmbeddingDatabase.logVerificationAttempt(
          targetId, 
          true, 
          verifyResult.confidence,
          { similarity: verifyResult.similarity, distance: verifyResult.distance }
        );
        
        setTimeout(() => {
          onVerificationSuccess?.(true);
        }, 2000);
      } else {
        throw new Error(`Identity verification failed (${verifyResult.confidence}% confidence)`);
      }

    } catch (error) {
      console.error('Verification error:', error);
      setStep('error');
      setStatus(error.message);
      
      // Log failed verification
      const targetId = expectedStudentId || studentData?.studentId || studentData?.uid;
      if (targetId) {
        await faceEmbeddingDatabase.logVerificationAttempt(
          targetId, 
          false, 
          confidence,
          { error: error.message }
        );
      }
      
    } finally {
      setIsProcessing(false);
    }
  };

  const retry = () => {
    setStep('camera');
    setConfidence(0);
    setVerificationDetails(null);
    setStatus('Camera ready - Click "Verify Face" to start verification');
  };

  const getStatusColor = () => {
    switch (step) {
      case 'processing': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressWidth = () => {
    switch (step) {
      case 'camera': return '25%';
      case 'processing': return '75%';
      case 'success': return '100%';
      case 'error': return '50%';
      default: return '0%';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Face Verification</h3>
            <p className="text-sm text-gray-500">AI-powered identity verification</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getProgressWidth() }}
            />
          </div>
        </div>

        {/* Camera View */}
        <div className="relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Overlay Effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            {step === 'processing' && (
              <div className="bg-blue-500 bg-opacity-90 text-white px-6 py-3 rounded-lg flex items-center animate-pulse">
                <Zap className="mr-2 animate-spin" size={20} />
                Processing...
              </div>
            )}
            
            {step === 'success' && (
              <div className="bg-green-500 bg-opacity-90 text-white px-6 py-3 rounded-lg flex items-center">
                <CheckCircle className="mr-2" size={20} />
                Verified!
              </div>
            )}
          </div>

          {/* Face Detection Frame */}
          {step === 'camera' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-400 rounded-lg w-48 h-56 flex items-center justify-center">
                <span className="text-blue-400 text-sm font-medium">Position face here</span>
              </div>
            </div>
          )}
        </div>

        {/* Status and Confidence */}
        <div className="mb-4 text-center">
          <p className={`text-sm font-medium mb-2 ${getStatusColor()}`}>
            {status}
          </p>
          
          {confidence > 0 && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="bg-gray-200 rounded-full h-2 w-24">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    confidence >= 60 ? 'bg-green-500' : 
                    confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{confidence}%</span>
            </div>
          )}
          
          {verificationDetails && step === 'success' && (
            <div className="mt-2 text-xs text-gray-500">
              Similarity: {Math.round(verificationDetails.similarity * 100)}% | 
              Distance: {verificationDetails.distance?.toFixed(3)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {step === 'camera' && (
            <button
              onClick={startVerification}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all"
            >
              <Camera className="mr-2" size={20} />
              Verify Face
            </button>
          )}
          
          {step === 'error' && (
            <button
              onClick={retry}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 flex items-center justify-center font-medium transition-all"
            >
              <RotateCcw className="mr-2" size={20} />
              Try Again
            </button>
          )}

          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Performance Info */}
        {step === 'success' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between text-xs text-green-700">
              <span>Method: MediaPipe + ArcFace</span>
              <span>Speed: ~100ms</span>
            </div>
          </div>
        )}

        {/* Technical Details for Development */}
        {process.env.NODE_ENV === 'development' && verificationDetails && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600">
              <div>Embedding Size: 512 dimensions</div>
              <div>Cosine Similarity: {verificationDetails.similarity?.toFixed(4)}</div>
              <div>Euclidean Distance: {verificationDetails.distance?.toFixed(4)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;