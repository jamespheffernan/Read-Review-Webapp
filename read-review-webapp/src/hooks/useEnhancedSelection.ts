"use client";

import { useState, useCallback, useMemo } from "react";
import { Item, ItemStatus } from "@/types";
import { useItemStore } from "@/stores/items";

interface UseEnhancedSelectionProps {
  items: Item[];
}

interface BulkOperation {
  id: string;
  type: 'status_change' | 'delete';
  description: string;
  itemIds: string[];
  previousData?: any;
  timestamp: Date;
}

export function useEnhancedSelection({ items }: UseEnhancedSelectionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [operationHistory, setOperationHistory] = useState<BulkOperation[]>([]);

  const store = useItemStore();

  // Selection state
  const hasSelection = selectedItems.length > 0;
  const selectionCount = selectedItems.length;
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isPartiallySelected = hasSelection && !isAllSelected;

  // Toggle individual item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    const index = items.findIndex(item => item.id === itemId);
    setLastClickedIndex(index);
    
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, [items]);

  // Range selection with Shift+click
  const toggleItemSelectionWithRange = useCallback((itemId: string, withShift = false) => {
    const index = items.findIndex(item => item.id === itemId);
    
    if (withShift && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const rangeIds = items.slice(start, end + 1).map(item => item.id);
      
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(id => newSelection.add(id));
        return Array.from(newSelection);
      });
    } else {
      toggleItemSelection(itemId);
    }
  }, [items, lastClickedIndex, toggleItemSelection]);

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedItems(items.map(item => item.id));
  }, [items]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setLastClickedIndex(null);
  }, []);

  // Select by status
  const selectByStatus = useCallback((status: ItemStatus) => {
    const statusItems = items.filter(item => item.status === status);
    setSelectedItems(statusItems.map(item => item.id));
  }, [items]);

  // Bulk operations with undo support
  const createOperation = useCallback((
    type: BulkOperation['type'],
    description: string,
    itemIds: string[],
    previousData?: any
  ): BulkOperation => {
    return {
      id: Math.random().toString(36).substring(2),
      type,
      description,
      itemIds,
      previousData,
      timestamp: new Date(),
    };
  }, []);

  const addToHistory = useCallback((operation: BulkOperation) => {
    setOperationHistory(prev => [operation, ...prev.slice(0, 9)]); // Keep last 10 operations
  }, []);

  // Bulk status changes
  const bulkUpdateStatus = useCallback(async (newStatus: ItemStatus) => {
    if (selectedItems.length === 0) return;

    const itemsToUpdate = items.filter(item => selectedItems.includes(item.id));
    const previousData = itemsToUpdate.map(item => ({ id: item.id, status: item.status }));
    
    const operation = createOperation(
      'status_change',
      `Moved ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} to ${newStatus}`,
      selectedItems,
      previousData
    );

    try {
      await store.bulkUpdateStatus(selectedItems, newStatus);
      addToHistory(operation);
      clearSelection();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      throw error;
    }
  }, [selectedItems, items, store, createOperation, addToHistory, clearSelection]);

  // Bulk delete
  const bulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;

    const itemsToDelete = items.filter(item => selectedItems.includes(item.id));
    const operation = createOperation(
      'delete',
      `Deleted ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`,
      selectedItems,
      itemsToDelete
    );

    try {
      await store.batchDelete(selectedItems);
      addToHistory(operation);
      clearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      throw error;
    }
  }, [selectedItems, items, store, createOperation, addToHistory, clearSelection]);

  // Undo last operation
  const undoLastOperation = useCallback(async () => {
    const lastOperation = operationHistory[0];
    if (!lastOperation) return;

    try {
      if (lastOperation.type === 'status_change' && lastOperation.previousData) {
        // Restore previous statuses
        for (const item of lastOperation.previousData) {
          await store.updateStatus(item.id, item.status);
        }
      } else if (lastOperation.type === 'delete' && lastOperation.previousData) {
        // Restore deleted items
        for (const item of lastOperation.previousData) {
          await store.createItem(item);
        }
      }

      setOperationHistory(prev => prev.slice(1));
    } catch (error) {
      console.error('Undo failed:', error);
      throw error;
    }
  }, [operationHistory, store]);

  // Keyboard shortcuts
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          selectAll();
          break;
        case 'z':
          if (operationHistory.length > 0) {
            event.preventDefault();
            undoLastOperation();
          }
          break;
      }
    } else {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          clearSelection();
          break;
      }
    }
  }, [selectAll, undoLastOperation, operationHistory.length, clearSelection]);

  // Convenience methods
  const moveToLater = useCallback(() => bulkUpdateStatus(ItemStatus.LATER), [bulkUpdateStatus]);
  const moveToShortlist = useCallback(() => bulkUpdateStatus(ItemStatus.SHORTLIST), [bulkUpdateStatus]);
  const archiveSelected = useCallback(() => bulkUpdateStatus(ItemStatus.ARCHIVED), [bulkUpdateStatus]);
  const deleteSelected = useCallback(() => bulkDelete(), [bulkDelete]);

  // Selected items data
  const selectedItemsData = useMemo(() => {
    return items.filter(item => selectedItems.includes(item.id));
  }, [items, selectedItems]);

  return {
    // Selection state
    selectedItems,
    selectedItemsData,
    hasSelection,
    selectionCount,
    isAllSelected,
    isPartiallySelected,

    // Selection actions
    toggleItemSelection: toggleItemSelectionWithRange,
    selectAll,
    clearSelection,
    selectByStatus,

    // Bulk operations
    moveToLater,
    moveToShortlist,
    archiveSelected,
    deleteSelected,
    bulkUpdateStatus,

    // Undo
    operationHistory,
    undoLastOperation,
    canUndo: operationHistory.length > 0,

    // Keyboard shortcuts
    handleKeyboardShortcuts,
  };
}
