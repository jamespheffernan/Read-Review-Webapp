"use client";

import { useState } from "react";
import { Item, ItemStatus } from "@/types";
import { StatusChip } from "./StatusChip";
import { TagPill } from "./TagPill";
import { cn } from "@/lib/utils";

interface ReaderLayoutProps {
  item?: Item;
  children: React.ReactNode;
  onClose: () => void;
  onItemUpdate?: (updates: Partial<Item>) => void;
}

export function ReaderLayout({ item, children, onClose, onItemUpdate }: ReaderLayoutProps) {
  const [showControls, setShowControls] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [maxWidth, setMaxWidth] = useState(65); // rem units

  const handleStatusChange = (newStatus: ItemStatus) => {
    if (item && onItemUpdate) {
      onItemUpdate({ status: newStatus });
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));
  const increaseLineHeight = () => setLineHeight(prev => Math.min(prev + 0.1, 2.0));
  const decreaseLineHeight = () => setLineHeight(prev => Math.max(prev - 0.1, 1.2));
  const increaseWidth = () => setMaxWidth(prev => Math.min(prev + 5, 100));
  const decreaseWidth = () => setMaxWidth(prev => Math.max(prev - 5, 40));

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground-tertiary/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="Close reader"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          
          {item && (
            <div className="flex items-center gap-2">
              <h1 className="font-medium text-foreground line-clamp-1 max-w-md">
                {item.title}
              </h1>
              <StatusChip 
                status={item.status} 
                onClick={(status) => handleStatusChange(status)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Reading Controls Toggle */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showControls 
                ? "bg-accent text-white" 
                : "hover:bg-background-secondary"
            )}
            aria-label="Reading controls"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {/* Share button */}
          {item?.url && (
            <button
              onClick={() => {
                if (navigator.share && item.url) {
                  navigator.share({
                    title: item.title,
                    url: item.url,
                  });
                } else if (item.url) {
                  navigator.clipboard.writeText(item.url);
                }
              }}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              aria-label="Share"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Reading Controls Panel */}
      {showControls && (
        <div className="border-b border-foreground-tertiary/20 bg-background-secondary/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {/* Font Size */}
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary min-w-0">Font:</span>
              <button
                onClick={decreaseFontSize}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Decrease font size"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="min-w-8 text-center font-mono">{fontSize}</span>
              <button
                onClick={increaseFontSize}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Increase font size"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Line Height */}
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary min-w-0">Line:</span>
              <button
                onClick={decreaseLineHeight}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Decrease line height"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="min-w-8 text-center font-mono">{lineHeight.toFixed(1)}</span>
              <button
                onClick={increaseLineHeight}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Increase line height"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Width */}
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary min-w-0">Width:</span>
              <button
                onClick={decreaseWidth}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Decrease width"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="min-w-8 text-center font-mono">{maxWidth}</span>
              <button
                onClick={increaseWidth}
                className="w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors flex items-center justify-center"
                aria-label="Increase width"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
        }}
      >
        <div 
          className="mx-auto px-6 py-8"
          style={{ maxWidth: `${maxWidth}rem` }}
        >
          {children}
        </div>
      </main>

      {/* Footer with tags and metadata */}
      {item && (
        <footer className="border-t border-foreground-tertiary/20 bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {item.tags.map((tag) => (
                <TagPill key={tag} name={tag} />
              ))}
            </div>
            
            {item.estMinutes && (
              <div className="text-sm text-foreground-secondary">
                ~{item.estMinutes} min read
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
