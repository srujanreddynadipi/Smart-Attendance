import React, { useState, useEffect } from 'react';
import { Activity, Clock, Database, Zap } from 'lucide-react';

export const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Track page load time
    const loadTime = performance.now();
    
    // Track memory usage if available
    const updateMetrics = () => {
      const renderTime = performance.now() - loadTime;
      
      let memoryUsage = 0;
      if ('memory' in performance) {
        memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
      }

      // Count network requests
      const networkRequests = performance.getEntriesByType('resource').length;

      setMetrics({
        loadTime: Math.round(loadTime),
        renderTime: Math.round(renderTime),
        memoryUsage,
        networkRequests
      });
    };

    // Update metrics after component mounts
    const timer = setTimeout(updateMetrics, 1000);
    
    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Load Time</span>
              </div>
              <span className="text-sm font-medium">{metrics.loadTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Render Time</span>
              </div>
              <span className="text-sm font-medium">{metrics.renderTime}ms</span>
            </div>
            
            {metrics.memoryUsage > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Memory</span>
                </div>
                <span className="text-sm font-medium">{metrics.memoryUsage}MB</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Requests</span>
              </div>
              <span className="text-sm font-medium">{metrics.networkRequests}</span>
            </div>
          </div>
          
          {/* Performance Status */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className={`text-xs font-medium text-center py-1 px-2 rounded ${
              metrics.renderTime < 1000 ? 'bg-green-100 text-green-700' :
              metrics.renderTime < 3000 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {metrics.renderTime < 1000 ? 'Excellent' :
               metrics.renderTime < 3000 ? 'Good' : 'Needs Optimization'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Performance tips component
export const PerformanceTips = ({ show, onClose }) => {
  if (!show) return null;

  const tips = [
    {
      title: "Enable Browser Caching",
      description: "Configure your server to cache static resources for better loading times.",
      icon: Database
    },
    {
      title: "Optimize Images",
      description: "Use WebP format and proper image compression to reduce bundle size.",
      icon: Zap
    },
    {
      title: "Lazy Load Components",
      description: "Load heavy components only when needed using React.lazy().",
      icon: Activity
    },
    {
      title: "Monitor Network Requests",
      description: "Reduce unnecessary API calls and implement proper caching strategies.",
      icon: Clock
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Performance Optimization Tips</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{tip.title}</h3>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};