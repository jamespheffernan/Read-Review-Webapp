"use client";

import { ItemStatus, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: ItemStatus;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.INBOX]: "Inbox",
  [ItemStatus.LATER]: "Later",
  [ItemStatus.SHORTLIST]: "Shortlist",
  [ItemStatus.ARCHIVED]: "Archived",
};

export function StatusChip({ 
  status, 
  onClick, 
  disabled = false, 
  className 
}: StatusChipProps) {
  const colorClass = `text-${STATUS_COLORS[status]} bg-${STATUS_COLORS[status]}/15`;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold",
        "rounded-full transition-colors duration-200",
        "border border-transparent",
        
        // Color styles
        colorClass,
        
        // Interactive styles
        onClick && !disabled && [
          "hover:opacity-80 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          `focus:ring-${STATUS_COLORS[status]}/50`,
        ],
        
        // Disabled styles
        disabled && "opacity-50 cursor-not-allowed",
        
        className
      )}
      type="button"
    >
      <StatusIcon status={status} />
      {STATUS_LABELS[status]}
    </button>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  const iconClass = "w-3 h-3";
  
  switch (status) {
    case ItemStatus.INBOX:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      );
    case ItemStatus.LATER:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
        </svg>
      );
    case ItemStatus.SHORTLIST:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    case ItemStatus.ARCHIVED:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
        </svg>
      );
  }
}
