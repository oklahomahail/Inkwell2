// PWA Update Notification Component
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { usePWA, pwaService } from '../../services/pwaService';

interface PWAUpdateNotificationProps {
  className?: string;
  position?: 'top' | 'bottom';
  autoShow?: boolean;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  className = '',
  position = 'top',
  autoShow = true,
}) => {
  const { needsRefresh, updateApp, isOfflineReady } = usePWA();
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (autoShow && needsRefresh) {
      setShow(true);
    }
  }, [needsRefresh, autoShow]);

  useEffect(() => {
    const unsubscribe = pwaService.onUpdateAvailable(() => {
      if (autoShow) {
        setShow(true);
      }
    });

    return unsubscribe;
  }, [autoShow]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateApp(true); // true = force reload
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show || (!needsRefresh && !isOfflineReady)) {
    return null;
  }

  const positionClasses =
    position === 'top'
      ? 'fixed top-4 left-1/2 transform -translate-x-1/2'
      : 'fixed bottom-4 left-1/2 transform -translate-x-1/2';

  return (
    <div className={`${positionClasses} z-50 max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 m-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {needsRefresh ? (
              <RefreshCw className="w-6 h-6 text-blue-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-green-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {needsRefresh ? (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Update Available</h3>
                <p className="text-sm text-gray-700 mb-3">
                  A new version of Inkwell is ready. Update now to get the latest features and
                  improvements.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className={`
                      inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md
                      hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Update Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Ready for Offline Use</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Inkwell is now cached and ready to work offline. You can write even without an
                  internet connection.
                </p>
                <button
                  onClick={handleDismiss}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Got it!
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
