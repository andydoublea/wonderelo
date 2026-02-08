import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline, onNetworkChange, getNetworkInfo } from '../utils/pwa';

/**
 * Network Status Components
 * Show connection status and handle offline scenarios
 */

/**
 * Offline Banner
 * Shows when user loses connection
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onNetworkChange((isOnline) => {
      if (!isOnline) {
        setWasOffline(true);
        setShowReconnected(false);
      } else if (wasOffline) {
        setShowReconnected(true);
        // Hide reconnected message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
      setOnline(isOnline);
    });
    
    return unsubscribe;
  }, [wasOffline]);
  
  // Show "Reconnected" message
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 text-center text-sm font-medium animate-slide-down">
        <div className="flex items-center justify-center gap-2">
          <Wifi className="w-4 h-4" />
          <span>Back online</span>
        </div>
      </div>
    );
  }
  
  // Show "Offline" message
  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-2 text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      </div>
    );
  }
  
  return null;
}

/**
 * Network Indicator
 * Small indicator in corner
 */
interface NetworkIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showWhenOnline?: boolean;
}

export function NetworkIndicator({ 
  position = 'bottom-right',
  showWhenOnline = false 
}: NetworkIndicatorProps) {
  const [online, setOnline] = useState(isOnline());
  
  useEffect(() => {
    const unsubscribe = onNetworkChange(setOnline);
    return unsubscribe;
  }, []);
  
  if (online && !showWhenOnline) {
    return null;
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
          ${online 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }
        `}
      >
        {online ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}

/**
 * Connection Quality Indicator
 * Shows network speed/quality
 */
export function ConnectionQuality() {
  const [networkInfo, setNetworkInfo] = useState(getNetworkInfo());
  const [online, setOnline] = useState(isOnline());
  
  useEffect(() => {
    const unsubscribe = onNetworkChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        setNetworkInfo(getNetworkInfo());
      }
    });
    
    // Update network info periodically
    const interval = setInterval(() => {
      if (isOnline()) {
        setNetworkInfo(getNetworkInfo());
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  if (!online) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <div className="w-2 h-2 rounded-full bg-red-600" />
        <span>Offline</span>
      </div>
    );
  }
  
  const getQualityColor = () => {
    if (networkInfo.saveData) return 'text-yellow-600 dark:text-yellow-400';
    
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'text-red-600 dark:text-red-400';
      case '3g':
        return 'text-yellow-600 dark:text-yellow-400';
      case '4g':
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };
  
  const getQualityLabel = () => {
    if (networkInfo.saveData) return 'Data Saver';
    
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
        return 'Very Slow';
      case '2g':
        return 'Slow';
      case '3g':
        return 'Medium';
      case '4g':
        return 'Fast';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={`flex items-center gap-2 text-sm ${getQualityColor()}`}>
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-2 bg-current rounded-sm" />
        <div className={`w-1 h-3 rounded-sm ${
          networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g' 
            ? 'bg-gray-300' 
            : 'bg-current'
        }`} />
        <div className={`w-1 h-4 rounded-sm ${
          networkInfo.effectiveType === '4g' 
            ? 'bg-current' 
            : 'bg-gray-300'
        }`} />
      </div>
      <span>{getQualityLabel()}</span>
    </div>
  );
}

/**
 * Offline Ready Message
 * Shows after successful offline caching
 */
export function OfflineReadyMessage() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Listen for service worker caching complete
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Check if this is first time (could check localStorage)
        const hasShownBefore = localStorage.getItem('offline-ready-shown');
        
        if (!hasShownBefore) {
          setShow(true);
          localStorage.setItem('offline-ready-shown', 'true');
          
          // Hide after 5 seconds
          setTimeout(() => setShow(false), 5000);
        }
      });
    }
  }, []);
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              Ready for offline use
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can now use Oliwonder even without internet connection.
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Save Data Mode Indicator
 * Shows when user has data saver enabled
 */
export function SaveDataIndicator() {
  const [saveData, setSaveData] = useState(false);
  
  useEffect(() => {
    const networkInfo = getNetworkInfo();
    setSaveData(networkInfo.saveData);
  }, []);
  
  if (!saveData) return null;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
      <div className="flex items-start gap-3">
        <div className="text-blue-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Data Saver Mode Active
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Some images and videos may not load automatically to save data.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom hook for network status
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [networkInfo, setNetworkInfo] = useState(getNetworkInfo());
  
  useEffect(() => {
    const unsubscribe = onNetworkChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        setNetworkInfo(getNetworkInfo());
      }
    });
    
    return unsubscribe;
  }, []);
  
  return {
    online,
    offline: !online,
    ...networkInfo
  };
}

// Add animations to globals.css if not present
const animations = `
@keyframes slide-down {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;
