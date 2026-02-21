import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { installPromptManager, isPWA } from '../utils/pwa';
import { storage } from '../utils/storage';

/**
 * PWA Install Prompt Component
 * Shows install banner when app can be installed
 */

interface InstallPromptProps {
  /** Auto-show after delay (ms) */
  autoShowDelay?: number;
  /** Allow user to dismiss permanently */
  allowDismiss?: boolean;
  /** Custom install text */
  installText?: string;
  /** Position */
  position?: 'top' | 'bottom';
}

export function InstallPrompt({
  autoShowDelay = 3000,
  allowDismiss = true,
  installText = 'Install Wonderelo',
  position = 'bottom'
}: InstallPromptProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  
  useEffect(() => {
    // Don't show if already PWA
    if (isPWA()) {
      return;
    }
    
    // Don't show if user dismissed
    if (allowDismiss && storage.get('install-prompt-dismissed')) {
      return;
    }
    
    // Subscribe to install availability
    const unsubscribe = installPromptManager.subscribe((available) => {
      setCanInstall(available);
      
      if (available && autoShowDelay > 0) {
        setTimeout(() => {
          setIsVisible(true);
        }, autoShowDelay);
      }
    });
    
    return unsubscribe;
  }, [autoShowDelay, allowDismiss]);
  
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const accepted = await installPromptManager.show();
      
      if (accepted) {
        setIsVisible(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    
    if (allowDismiss) {
      storage.set('install-prompt-dismissed', true);
    }
  };
  
  if (!canInstall || !isVisible) {
    return null;
  }
  
  const positionClasses = position === 'top'
    ? 'top-4 left-4 right-4'
    : 'bottom-4 left-4 right-4';
  
  return (
    <div 
      className={`fixed ${positionClasses} z-50 max-w-md mx-auto`}
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            id="install-prompt-title"
            className="font-semibold text-gray-900 dark:text-gray-100 mb-1"
          >
            {installText}
          </h3>
          <p 
            id="install-prompt-description"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Install our app for a better experience with offline access and faster loading.
          </p>
          
          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            
            {allowDismiss && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Not now
              </button>
            )}
          </div>
        </div>
        
        {/* Close button */}
        {allowDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Install Button
 */
interface InstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InstallButton({ 
  variant = 'default', 
  size = 'md',
  className = '' 
}: InstallButtonProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  
  useEffect(() => {
    if (isPWA()) return;
    
    const unsubscribe = installPromptManager.subscribe(setCanInstall);
    return unsubscribe;
  }, []);
  
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      await installPromptManager.show();
    } finally {
      setIsInstalling(false);
    }
  };
  
  if (!canInstall) {
    return null;
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-primary hover:bg-primary/10'
  };
  
  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <Download className="w-4 h-4" />
      {isInstalling ? 'Installing...' : 'Install App'}
    </button>
  );
}

/**
 * iOS Install Instructions
 * Shows instructions for iOS Safari users
 */
export function IOSInstallInstructions() {
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (navigator as any).standalone === true;
    
    setIsIOS(iOS && !isStandalone);
  }, []);
  
  if (!isIOS || !isVisible) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Install Wonderelo</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>To install this app on your iPhone or iPad:</p>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li>
              Tap the <strong>Share</strong> button 
              <span className="inline-block mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </span>
              in Safari
            </li>
            <li>
              Scroll down and tap <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Tap <strong>"Add"</strong> to confirm
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Update Available Banner
 */
export function UpdateAvailableBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);
  
  const handleUpdate = () => {
    window.location.reload();
  };
  
  if (!updateAvailable) {
    return null;
  }
  
  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm opacity-90">A new version is ready to install</p>
        </div>
        <button
          onClick={handleUpdate}
          className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}
