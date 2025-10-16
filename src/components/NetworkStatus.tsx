// ============================================================================
// NETWORK STATUS COMPONENT
// ============================================================================

import React, { useState, useEffect } from 'react';
import { networkUtils } from '@/lib/errorHandler';

interface NetworkStatusProps {
  showOnlineStatus?: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showOnlineStatus = false, 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const cleanup = networkUtils.onNetworkChange((online) => {
      setIsOnline(online);
      
      // Show notification when status changes
      if (!online || (online && showOnlineStatus)) {
        setShowNotification(true);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    });

    return cleanup;
  }, [showOnlineStatus]);

  // Don't show anything if online and we don't want to show online status
  if (isOnline && !showOnlineStatus && !showNotification) {
    return null;
  }

  // Don't show notification if it's been dismissed
  if (!showNotification && !isOnline) {
    return null;
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300
      ${isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-orange-500 text-white'
      }
      ${showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      ${className}
    `}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-200' : 'bg-orange-200'
        }`} />
        <span className="text-sm font-medium">
          {isOnline ? '🌐 Conectado' : '📱 Modo offline'}
        </span>
        {!isOnline && (
          <span className="text-xs opacity-90">
            - Los datos se guardan localmente
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for network status
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const cleanup = networkUtils.onNetworkChange(setIsOnline);
    return cleanup;
  }, []);

  return {
    isOnline,
    isOffline: !isOnline
  };
};

/**
 * Simple network indicator for status bars
 */
export const NetworkIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useNetworkStatus();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-400' : 'bg-orange-400'
      }`} />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};