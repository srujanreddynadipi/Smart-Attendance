// Location service for getting and verifying student location
export const locationService = {
  // Request location permission explicitly
  requestLocationPermission: async () => {
    return new Promise((resolve, reject) => {
      console.log('🌍 Checking geolocation support...');
      
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('✅ Geolocation is supported, requesting permission...');

      // Try to get position with a short timeout to check permissions
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted:', {
            lat: position.coords.latitude.toFixed(6),
            lon: position.coords.longitude.toFixed(6),
            accuracy: position.coords.accuracy
          });
          resolve('granted');
        },
        (error) => {
          console.error('❌ Location permission error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access denied by user. Please enable location permissions in your browser settings.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable. Please check your GPS settings.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out. Please try again.'));
              break;
            default:
              reject(new Error(`Unknown location error (code: ${error.code}): ${error.message}`));
          }
        },
        {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false // Use less accurate but faster positioning for permission check
        }
      );
    });
  },

  // Get current position with high accuracy
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      console.log('🌍 Getting current position...');
      
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout for mobile
        maximumAge: 30000 // Allow slightly cached location
      };

      console.log('📍 Requesting location with options:', options);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          console.log('✅ Location obtained:', {
            lat: locationData.latitude.toFixed(6),
            lon: locationData.longitude.toFixed(6),
            accuracy: locationData.accuracy + 'm',
            timestamp: new Date(locationData.timestamp).toLocaleTimeString()
          });
          
          resolve(locationData);
        },
        (error) => {
          console.error('❌ getCurrentPosition error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
          
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  },

  // Request location permission
  requestPermission: async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return 'prompt';
    } catch (error) {
      return 'prompt';
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  },

  // Verify if student is within allowed distance of class location
  verifyLocation: (studentLocation, classLocation, toleranceMeters = 50) => {
    console.log('📏 Verifying location distance...');
    console.log('👤 Student location:', {
      lat: studentLocation.latitude,
      lon: studentLocation.longitude
    });
    console.log('🏫 Class location:', {
      lat: classLocation.latitude,
      lon: classLocation.longitude
    });
    
    // Adjust tolerance based on GPS accuracy
    const gpsAccuracy = studentLocation.accuracy || 0;
    const adjustedTolerance = Math.max(toleranceMeters, gpsAccuracy * 2); // Use 2x GPS accuracy or base tolerance, whichever is higher
    
    console.log('📐 Base tolerance:', toleranceMeters + 'm');
    console.log('📱 GPS accuracy:', gpsAccuracy + 'm');
    console.log('📐 Adjusted tolerance:', adjustedTolerance + 'm');

    const distance = locationService.calculateDistance(
      studentLocation.latitude,
      studentLocation.longitude,
      classLocation.latitude,
      classLocation.longitude
    );

    const result = {
      isValid: distance <= adjustedTolerance,
      distance: Math.round(distance),
      tolerance: Math.round(adjustedTolerance),
      accuracy: studentLocation.accuracy,
      baseToleranceUsed: toleranceMeters,
      gpsAccuracyConsidered: gpsAccuracy
    };

    console.log('📊 Distance calculation result:', result);
    return result;
  }
};

export default locationService;