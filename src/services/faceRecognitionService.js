import * as faceapi from 'face-api.js';

class FaceRecognitionService {
  constructor() {
    this.isInitialized = false;
    this.modelsLoaded = false;
  }

  // Initialize face-api.js and load models
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing face recognition service...');
      
      // Load models from public/models directory
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('✅ Face recognition models loaded successfully');
      
    } catch (error) {
      console.error('❌ Error initializing face recognition:', error);
      throw new Error('Failed to initialize face recognition service');
    }
  }

  // Detect faces in an image/video element
  async detectFaces(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections;
    } catch (error) {
      console.error('❌ Error detecting faces:', error);
      return [];
    }
  }

  // Get face descriptor (encoding) from image
  async getFaceDescriptor(imageElement) {
    const detections = await this.detectFaces(imageElement);
    
    if (detections.length === 0) {
      throw new Error('No face detected in the image');
    }
    
    if (detections.length > 1) {
      throw new Error('Multiple faces detected. Please ensure only one face is visible');
    }

    return detections[0].descriptor;
  }

  // Compare two face descriptors
  compareFaces(descriptor1, descriptor2, threshold = 0.45) {
    if (!descriptor1 || !descriptor2) {
      return { match: false, distance: 1, confidence: 0 };
    }

    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const match = distance < threshold;
  // Map distance [0,1] to confidence [100..0]; clamp to [0,100]
  const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

    return {
      match,
      distance,
      confidence: Math.round(confidence)
    };
  }

  // Verify face against stored descriptor
  async verifyFace(imageElement, storedDescriptor, threshold = 0.45) {
    try {
      const currentDescriptor = await this.getFaceDescriptor(imageElement);
      const result = this.compareFaces(currentDescriptor, storedDescriptor, threshold);
      
      return {
        success: result.match,
        confidence: result.confidence,
        distance: result.distance,
        message: result.match 
          ? `Face verified with ${result.confidence}% confidence` 
          : `Face verification failed (${result.confidence}% confidence)`
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  // Register a new face (get descriptor for storage)
  async registerFace(imageElement) {
    try {
      const descriptor = await this.getFaceDescriptor(imageElement);
      
      return {
        success: true,
        descriptor: Array.from(descriptor), // Convert Float32Array to regular array for storage
        message: 'Face registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Find best match from multiple stored descriptors
  findBestMatch(currentDescriptor, storedDescriptors, labels, threshold = 0.45) {
    let bestMatch = null;
    let bestDistance = Infinity;

    storedDescriptors.forEach((descriptor, index) => {
      const distance = faceapi.euclideanDistance(currentDescriptor, new Float32Array(descriptor));
      
      if (distance < bestDistance && distance < threshold) {
        bestDistance = distance;
        bestMatch = {
          label: labels[index],
          distance: distance,
          confidence: Math.round((1 - distance) * 100)
        };
      }
    });

    return bestMatch;
  }

  // Identify face from multiple registered faces
  async identifyFace(imageElement, faceDatabase) {
    try {
      const currentDescriptor = await this.getFaceDescriptor(imageElement);
      
      const descriptors = faceDatabase.map(face => face.descriptor);
      const labels = faceDatabase.map(face => face.label || face.studentId);
      
      const bestMatch = this.findBestMatch(currentDescriptor, descriptors, labels);
      
      if (bestMatch) {
        return {
          success: true,
          match: bestMatch,
          message: `Identified as ${bestMatch.label} with ${bestMatch.confidence}% confidence`
        };
      } else {
        return {
          success: false,
          message: 'No matching face found in database'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if image has good quality for face recognition
  async validateImageQuality(imageElement) {
    const detections = await this.detectFaces(imageElement);
    
    if (detections.length === 0) {
      return { valid: false, message: 'No face detected' };
    }
    
    if (detections.length > 1) {
      return { valid: false, message: 'Multiple faces detected' };
    }

    const detection = detections[0];
    const box = detection.detection.box;
    
    // Check face size (should be at least 80x80 pixels)
    if (box.width < 80 || box.height < 80) {
      return { valid: false, message: 'Face too small - please move closer' };
    }

    // Check if face is too close to edges
    const imageWidth = imageElement.width || imageElement.videoWidth;
    const imageHeight = imageElement.height || imageElement.videoHeight;
    
    if (box.x < 10 || box.y < 10 || 
        box.x + box.width > imageWidth - 10 || 
        box.y + box.height > imageHeight - 10) {
      return { valid: false, message: 'Please center your face in the frame' };
    }

    return { valid: true, message: 'Face quality is good' };
  }

  // Detect eye landmarks for blink detection
  async detectEyeLandmarks(imageElement) {
    try {
      const detections = await this.detectFaces(imageElement);
      
      if (detections.length === 0) {
        return { success: false, message: 'No face detected' };
      }

      if (detections.length > 1) {
        return { success: false, message: 'Multiple faces detected' };
      }

      const landmarks = detections[0].landmarks;
      
      // Extract eye landmarks (points 36-47)
      const leftEye = landmarks.positions.slice(36, 42); // Left eye points
      const rightEye = landmarks.positions.slice(42, 48); // Right eye points
      
      return {
        success: true,
        leftEye,
        rightEye,
        landmarks: landmarks.positions
      };
    } catch (error) {
      console.error('Error detecting eye landmarks:', error);
      return { success: false, message: 'Failed to detect eye landmarks' };
    }
  }

  // Calculate Eye Aspect Ratio (EAR) for blink detection
  calculateEAR(eyePoints) {
    if (eyePoints.length !== 6) {
      return 0;
    }

    // Calculate distances between eye landmark points
    const p1 = eyePoints[1]; // Top left
    const p2 = eyePoints[5]; // Top right
    const p3 = eyePoints[2]; // Middle top
    const p4 = eyePoints[4]; // Middle bottom
    const p5 = eyePoints[0]; // Left corner
    const p6 = eyePoints[3]; // Right corner

    // Vertical distances
    const d1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
    const d2 = Math.sqrt(Math.pow(p3.x - p4.x, 2) + Math.pow(p3.y - p4.y, 2));
    
    // Horizontal distance
    const d3 = Math.sqrt(Math.pow(p1.x - p5.x, 2) + Math.pow(p1.y - p5.y, 2));

    // Eye Aspect Ratio
    const ear = (d1 + d2) / (2.0 * d3);
    return ear;
  }

  // Detect if eyes are blinking based on EAR threshold
  async detectBlink(imageElement, earThreshold = 0.25) {
    try {
      const eyeData = await this.detectEyeLandmarks(imageElement);
      
      if (!eyeData.success) {
        return { success: false, message: eyeData.message };
      }

      const leftEAR = this.calculateEAR(eyeData.leftEye);
      const rightEAR = this.calculateEAR(eyeData.rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      const isBlinking = avgEAR < earThreshold;
      
      return {
        success: true,
        isBlinking,
        leftEAR,
        rightEAR,
        avgEAR,
        threshold: earThreshold
      };
    } catch (error) {
      console.error('Error detecting blink:', error);
      return { success: false, message: 'Failed to detect blink' };
    }
  }

  // Verify face with multiple frames for better accuracy
  async verifyFaceMultiFrame(videoElement, storedDescriptor, frameCount = 3, threshold = 0.45) {
    try {
      const results = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      for (let i = 0; i < frameCount; i++) {
        // Capture frame from video
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load frame'));
          img.src = imageData;
        });

        // Get face descriptor for this frame
        try {
          const descriptor = await this.getFaceDescriptor(img);
          const comparison = this.compareFaces(descriptor, storedDescriptor, threshold);
          
          results.push({
            frameIndex: i,
            match: comparison.match,
            distance: comparison.distance,
            confidence: comparison.confidence
          });
        } catch (error) {
          console.warn(`Frame ${i} failed:`, error.message);
          results.push({
            frameIndex: i,
            match: false,
            distance: 1,
            confidence: 0,
            error: error.message
          });
        }

        // Wait between frames
        if (i < frameCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Analyze results
      const validFrames = results.filter(r => !r.error);
      const matchingFrames = validFrames.filter(r => r.match);
      
      const successRate = validFrames.length > 0 ? matchingFrames.length / validFrames.length : 0;
      const avgConfidence = validFrames.length > 0 
        ? validFrames.reduce((sum, r) => sum + r.confidence, 0) / validFrames.length 
        : 0;
      
      const isVerified = successRate >= 0.67; // At least 2/3 frames must match
      
      return {
        success: isVerified,
        results,
        successRate: Math.round(successRate * 100),
        avgConfidence: Math.round(avgConfidence),
        validFrames: validFrames.length,
        matchingFrames: matchingFrames.length,
        message: isVerified 
          ? `Face verified across ${matchingFrames.length}/${validFrames.length} frames`
          : `Verification failed - only ${matchingFrames.length}/${validFrames.length} frames matched`
      };
    } catch (error) {
      console.error('Multi-frame verification error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Multi-frame verification failed'
      };
    }
  }

  // Check if face encoding quality is good enough
  async checkEncodingQuality(descriptor, qualityThreshold = 0.1) {
    try {
      if (!descriptor || descriptor.length === 0) {
        return { 
          isGoodQuality: false, 
          quality: 0,
          message: 'No face descriptor available' 
        };
      }

      // Calculate descriptor variance as a quality metric
      const mean = descriptor.reduce((sum, val) => sum + val, 0) / descriptor.length;
      const variance = descriptor.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / descriptor.length;
      const quality = Math.min(variance, 1); // Normalize to 0-1

      const isGoodQuality = quality > qualityThreshold;
      
      return {
        isGoodQuality,
        quality: Math.round(quality * 100),
        variance,
        message: isGoodQuality 
          ? 'Face encoding quality is good'
          : 'Face encoding quality is poor - consider re-registering'
      };
    } catch (error) {
      console.error('Error checking encoding quality:', error);
      return {
        isGoodQuality: false,
        quality: 0,
        message: 'Failed to check encoding quality'
      };
    }
  }

  // Compute distance between two face descriptors
  computeFaceDistance(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) {
      return 1; // Maximum distance if either descriptor is missing
    }
    
    try {
      // Use face-api.js euclidean distance calculation
      return faceapi.euclideanDistance(descriptor1, descriptor2);
    } catch (error) {
      console.error('Error computing face distance:', error);
      return 1; // Return max distance on error
    }
  }
}

// Export singleton instance
const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;