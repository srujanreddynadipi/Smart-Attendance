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
  compareFaces(descriptor1, descriptor2, threshold = 0.6) {
    if (!descriptor1 || !descriptor2) {
      return { match: false, distance: 1, confidence: 0 };
    }

    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const match = distance < threshold;
    const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

    return {
      match,
      distance,
      confidence: Math.round(confidence)
    };
  }

  // Verify face against stored descriptor
  async verifyFace(imageElement, storedDescriptor, threshold = 0.6) {
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
  findBestMatch(currentDescriptor, storedDescriptors, labels, threshold = 0.6) {
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
}

// Export singleton instance
const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;