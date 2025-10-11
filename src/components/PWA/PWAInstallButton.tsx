// PWA Install Button Component
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { usePWA, pwaService } from '../../services/pwaService';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'banner' | 'fab';
  onInstall?: (_success: boolean) => void;
  onDismiss?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
  onInstall,
  onDismiss,
}) => {
  const { installApp, canInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaService.onInstallPromptReady(() => {
      setShowPrompt(true);
    });

    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      onInstall?.(success);
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
      onInstall?.(false);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt || !canInstall) {
    return null;
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={`
          inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
        aria-label="Install Inkwell app"
      >
        {isInstalling ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Installing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Install App
          </>
        )}
      </button>
    );
  }

  // FAB (Floating Action Button) variant
  if (variant === 'fab') {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className={`
            flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300 hover:shadow-xl hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
          aria-label="Install Inkwell app"
        >
          {isInstalling ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              <span className="font-medium">Installing...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span className="font-medium">Install App</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Banner variant
  return (
    <div className={`bg-blue-50 border-l-4 border-blue-400 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Install Inkwell App</h3>
            <p className="text-sm text-blue-700">
              Get the best writing experience with our desktop and mobile app. Write offline, faster
              startup, and native feel.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Install Now
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-md hover:bg-blue-100 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
