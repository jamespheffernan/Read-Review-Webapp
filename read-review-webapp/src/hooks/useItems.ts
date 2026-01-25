import { useEffect } from "react";
import { useItemStore } from "@/stores/items";
import { ItemStatus, FilterState, ItemKind, ItemSource } from "@/types";
import { ContentProcessor } from "@/lib/content-processor";

// Main hook for item operations
export function useItems() {
  const store = useItemStore();

  // Auto-load items on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      store.loadItems();
    }
  }, []); // Empty dependency array to run only once

  return {
    // State
    items: store.items,
    loading: store.loading,
    error: store.error,
    selectedItems: store.selectedItems,
    stats: store.stats,

    // Actions
    loadItems: store.loadItems,
    createItem: store.createItem,
    updateItem: store.updateItem,
    updateItemStatus: store.updateItemStatus,
    deleteItem: store.deleteItem,
    searchItems: store.searchItems,

    // Selection
    selectItem: store.selectItem,
    selectItems: store.selectItems,
    clearSelection: store.clearSelection,
    toggleItemSelection: store.toggleItemSelection,

    // Batch operations
    batchUpdateStatus: store.batchUpdateStatus,
    batchDelete: store.batchDelete,

    // Utilities
    refreshStats: store.refreshStats,
  };
}

// Hook for items by status
export function useItemsByStatus(status: ItemStatus) {
  const store = useItemStore();
  
  useEffect(() => {
    store.loadItemsByStatus(status);
  }, [status, store]);

  return {
    items: store.items,
    loading: store.loading,
    error: store.error,
    refresh: () => store.loadItemsByStatus(status),
  };
}

// Hook for filtered items
export function useFilteredItems(filter: FilterState) {
  const store = useItemStore();
  const filterString = JSON.stringify(filter);

  useEffect(() => {
    store.loadItems(filter);
  }, [filterString, store, filter]);

  return {
    items: store.items,
    loading: store.loading,
    error: store.error,
    refresh: () => store.loadItems(filter),
  };
}

// Hook for quick capture with content processing
export function useQuickCapture() {
  const store = useItemStore();

  const captureUrl = async (url: string, title?: string) => {
    try {
      const result = await ContentProcessor.processUrl(url, title, {
        extractContent: true,
        generateSnapshot: true,
        autoTag: true,
      });
      
      // Refresh the store to show the new item
      await store.loadItems();
      
      return result.item;
    } catch (error) {
      console.error('Failed to capture URL:', error);
      throw error;
    }
  };

  const captureText = async (title: string, content: string, tags?: string[]) => {
    try {
      const result = await ContentProcessor.processText(title, content, tags, {
        generateSnapshot: true,
        autoTag: true,
      });
      
      // Refresh the store to show the new item
      await store.loadItems();
      
      return result.item;
    } catch (error) {
      console.error('Failed to capture text:', error);
      throw error;
    }
  };

  const captureFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      // Check if it's a URL
      try {
        new URL(clipboardText);
        return await captureUrl(clipboardText);
      } catch {
        // Not a URL, treat as text
        return await captureText("Note from clipboard", clipboardText);
      }
    } catch {
      throw new Error("Failed to read clipboard");
    }
  };

  return {
    captureUrl,
    captureText,
    captureFromClipboard,
  };
}

// Hook for item statistics
export function useItemStats() {
  const stats = useItemStore(state => state.stats);
  const refreshStats = useItemStore(state => state.refreshStats);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    ...stats,
    refresh: refreshStats,
  };
}

// Hook for search functionality
export function useItemSearch() {
  const store = useItemStore();

  return {
    searchResults: store.items,
    loading: store.loading,
    error: store.error,
    search: store.searchItems,
    clearSearch: () => store.loadItems({}),
  };
}

// Hook for selection management
export function useItemSelection() {
  const store = useItemStore();

  return {
    selectedItems: store.selectedItems,
    selectItem: store.selectItem,
    selectItems: store.selectItems,
    clearSelection: store.clearSelection,
    toggleItemSelection: store.toggleItemSelection,
    hasSelection: store.selectedItems.length > 0,
    selectionCount: store.selectedItems.length,
    
    // Batch operations on selected items
    archiveSelected: () => store.batchUpdateStatus(store.selectedItems, ItemStatus.ARCHIVED),
    moveToLater: () => store.batchUpdateStatus(store.selectedItems, ItemStatus.LATER),
    moveToShortlist: () => store.batchUpdateStatus(store.selectedItems, ItemStatus.SHORTLIST),
    deleteSelected: () => store.batchDelete(store.selectedItems),
  };
}
