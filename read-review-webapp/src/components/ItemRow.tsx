"use client";

import { Item, ItemKind } from "@/types";
import { StatusChip } from "./StatusChip";
import { TimeChip } from "./TimeChip";
import { TagPill } from "./TagPill";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface ItemRowProps {
  item: Item;
  selected?: boolean;
  focused?: boolean;
  onToggleSelect?: (id: string, withShift?: boolean) => void;
  onClick?: (item: Item) => void;
  className?: string;
}

export function ItemRow({
  item,
  selected = false,
  focused = false,
  onToggleSelect,
  onClick,
  className,
}: ItemRowProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    onClick?.(item);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(item.id, e.shiftKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(item);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 border-b border-foreground-tertiary/10",
        "hover:bg-background-secondary/50 transition-colors cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-inset",
        selected && "bg-accent/5 border-accent/20",
        focused && "bg-info/5 border-info/20 ring-2 ring-info/30",
        focused && selected && "bg-accent/15 border-accent/40 ring-2 ring-accent/50",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} - ${item.status}`}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <button
          onClick={handleSelectClick}
          className={cn(
            "flex-shrink-0 w-4 h-4 rounded border-2 border-foreground-tertiary/30",
            "hover:border-accent transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/50",
            selected && "bg-accent border-accent"
          )}
          aria-label={selected ? "Deselect item" : "Select item"}
        >
          {selected && (
            <CheckIcon className="w-3 h-3 text-white m-0.5" />
          )}
        </button>
      )}

      {/* Source icon */}
      <div className="flex-shrink-0 mt-1">
        <SourceIcon kind={item.kind} className="w-4 h-4 text-foreground-secondary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-foreground line-clamp-2 leading-snug">
            {item.title}
          </h3>
          <StatusChip status={item.status} />
        </div>

        {/* Meta information */}
        <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-2">
          {item.domain && (
            <>
              <span>{item.domain}</span>
              <span>•</span>
            </>
          )}
          <span>{formatRelativeTime(item.createdAt)}</span>
          {!item.hasSnapshot && item.url && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <OfflineIcon className="w-3 h-3" />
                Offline
              </span>
            </>
          )}
        </div>

        {/* Synopsis */}
        {item.synopsis && (
          <p className="text-sm text-foreground-secondary line-clamp-2 mb-2">
            {item.synopsis}
          </p>
        )}

        {/* Tags and time estimate */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <TagPill key={tag} name={tag} />
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-foreground-tertiary">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
          
          <TimeChip minutes={item.estMinutes} />
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/reader/${item.id}`, '_blank');
            }}
            className="p-1.5 rounded hover:bg-background-tertiary"
            aria-label="Open in reader"
          >
            <BookOpenIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-background-tertiary"
            aria-label="More actions"
          >
            <MoreIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Source icon component
function SourceIcon({ kind, className }: { kind: ItemKind; className?: string }) {
  switch (kind) {
    case ItemKind.URL:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2s.06-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08C6.03 6.34 7.57 5.06 9.4 4.44 8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56-1.83-.63-3.37-1.91-4.32-3.56m-.16-2c-.16-.64-.26-1.31-.26-2s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
      );
    case ItemKind.PDF:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      );
    case ItemKind.EMAIL:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      );
    case ItemKind.NOTE:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h10l6-6V4c0-1.1-.9-2-2-2zm4 16l-4 4H6V4h12v14z"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h10l6-6V4c0-1.1-.9-2-2-2zm4 16l-4 4H6V4h12v14z"/>
        </svg>
      );
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M22 22L2 2" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
