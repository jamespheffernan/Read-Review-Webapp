"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ContentProcessingStatusProps {
  isProcessing: boolean;
  progress?: number;
  status?: string;
  onCancel?: () => void;
  className?: string;
}

export function ContentProcessingStatus({
  isProcessing,
  progress = 0,
  status = "Processing content...",
  onCancel,
  className,
}: ContentProcessingStatusProps) {
  const [dots, setDots] = useState("");

  // Animate loading dots
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-background border border-foreground-tertiary/20",
        "rounded-xl shadow-lg p-4 min-w-80 max-w-md",
        "animate-in slide-in-from-bottom-4 fade-in-0 duration-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Processing icon */}
        <div className="flex-shrink-0 mt-0.5">
          <ProcessingIcon className="w-5 h-5 text-accent animate-spin" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Content Processing</h4>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
                aria-label="Cancel processing"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-foreground-secondary mb-3">
            {status}{dots}
          </p>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-foreground-tertiary mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Processing steps */}
          <div className="space-y-1 text-xs text-foreground-tertiary">
            <ProcessingStep
              label="Fetching content"
              completed={progress > 20}
              active={progress <= 20 && progress > 0}
            />
            <ProcessingStep
              label="Extracting text"
              completed={progress > 50}
              active={progress <= 50 && progress > 20}
            />
            <ProcessingStep
              label="Analyzing content"
              completed={progress > 80}
              active={progress <= 80 && progress > 50}
            />
            <ProcessingStep
              label="Generating tags"
              completed={progress >= 100}
              active={progress <= 100 && progress > 80}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProcessingStepProps {
  label: string;
  completed: boolean;
  active: boolean;
}

function ProcessingStep({ label, completed, active }: ProcessingStepProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">
        {completed ? (
          <CheckIcon className="w-3 h-3 text-success" />
        ) : active ? (
          <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-foreground-tertiary/30" />
        )}
      </div>
      <span className={cn(
        "text-xs",
        completed ? "text-success" : active ? "text-accent" : "text-foreground-tertiary"
      )}>
        {label}
      </span>
    </div>
  );
}

// Icons
function ProcessingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
