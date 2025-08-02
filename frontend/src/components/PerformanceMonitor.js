import { useEffect } from 'react';

const PerformanceMonitor = () => {
  useEffect(() => {
    // Core Web Vitals monitoring
    const observeWebVitals = () => {
      // Largest Contentful Paint (LCP)
      const observeLCP = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // Report LCP to analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vital', {
            name: 'LCP',
            value: Math.round(lastEntry.startTime),
            event_category: 'Web Vitals'
          });
        }
        
        console.log('LCP:', lastEntry.startTime);
      });
      
      // First Input Delay (FID)
      const observeFID = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vital', {
              name: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              event_category: 'Web Vitals'
            });
          }
          
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
      
      // Cumulative Layout Shift (CLS)
      const observeCLS = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vital', {
            name: 'CLS',
            value: Math.round(clsValue * 1000),
            event_category: 'Web Vitals'
          });
        }
        
        console.log('CLS:', clsValue);
      });
      
      try {
        observeLCP.observe({ entryTypes: ['largest-contentful-paint'] });
        observeFID.observe({ entryTypes: ['first-input'] });
        observeCLS.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    };
    
    // Time to Interactive (TTI) estimation
    const measureTTI = () => {
      if (typeof performance !== 'undefined' && performance.timing) {
        const timing = performance.timing;
        const tti = timing.domInteractive - timing.navigationStart;
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'timing_complete', {
            name: 'TTI',
            value: tti,
            event_category: 'Performance'
          });
        }
        
        console.log('TTI:', tti);
      }
    };
    
    // First Contentful Paint (FCP)
    const measureFCP = () => {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'web_vital', {
                name: 'FCP',
                value: Math.round(entry.startTime),
                event_category: 'Web Vitals'
              });
            }
            
            console.log('FCP:', entry.startTime);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Paint timing not supported:', error);
      }
    };
    
    // Resource loading performance
    const monitorResourceLoading = () => {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 1000) { // Flag slow resources > 1s
            console.warn('Slow resource:', entry.name, entry.duration);
            
            if (typeof gtag !== 'undefined') {
              gtag('event', 'slow_resource', {
                resource_url: entry.name,
                duration: Math.round(entry.duration),
                event_category: 'Performance'
              });
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource timing not supported:', error);
      }
    };
    
    // Memory usage monitoring (Chrome only)
    const monitorMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        const memoryInfo = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
          jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
        
        console.log('Memory usage:', memoryInfo);
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'memory_usage', {
            used_heap: memoryInfo.usedJSHeapSize,
            total_heap: memoryInfo.totalJSHeapSize,
            event_category: 'Performance'
          });
        }
        
        // Warn if memory usage is high
        if (memoryInfo.usedJSHeapSize > 100) { // > 100MB
          console.warn('High memory usage detected:', memoryInfo.usedJSHeapSize, 'MB');
        }
      }
    };
    
    // Initialize monitoring
    const initializeMonitoring = () => {
      observeWebVitals();
      measureTTI();
      measureFCP();
      monitorResourceLoading();
      
      // Monitor memory usage every 30 seconds
      const memoryInterval = setInterval(monitorMemoryUsage, 30000);
      
      return () => {
        clearInterval(memoryInterval);
      };
    };
    
    // Start monitoring after page load
    if (document.readyState === 'complete') {
      return initializeMonitoring();
    } else {
      const cleanup = () => initializeMonitoring();
      window.addEventListener('load', cleanup);
      return () => window.removeEventListener('load', cleanup);
    }
  }, []);
  
  return null; // This is a monitoring component, doesn't render anything
};

// Performance optimization utilities
export const optimizeImages = () => {
  // Lazy load images
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        image.src = image.dataset.src;
        image.removeAttribute('data-src');
        imageObserver.unobserve(image);
      }
    });
  });
  
  images.forEach(image => imageObserver.observe(image));
};

export const preloadCriticalResources = () => {
  const resources = [
    { href: 'https://fonts.googleapis.com', rel: 'dns-prefetch' },
    { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossOrigin: 'anonymous' },
    { href: '/critical.css', rel: 'preload', as: 'style' }
  ];
  
  resources.forEach(resource => {
    const link = document.createElement('link');
    Object.entries(resource).forEach(([key, value]) => {
      if (key === 'crossOrigin') {
        link.crossOrigin = value;
      } else {
        link[key] = value;
      }
    });
    document.head.appendChild(link);
  });
};

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export default PerformanceMonitor;