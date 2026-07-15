"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    setLastUpdate(new Date());

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setLastUpdate(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastUpdate(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-24 h-24 mx-auto mb-6 text-foreground-tertiary">
          {isOnline ? (
            <OnlineIcon className="w-full h-full" />
          ) : (
            <OfflineIcon className="w-full h-full" />
          )}
        </div>

        {/* Status Message */}
        <h1 className="text-2xl font-bold mb-4">
          {isOnline ? "Back Online!" : "You're Offline"}
        </h1>

        <p className="text-foreground-secondary mb-6 leading-relaxed">
          {isOnline ? (
            "Your connection has been restored. You can now access all features of Read/Review."
          ) : (
            "Read/Review is currently offline. Some features may be limited, but you can still browse your saved content."
          )}
        </p>

        {/* Status Indicator */}
        <div className="mb-6 p-4 rounded-lg bg-background-secondary">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">Connection Status:</span>
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-xs text-foreground-tertiary mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <button
              onClick={handleGoHome}
              className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Continue to Read/Review
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Try Again
            </button>
          )}

          <Link
            href="/"
            className="block w-full px-6 py-3 border border-foreground-tertiary/20 rounded-lg hover:bg-background-secondary transition-colors font-medium"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mt-8 p-4 bg-background-secondary rounded-lg">
            <h3 className="font-medium mb-3">Available Offline:</h3>
            <ul className="text-sm text-foreground-secondary space-y-2 text-left">
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                Browse saved articles and notes
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                Read cached content
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                Organize and triage items
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                Add new URLs (will sync when online)
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                Content extraction for new items
              </li>
            </ul>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 text-xs text-foreground-tertiary">
          <p>
            Read/Review works offline thanks to Progressive Web App technology.
            Your saved library stays in this browser and is available again when you&apos;re online.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icons
function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 17L7 7" />
      <path d="M7 7L17 17" />
      <path d="M12 2C13.1 2 14.2 2.3 15.2 2.9L13.8 4.3C13.2 4.1 12.6 4 12 4C8.1 4 5 7.1 5 11C5 11.6 5.1 12.2 5.3 12.8L3.9 14.2C3.3 13.2 3 12.1 3 11C3 6 7 2 12 2Z" />
      <path d="M21 11C21 16 17 20 12 20C10.9 20 9.8 19.7 8.8 19.1L10.2 17.7C10.8 17.9 11.4 18 12 18C15.9 18 19 14.9 19 11C19 10.4 18.9 9.8 18.7 9.2L20.1 7.8C20.7 8.8 21 9.9 21 11Z" />
    </svg>
  );
}

function OnlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12L11 15L16 9" />
      <path d="M12 2C17 2 21 6 21 11C21 16 17 20 12 20C7 20 3 16 3 11C3 6 7 2 12 2Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17L4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6L12 12L18 18" />
    </svg>
  );
}
