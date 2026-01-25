"use client";

import { useEffect, useState, useCallback } from "react";
import { Item } from "@/types";

interface UseKeyboardNavigationProps {
  items: Item[];
  onItemSelect?: (item: Item) => void;
  onItemOpen?: (item: Item) => void;
  onToggleSelection?: (itemId: string) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  items,
  onItemSelect,
  onItemOpen,
  onToggleSelection,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isVimMode, setIsVimMode] = useState(false);

  // Clamp focused index to valid range
  const clampIndex = useCallback((index: number) => {
    return Math.max(0, Math.min(index, items.length - 1));
  }, [items.length]);

  // Update focused index when items change
  useEffect(() => {
    setFocusedIndex(prev => clampIndex(prev));
  }, [items.length, clampIndex]);

  const moveUp = useCallback(() => {
    setFocusedIndex(prev => clampIndex(prev - 1));
  }, [clampIndex]);

  const moveDown = useCallback(() => {
    setFocusedIndex(prev => clampIndex(prev + 1));
  }, [clampIndex]);

  const moveToTop = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  const moveToBottom = useCallback(() => {
    setFocusedIndex(items.length - 1);
  }, [items.length]);

  const selectCurrentItem = useCallback(() => {
    const currentItem = items[focusedIndex];
    if (currentItem && onItemSelect) {
      onItemSelect(currentItem);
    }
  }, [items, focusedIndex, onItemSelect]);

  const openCurrentItem = useCallback(() => {
    const currentItem = items[focusedIndex];
    if (currentItem && onItemOpen) {
      onItemOpen(currentItem);
    }
  }, [items, focusedIndex, onItemOpen]);

  const toggleCurrentSelection = useCallback(() => {
    const currentItem = items[focusedIndex];
    if (currentItem && onToggleSelection) {
      onToggleSelection(currentItem.id);
    }
  }, [items, focusedIndex, onToggleSelection]);

  const jumpToIndex = useCallback((index: number) => {
    setFocusedIndex(clampIndex(index));
  }, [clampIndex]);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Vim-style navigation
      switch (event.key) {
        case 'j':
          event.preventDefault();
          moveDown();
          break;
        case 'k':
          event.preventDefault();
          moveUp();
          break;
        case 'g':
          if (event.shiftKey) { // G - go to bottom
            event.preventDefault();
            moveToBottom();
          } else { // gg - go to top (need double press)
            event.preventDefault();
            moveToTop();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveUp();
          break;
        case 'Home':
          event.preventDefault();
          moveToTop();
          break;
        case 'End':
          event.preventDefault();
          moveToBottom();
          break;
        case 'Enter':
          event.preventDefault();
          openCurrentItem();
          break;
        case ' ':
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Space - select item
            selectCurrentItem();
          } else {
            // Space - toggle selection
            toggleCurrentSelection();
          }
          break;
        case 'x':
          event.preventDefault();
          toggleCurrentSelection();
          break;
        case 'v':
          event.preventDefault();
          setIsVimMode(!isVimMode);
          break;
        default:
          // Number keys for jumping to specific items
          if (event.key >= '1' && event.key <= '9') {
            const num = parseInt(event.key);
            if (num <= items.length) {
              event.preventDefault();
              jumpToIndex(num - 1);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    items.length,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    selectCurrentItem,
    openCurrentItem,
    toggleCurrentSelection,
    jumpToIndex,
    isVimMode,
  ]);

  return {
    focusedIndex,
    focusedItem: items[focusedIndex] || null,
    isVimMode,
    setIsVimMode,
    jumpToIndex,
    // Manual navigation functions
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
  };
}
