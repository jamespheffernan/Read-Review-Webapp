"use client";

import { cn } from "@/lib/utils";

interface DragDropOverlayProps {
  isActive: boolean;
  itemCount: number;
  className?: string;
}

export function DragDropOverlay({ isActive, itemCount, className }: DragDropOverlayProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-accent/20 backdrop-blur-sm",
        "flex items-center justify-center",
        "animate-in fade-in-0 duration-200",
        className
      )}
    >
      <div className="bg-background border-2 border-dashed border-accent rounded-2xl p-12 text-center shadow-xl">
        <div className="flex flex-col items-center gap-6">
          {/* Drop icon */}
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <DropIcon className="w-8 h-8 text-accent" />
          </div>

          {/* Drop message */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Drop to capture
            </h3>
            <p className="text-foreground-secondary">
              {itemCount > 1 
                ? `${itemCount} items will be added to your inbox`
                : "Drop URLs, files, or text to add to your inbox"
              }
            </p>
          </div>

          {/* Supported formats */}
          <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              <span>URLs</span>
            </div>
            <div className="flex items-center gap-1">
              <FileIcon className="w-4 h-4" />
              <span>Text files</span>
            </div>
            <div className="flex items-center gap-1">
              <TextIcon className="w-4 h-4" />
              <span>Text</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function DropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L12 12" />
      <path d="M8 8l4 4 4-4" />
      <path d="M3 15v4c0 1.1.9 2 2 2h14c0-1.1-.9-2-2-2v-4" />
      <path d="M7 15h10" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  );
}
