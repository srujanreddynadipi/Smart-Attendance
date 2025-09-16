import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { 
  Camera, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Scan
} from 'lucide-react';

const QRScanner = ({ onScanSuccess, onClose, isActive = true }) => {
  const videoRef = useRef(null);
  const [qrScanner, setQrScanner] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scannedData, setScannedData] = useState('');

  useEffect(() => {
    if (isActive) {
      initializeScanner();
    }
    
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
  }, [isActive]);

  const initializeScanner = async () => {
    try {
      setError('');
      
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);
      
      if (!hasCamera) {
        setError('No camera found on this device');
        return;
      }

      if (videoRef.current) {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => handleScanResult(result),
          {
            onDecodeError: (error) => {
              // Ignore decode errors - they happen when no QR code is visible
              console.debug('QR decode error:', error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera if available
          }
        );

        setQrScanner(scanner);
        await scanner.start();
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error initializing scanner:', error);
      setError('Failed to start camera: ' + error.message);
    }
  };

  const handleScanResult = (result) => {
    const data = result.data || result;
    setScannedData(data);
    setIsScanning(false);
    
    if (qrScanner) {
      qrScanner.stop();
    }
    
    if (onScanSuccess) {
      onScanSuccess(data);
    }
  };

  const restartScanning = async () => {
    try {
      setError('');
      setScannedData('');
      
      if (qrScanner) {
        await qrScanner.start();
        setIsScanning(true);
      } else {
        await initializeScanner();
      }
    } catch (error) {
      setError('Failed to restart scanner: ' + error.message);
    }
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scan className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Scan QR Code</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Position QR code in the camera frame</p>
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

        {/* Scanner Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={initializeScanner}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : !hasCamera ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No camera available</p>
            </div>
          ) : scannedData ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium mb-2">QR Code Scanned!</p>
              <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-100 p-2 rounded">
                {scannedData}
              </p>
              <button
                onClick={restartScanning}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Scan Another
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Container */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-48 sm:h-64 object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-48 sm:h-48 border-2 border-white rounded-2xl relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
                    
                    {/* Scanning line */}
                    {isScanning && (
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500 opacity-75 animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                {isScanning ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs sm:text-sm">Scanning for QR code...</span>
                  </div>
                ) : (
                  <p className="text-gray-600 text-xs sm:text-sm">Camera loading...</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={restartScanning}
                  disabled={!qrScanner}
                  className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restart
                </button>
                <button
                  onClick={stopScanning}
                  disabled={!isScanning}
                  className="flex-1 py-2 sm:py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors text-sm sm:text-base"
                >
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;