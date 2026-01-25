"use client";

import { useState, useRef, useEffect } from "react";
import { ItemKind, ItemSource } from "@/types";
import { useQuickCapture } from "@/hooks/useItems";
import { cn } from "@/lib/utils";

interface QuickAddBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  className?: string;
}

export function QuickAddBar({ isOpen, onClose, onSuccess, className }: QuickAddBarProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { captureUrl, captureText } = useQuickCapture();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear state when closed
  useEffect(() => {
    if (!isOpen) {
      setInput("");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const trimmedInput = input.trim();
      
      // Detect if input is a URL
      const isUrl = /^https?:\/\/.+/.test(trimmedInput) || 
                   /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmedInput);

      if (isUrl) {
        // Ensure URL has protocol
        const url = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
        await captureUrl(url);
      } else {
        // Treat as text note
        await captureText(trimmedInput, trimmedInput);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "bg-background border border-foreground-tertiary/20 rounded-xl shadow-xl",
          "w-full max-w-2xl mx-4 p-6",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-4 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Add</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a URL or text note..."
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-foreground-tertiary/20",
                "bg-background-secondary focus:bg-background",
                "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50",
                "placeholder:text-foreground-tertiary",
                "text-lg"
              )}
              disabled={isLoading}
            />
            <div className="mt-2 text-sm text-foreground-tertiary">
              {input.trim() && (
                <span>
                  Will be saved as: {
                    /^https?:\/\/.+/.test(input.trim()) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(input.trim())
                      ? <span className="text-info font-medium">URL</span>
                      : <span className="text-success font-medium">Text Note</span>
                  }
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-tertiary">
              <kbd className="px-2 py-1 bg-background-tertiary rounded text-xs">Enter</kbd> to save
              <span className="mx-2">•</span>
              <kbd className="px-2 py-1 bg-background-tertiary rounded text-xs">Esc</kbd> to cancel
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "px-6 py-2 text-sm font-medium rounded-lg transition-colors",
                  "bg-accent text-white hover:bg-accent/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
