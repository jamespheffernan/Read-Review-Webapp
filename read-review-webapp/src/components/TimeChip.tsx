"use client";

import { cn } from "@/lib/utils";

interface TimeChipProps {
  minutes?: number;
  className?: string;
}

export function TimeChip({ minutes, className }: TimeChipProps) {
  if (!minutes) return null;
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs",
        "bg-foreground-tertiary/10 text-foreground-secondary",
        "rounded-full",
        className
      )}
    >
      <ClockIcon className="w-3 h-3" />
      {minutes}m
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
    </svg>
  );
}
