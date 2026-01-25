"use client";

import { cn } from "@/lib/utils";

interface TagPillProps {
  name: string;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function TagPill({ name, onClick, onRemove, className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs",
        "bg-muted/15 text-muted rounded-full",
        "transition-colors duration-200",
        onClick && "hover:bg-muted/25 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      #{name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-foreground transition-colors"
          type="button"
          aria-label={`Remove ${name} tag`}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
