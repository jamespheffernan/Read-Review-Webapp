"use client";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Item } from "@/types";
import { ItemRow } from "./ItemRow";
import { useEnhancedSelection } from "@/hooks/useEnhancedSelection";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { cn } from "@/lib/utils";

interface ItemListProps {
  items: Item[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onItemClick?: (item: Item) => void;
  className?: string;
  selectable?: boolean;
}

export function ItemList({
  items,
  loading = false,
  error = null,
  emptyMessage = "No items found",
  onItemClick,
  className,
  selectable = true,
}: ItemListProps) {
  const {
    selectedItems,
    toggleItemSelection,
    hasSelection,
    selectionCount,
    isAllSelected,
    isPartiallySelected,
    selectAll,
    clearSelection,
    archiveSelected,
    moveToLater,
    moveToShortlist,
    deleteSelected,
    undoLastOperation,
    canUndo,
    handleKeyboardShortcuts,
  } = useEnhancedSelection({ items });

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each ItemRow
    overscan: 10, // Render 10 extra items outside viewport for smooth scrolling
  });

  // Keyboard navigation
  const { focusedIndex, focusedItem, isVimMode } = useKeyboardNavigation({
    items,
    onItemOpen: onItemClick,
    onToggleSelection: toggleItemSelection,
    enabled: items.length > 0,
  });

  // Scroll focused item into view
  useEffect(() => {
    if (focusedItem && focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, focusedItem, virtualizer]);

  // Enhanced selection keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  if (loading) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
          <p className="text-foreground-secondary">Loading items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center">
          <ErrorIcon className="w-8 h-8 mx-auto mb-2 text-warn" />
          <p className="text-foreground-secondary">Error loading items</p>
          <p className="text-sm text-foreground-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center", className)}>
        <div className="text-center">
          <EmptyIcon className="w-12 h-12 mx-auto mb-4 text-foreground-tertiary" />
          <p className="text-lg font-medium text-foreground-secondary mb-2">
            {emptyMessage}
          </p>
          <p className="text-sm text-foreground-tertiary">
            Items you add will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Keyboard shortcuts indicator */}
      {items.length > 0 && (
        <div className="px-4 py-2 bg-background-secondary/50 border-b border-foreground-tertiary/10">
          <div className="flex items-center justify-between text-xs text-foreground-tertiary">
            <div className="flex items-center gap-4">
              <span>Navigate: <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">j</kbd>/<kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">k</kbd></span>
              <span>Select: <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">Space</kbd></span>
              <span>Select All: <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">Ctrl+A</kbd></span>
              <span>Open: <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">Enter</kbd></span>
              {canUndo && <span>Undo: <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-foreground-secondary">Ctrl+Z</kbd></span>}
            </div>
            {isVimMode && (
              <span className="text-accent font-medium">VIM Mode</span>
            )}
          </div>
        </div>
      )}

      {/* Selection toolbar */}
      {hasSelection && selectable && (
        <div className="flex items-center justify-between px-4 py-3 bg-accent/10 border-b border-accent/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={isAllSelected ? clearSelection : selectAll}
                className="w-4 h-4 border-2 border-accent rounded flex items-center justify-center hover:bg-accent/10 transition-colors"
                aria-label={isAllSelected ? "Deselect all" : "Select all"}
              >
                {isAllSelected ? (
                  <CheckIcon className="w-3 h-3 text-accent" />
                ) : isPartiallySelected ? (
                  <MinusIcon className="w-3 h-3 text-accent" />
                ) : null}
              </button>
              <span className="text-sm font-medium">
                {selectionCount} item{selectionCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="text-sm text-accent hover:text-accent/80"
            >
              Clear
            </button>
            {canUndo && (
              <button
                onClick={undoLastOperation}
                className="text-sm text-info hover:text-info/80 flex items-center gap-1"
              >
                <UndoIcon className="w-3 h-3" />
                Undo
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={moveToLater}
              className="px-3 py-1.5 text-sm bg-warn/15 text-warn rounded-lg hover:bg-warn/25 transition-colors"
            >
              Later
            </button>
            <button
              onClick={moveToShortlist}
              className="px-3 py-1.5 text-sm bg-accent/15 text-accent rounded-lg hover:bg-accent/25 transition-colors"
            >
              Shortlist
            </button>
            <button
              onClick={archiveSelected}
              className="px-3 py-1.5 text-sm bg-muted/15 text-muted rounded-lg hover:bg-muted/25 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={deleteSelected}
              className="px-3 py-1.5 text-sm bg-red-500/15 text-red-600 rounded-lg hover:bg-red-500/25 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Virtual scrolling list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ItemRow
                  item={item}
                  selected={selectable ? selectedItems.includes(item.id) : false}
                  focused={virtualItem.index === focusedIndex}
                  onToggleSelect={selectable ? toggleItemSelection : undefined}
                  onClick={onItemClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Icons
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

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
      <path d="M8.5 8.5l7 7M16 8.5l-7 7" />
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

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </svg>
  );
}
