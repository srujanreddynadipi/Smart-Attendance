// Performance monitoring utilities for mobile optimization

// Web Vitals monitoring
export const measureWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Measure largest contentful paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log(`📊 ${entry.entryType}:`, entry.value || entry.duration);
      });
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for older browsers
      console.log('Performance Observer not supported');
    }
  }
};

// Lazy loading images utility
export const lazyLoadImage = (img, src) => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = src;
          image.classList.remove('loading');
          imageObserver.unobserve(image);
        }
      });
    });
    
    imageObserver.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
};

// Bundle size analyzer
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Bundle Analysis:');
    console.log('React bundle loaded');
    console.log('Consider code splitting for large components');
  }
};

// Mobile performance optimizations
export const optimizeForMobile = () => {
  // Disable hover effects on touch devices
  if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
  }
  
  // Optimize scrolling performance
  const scrollableElements = document.querySelectorAll('.overflow-scroll, .overflow-y-auto');
  scrollableElements.forEach(element => {
    element.style.webkitOverflowScrolling = 'touch';
  });
  
  // Prevent zoom on input focus (iOS Safari)
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.getAttribute('type') !== 'range') {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          );
          
          // Restore viewport after blur
          input.addEventListener('blur', () => {
            viewport.setAttribute('content', 
              'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
            );
          }, { once: true });
        }
      });
    }
  });
};

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('❌ SW registration failed: ', registrationError);
        });
    });
  }
};

// Critical resource preloading
export const preloadCriticalResources = () => {
  const criticalImages = [
    '/logo192.png',
    '/logo512.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Font loading optimization
export const optimizeFontLoading = () => {
  if ('fonts' in document) {
    // Preload critical fonts
    const fontPromises = [
      document.fonts.load('400 16px system-ui'),
      document.fonts.load('600 16px system-ui')
    ];
    
    Promise.all(fontPromises).then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
};

// Initialize all performance optimizations
export const initializePerformanceOptimizations = () => {
  measureWebVitals();
  optimizeForMobile();
  registerServiceWorker();
  preloadCriticalResources();
  optimizeFontLoading();
  
  // Monitor memory usage in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(monitorMemoryUsage, 30000); // Every 30 seconds
  }
};