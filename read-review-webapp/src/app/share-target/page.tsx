"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuickCapture } from "@/hooks/useItems";

export default function ShareTargetPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { captureUrl, captureText } = useQuickCapture();

  const handleSharedContent = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Get shared data from URL params (for GET requests)
      const urlParams = new URLSearchParams(window.location.search);
      const sharedUrl = urlParams.get('url');
      const sharedTitle = urlParams.get('title');
      const sharedText = urlParams.get('text');

      // Handle POST data (from Web Share Target API)
      if (window.location.hash === '#shared') {
        // This would be set by the service worker for POST requests
        const sharedDataStr = sessionStorage.getItem('shared-data');
        if (sharedDataStr) {
          const sharedData = JSON.parse(sharedDataStr);
          sessionStorage.removeItem('shared-data');
          
          if (sharedData.url) {
            await captureUrl(sharedData.url, sharedData.title);
          } else if (sharedData.text) {
            await captureText(sharedData.title || 'Shared Note', sharedData.text);
          }
          
          router.push('/');
          return;
        }
      }

      // Handle URL parameters
      if (sharedUrl) {
        await captureUrl(sharedUrl, sharedTitle || undefined);
        router.push('/');
      } else if (sharedText) {
        await captureText(sharedTitle || 'Shared Note', sharedText);
        router.push('/');
      } else {
        // No shared content, redirect to home
        router.push('/');
      }

    } catch (err) {
      console.error('Failed to process shared content:', err);
      setError('Failed to save shared content');
    } finally {
      setIsProcessing(false);
    }
  }, [captureText, captureUrl, router]);

  useEffect(() => {
    void handleSharedContent();
  }, [handleSharedContent]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <ErrorIcon className="w-full h-full" />
          </div>
          <h1 className="text-xl font-bold mb-2">Share Failed</h1>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <div className="animate-spin">
            <LoadingIcon className="w-full h-full" />
          </div>
        </div>
        <h1 className="text-xl font-bold mb-2">Processing Shared Content</h1>
        <p className="text-foreground-secondary">
          {isProcessing ? 'Saving your shared content...' : 'Redirecting to app...'}
        </p>
      </div>
    </div>
  );
}

// Icons
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}

function LoadingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
