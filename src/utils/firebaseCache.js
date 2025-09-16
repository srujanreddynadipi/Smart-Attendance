// Simple in-memory cache for Firebase queries
class FirebaseCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Generate cache key from query parameters
  generateKey(collection, filters = {}, options = {}) {
    const filterStr = Object.entries(filters)
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    const optionsStr = Object.entries(options)
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return `${collection}_${filterStr}_${optionsStr}`;
  }

  // Set cache with TTL (Time To Live)
  set(key, data, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new timer to auto-expire
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
    
    console.log(`📋 Cached data for key: ${key} (TTL: ${ttl}ms)`);
  }

  // Get cached data if valid
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const { data, timestamp, ttl } = cached;
    const age = Date.now() - timestamp;

    if (age > ttl) {
      this.delete(key);
      return null;
    }

    console.log(`✅ Cache hit for key: ${key} (age: ${age}ms)`);
    return data;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    console.log(`🗑️ Cache cleared for key: ${key}`);
  }

  // Clear all cache
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
    console.log('🗑️ All cache cleared');
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, value]) => 
        (now - value.timestamp) <= value.ttl
      ).length,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? 
        Math.min(...entries.map(([_, value]) => value.timestamp)) : null
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    let size = 0;
    this.cache.forEach((value, key) => {
      size += key.length * 2; // chars are 2 bytes
      size += JSON.stringify(value.data).length * 2;
    });
    return Math.round(size / 1024); // KB
  }
}

// Create singleton instance
const firebaseCache = new FirebaseCache();

// Cached Firebase query wrapper
export const cachedFirebaseQuery = async (
  queryFn, 
  cacheKey, 
  ttl = 5 * 60 * 1000 // 5 minutes default
) => {
  // Check cache first
  const cached = firebaseCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true
    };
  }

  try {
    // Execute query
    console.log(`🔄 Executing Firebase query: ${cacheKey}`);
    const result = await queryFn();
    
    // Cache successful results
    if (result.success) {
      firebaseCache.set(cacheKey, result, ttl);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Firebase query failed: ${cacheKey}`, error);
    throw error;
  }
};

// Export cache instance and utilities
export { firebaseCache };

// Cache management hooks for React components
export const useCacheStats = () => {
  const [stats, setStats] = React.useState(firebaseCache.getStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(firebaseCache.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};

// Clear cache function for manual cache busting
export const clearAllCache = () => {
  firebaseCache.clear();
};

export default firebaseCache;