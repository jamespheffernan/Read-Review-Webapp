import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Item, ItemStatus, FilterState, ViewState } from "@/types";
import { ItemService, StatsService } from "@/lib/data-access";

interface ItemStore {
  // State
  items: Item[];
  selectedItems: string[];
  filter: FilterState;
  view: ViewState;
  loading: boolean;
  error: string | null;

  // Stats
  stats: {
    inboxCount: number;
    laterCount: number;
    shortlistCount: number;
    archivedCount: number;
    totalItems: number;
  };

  // Actions
  loadItems: (filter?: FilterState) => Promise<void>;
  loadItemsByStatus: (status: ItemStatus) => Promise<void>;
  createItem: (data: {
    title: string;
    url?: string;
    content?: string;
    synopsis?: string;
    kind: import("@/types").ItemKind;
    source: import("@/types").ItemSource;
    tags?: string[];
    estMinutes?: number;
    wordCount?: number;
  }) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  searchItems: (query: string) => Promise<void>;

  // Selection
  selectItem: (id: string) => void;
  selectItems: (ids: string[]) => void;
  clearSelection: () => void;
  toggleItemSelection: (id: string) => void;

  // Filters and views
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;
  setView: (view: Partial<ViewState>) => void;

  // Batch operations
  batchUpdateStatus: (ids: string[], status: ItemStatus) => Promise<void>;
  batchDelete: (ids: string[]) => Promise<void>;

  // Stats
  refreshStats: () => Promise<void>;

  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useItemStore = create<ItemStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    items: [],
    selectedItems: [],
    filter: {},
    view: {
      selectedItems: [],
      sortBy: "createdAt",
      sortOrder: "desc",
      viewMode: "list",
    },
    loading: false,
    error: null,
    stats: {
      inboxCount: 0,
      laterCount: 0,
      shortlistCount: 0,
      archivedCount: 0,
      totalItems: 0,
    },

    // Actions
    loadItems: async (filter) => {
      set({ loading: true, error: null });
      try {
        const currentFilter = filter || get().filter;
        const items = await ItemService.getFiltered(currentFilter);
        set({ items, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    loadItemsByStatus: async (status) => {
      set({ loading: true, error: null });
      try {
        const items = await ItemService.getByStatus(status);
        set({ items, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    createItem: async (data) => {
      set({ loading: true, error: null });
      try {
        const item = await ItemService.create(data);
        const currentItems = get().items;
        set({ 
          items: [item, ...currentItems], 
          loading: false 
        });
        
        // Refresh stats
        get().refreshStats();
        
        return item;
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
    },

    updateItem: async (id, updates) => {
      try {
        await ItemService.update(id, updates);
        const currentItems = get().items;
        const updatedItems = currentItems.map(item =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
        );
        set({ items: updatedItems });
        
        // Refresh stats if status changed
        if (updates.status) {
          get().refreshStats();
        }
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    updateItemStatus: async (id, status) => {
      try {
        await ItemService.updateStatus(id, status);
        const currentItems = get().items;
        const updatedItems = currentItems.map(item =>
          item.id === id ? { ...item, status, updatedAt: new Date() } : item
        );
        set({ items: updatedItems });
        get().refreshStats();
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    deleteItem: async (id) => {
      try {
        await ItemService.delete(id);
        const currentItems = get().items;
        const filteredItems = currentItems.filter(item => item.id !== id);
        set({ 
          items: filteredItems,
          selectedItems: get().selectedItems.filter(selectedId => selectedId !== id)
        });
        get().refreshStats();
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    searchItems: async (query) => {
      set({ loading: true, error: null });
      try {
        const items = await ItemService.search(query);
        set({ items, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    // Selection methods
    selectItem: (id) => {
      set({ selectedItems: [id] });
    },

    selectItems: (ids) => {
      set({ selectedItems: ids });
    },

    clearSelection: () => {
      set({ selectedItems: [] });
    },

    toggleItemSelection: (id) => {
      const currentSelection = get().selectedItems;
      const isSelected = currentSelection.includes(id);
      
      if (isSelected) {
        set({ selectedItems: currentSelection.filter(selectedId => selectedId !== id) });
      } else {
        set({ selectedItems: [...currentSelection, id] });
      }
    },

    // Filter and view methods
    setFilter: (newFilter) => {
      const currentFilter = get().filter;
      const updatedFilter = { ...currentFilter, ...newFilter };
      set({ filter: updatedFilter });
      
      // Auto-reload items with new filter
      get().loadItems(updatedFilter);
    },

    clearFilter: () => {
      set({ filter: {} });
      get().loadItems({});
    },

    setView: (newView) => {
      const currentView = get().view;
      set({ view: { ...currentView, ...newView } });
    },

    // Batch operations
    batchUpdateStatus: async (ids, status) => {
      try {
        await Promise.all(ids.map(id => ItemService.updateStatus(id, status)));
        
        const currentItems = get().items;
        const updatedItems = currentItems.map(item =>
          ids.includes(item.id) ? { ...item, status, updatedAt: new Date() } : item
        );
        
        set({ items: updatedItems, selectedItems: [] });
        get().refreshStats();
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    batchDelete: async (ids) => {
      try {
        await Promise.all(ids.map(id => ItemService.delete(id)));
        
        const currentItems = get().items;
        const filteredItems = currentItems.filter(item => !ids.includes(item.id));
        
        set({ items: filteredItems, selectedItems: [] });
        get().refreshStats();
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    // Stats
    refreshStats: async () => {
      // Only refresh stats on client-side
      if (typeof window === "undefined") return;
      
      try {
        const overview = await StatsService.getOverview();
        set({ stats: overview.counts });
      } catch (error) {
        console.error("Failed to refresh stats:", error);
      }
    },

    // Utilities
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }))
);

// Initialize stats on store creation (client-side only)
if (typeof window !== "undefined") {
  useItemStore.getState().refreshStats();
}
