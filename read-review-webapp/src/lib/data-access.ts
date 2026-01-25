import { db } from "./database";
import {
  Item,
  ItemStatus,
  ItemKind,
  ItemSource,
  Highlight,
  Tag,
  Snapshot,
  ReviewSession,
  FilterState,
} from "@/types";
import { normalizeUrl, extractDomain, generateId, countWords, estimateReadingTime } from "./utils";

// Item operations
export class ItemService {
  // Create a new item
  static async create(data: {
    title: string;
    url?: string;
    content?: string;
    kind: ItemKind;
    source: ItemSource;
    tags?: string[];
    estMinutes?: number;
  }): Promise<Item> {
    const item: Item = {
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: ItemStatus.INBOX,
      kind: data.kind,
      source: data.source,
      title: data.title,
      url: data.url ? normalizeUrl(data.url) : undefined,
      domain: data.url ? extractDomain(data.url) : undefined,
      synopsis: data.content ? data.content.substring(0, 200) + "..." : undefined,
      estMinutes: data.estMinutes,
      wordCount: data.content ? countWords(data.content) : undefined,
      hasSnapshot: false,
      tags: data.tags || [],
      highlights: [],
      attachments: [],
    };

    // Auto-estimate reading time if content provided
    if (data.content && !data.estMinutes) {
      item.estMinutes = estimateReadingTime(countWords(data.content));
    }

    // Update tag usage counts
    if (item.tags && item.tags.length > 0) {
      await ItemService.updateTagUsageCounts(item.tags, 1);
    }

    const id = await db.items.add(item);
    return { ...item, id: typeof id === "string" ? id : item.id };
  }

  // Get item by ID
  static async getById(id: string): Promise<Item | undefined> {
    return await db.items.get(id);
  }

  // Update item
  static async update(id: string, updates: Partial<Item>): Promise<void> {
    await db.items.update(id, { ...updates, updatedAt: new Date() });
  }

  // Change item status
  static async updateStatus(id: string, status: ItemStatus): Promise<void> {
    await db.items.update(id, { status, updatedAt: new Date() });
  }

  // Add tags to item
  static async addTags(id: string, newTags: string[]): Promise<void> {
    const item = await db.items.get(id);
    if (!item) throw new Error("Item not found");

    const uniqueTags = Array.from(new Set([...item.tags, ...newTags]));
    await db.items.update(id, { tags: uniqueTags, updatedAt: new Date() });
  }

  // Remove tags from item
  static async removeTags(id: string, tagsToRemove: string[]): Promise<void> {
    const item = await db.items.get(id);
    if (!item) throw new Error("Item not found");

    const filteredTags = item.tags.filter(tag => !tagsToRemove.includes(tag));
    await db.items.update(id, { tags: filteredTags, updatedAt: new Date() });
  }

  // Delete item
  static async delete(id: string): Promise<void> {
    await db.deleteItem(id);
  }

  // Helper method to update tag usage counts
  private static async updateTagUsageCounts(tags: string[], increment: number): Promise<void> {
    for (const tagName of tags) {
      const existingTag = await db.tags.where("name").equals(tagName).first();
      if (existingTag) {
        await db.tags.update(existingTag.id, { 
          usageCount: Math.max(0, existingTag.usageCount + increment) 
        });
      } else if (increment > 0) {
        // Only create new tags when incrementing
        await db.tags.add({
          id: generateId(),
          name: tagName,
          createdAt: new Date(),
          usageCount: increment,
        });
      }
    }
  }

  // Get items with filtering and pagination
  static async getFiltered(
    filter: FilterState,
    limit: number = 50,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db.items.orderBy("createdAt").reverse();

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      query = query.filter(item => filter.status!.includes(item.status));
    }

    if (filter.tags && filter.tags.length > 0) {
      query = query.filter(item => 
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (filter.source && filter.source.length > 0) {
      query = query.filter(item => filter.source!.includes(item.source));
    }

    if (filter.hasNotes !== undefined) {
      if (filter.hasNotes) {
        query = query.filter(item => item.highlights.some(h => h.note));
      } else {
        query = query.filter(item => !item.highlights.some(h => h.note));
      }
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      query = query.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const synopsisMatch = item.synopsis ? item.synopsis.toLowerCase().includes(searchTerm) : false;
        const domainMatch = item.domain ? item.domain.toLowerCase().includes(searchTerm) : false;
        const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return titleMatch || synopsisMatch || domainMatch || tagMatch;
      });
    }

    if (filter.dateRange) {
      query = query.filter(item => 
        item.createdAt >= filter.dateRange!.start &&
        item.createdAt <= filter.dateRange!.end
      );
    }

    return await query.offset(offset).limit(limit).toArray();
  }

  // Get items by status
  static async getByStatus(status: ItemStatus): Promise<Item[]> {
    return await db.items.where("status").equals(status).reverse().sortBy("createdAt");
  }

  // Get recent items
  static async getRecent(limit: number = 10): Promise<Item[]> {
    return await db.items.orderBy("createdAt").reverse().limit(limit).toArray();
  }

  // Search items
  static async search(query: string, limit: number = 20): Promise<Item[]> {
    const searchTerm = query.toLowerCase();
    return await db.items
      .filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const synopsisMatch = item.synopsis ? item.synopsis.toLowerCase().includes(searchTerm) : false;
        const domainMatch = item.domain ? item.domain.toLowerCase().includes(searchTerm) : false;
        return titleMatch || synopsisMatch || domainMatch;
      })
      .limit(limit)
      .toArray();
  }

  // Get items for review (Later + Shortlist)
  static async getForReview(): Promise<Item[]> {
    return await db.items
      .where("status")
      .anyOf([ItemStatus.LATER, ItemStatus.SHORTLIST])
      .reverse()
      .sortBy("createdAt");
  }

  // Check for duplicates
  static async findDuplicate(url: string): Promise<Item | undefined> {
    const normalizedUrl = normalizeUrl(url);
    return await db.items.where("url").equals(normalizedUrl).first();
  }
}

// Highlight operations
export class HighlightService {
  static async create(data: {
    itemId: string;
    start: number;
    end: number;
    quote: string;
    note?: string;
    pageIndex?: number;
    pdfRect?: string;
  }): Promise<Highlight> {
    const highlight: Highlight = {
      id: generateId(),
      createdAt: new Date(),
      ...data,
    };

    await db.highlights.add(highlight);
    return highlight;
  }

  static async update(id: string, updates: Partial<Highlight>): Promise<void> {
    await db.highlights.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    await db.highlights.delete(id);
  }

  static async getByItem(itemId: string): Promise<Highlight[]> {
    return await db.highlights.where("itemId").equals(itemId).toArray();
  }
}

// Tag operations
export class TagService {
  static async getAll(): Promise<Tag[]> {
    return await db.tags.orderBy("usageCount").reverse().toArray();
  }

  static async getPopular(limit: number = 20): Promise<Tag[]> {
    return await db.tags.orderBy("usageCount").reverse().limit(limit).toArray();
  }

  static async search(query: string): Promise<Tag[]> {
    const searchTerm = query.toLowerCase();
    return await db.tags
      .filter(tag => tag.name.toLowerCase().includes(searchTerm))
      .toArray();
  }

  static async create(name: string): Promise<Tag> {
    const existing = await db.tags.where("name").equals(name).first();
    if (existing) return existing;

    const tag: Tag = {
      id: generateId(),
      name,
      createdAt: new Date(),
      usageCount: 0,
    };

    await db.tags.add(tag);
    return tag;
  }

  static async delete(id: string): Promise<void> {
    const tag = await db.tags.get(id);
    if (!tag) return;

    // Remove tag from all items
    const itemsWithTag = await db.items.where("tags").equals(tag.name).toArray();
    for (const item of itemsWithTag) {
      const updatedTags = item.tags.filter(t => t !== tag.name);
      await db.items.update(item.id, { tags: updatedTags });
    }

    await db.tags.delete(id);
  }
}

// Snapshot operations
export class SnapshotService {
  static async create(data: {
    itemId: string;
    html?: string;
    plaintext: string;
    images: string[];
    readabilityScore?: number;
  }): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: generateId(),
      extractedAt: new Date(),
      ...data,
    };

    await db.snapshots.add(snapshot);
    
    // Update item to mark it has a snapshot
    await db.items.update(data.itemId, { hasSnapshot: true });

    return snapshot;
  }

  static async getByItem(itemId: string): Promise<Snapshot | undefined> {
    return await db.snapshots.where("itemId").equals(itemId).first();
  }

  static async update(itemId: string, updates: Partial<Snapshot>): Promise<void> {
    await db.snapshots.where("itemId").equals(itemId).modify(updates);
  }

  static async delete(itemId: string): Promise<void> {
    await db.snapshots.where("itemId").equals(itemId).delete();
    await db.items.update(itemId, { hasSnapshot: false });
  }
}

// Review session operations
export class ReviewSessionService {
  static async start(): Promise<ReviewSession> {
    const session: ReviewSession = {
      id: generateId(),
      startedAt: new Date(),
      itemsReviewed: 0,
      actions: [],
    };

    await db.reviewSessions.add(session);
    return session;
  }

  static async end(sessionId: string): Promise<void> {
    await db.reviewSessions.update(sessionId, { endedAt: new Date() });
  }

  static async addAction(
    sessionId: string,
    itemId: string,
    action: "archive" | "complete" | "skip" | "later" | "shortlist"
  ): Promise<void> {
    const session = await db.reviewSessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    const newAction = { itemId, action, timestamp: new Date() };
    const updatedActions = [...session.actions, newAction];
    
    await db.reviewSessions.update(sessionId, {
      actions: updatedActions,
      itemsReviewed: session.itemsReviewed + 1,
    });
  }

  static async getRecent(limit: number = 10): Promise<ReviewSession[]> {
    return await db.reviewSessions.orderBy("startedAt").reverse().limit(limit).toArray();
  }
}

// Statistics and analytics
export class StatsService {
  static async getOverview() {
    const [inboxCount, laterCount, shortlistCount, archivedCount] = await Promise.all([
      db.items.where("status").equals(ItemStatus.INBOX).count(),
      db.items.where("status").equals(ItemStatus.LATER).count(),
      db.items.where("status").equals(ItemStatus.SHORTLIST).count(),
      db.items.where("status").equals(ItemStatus.ARCHIVED).count(),
    ]);

    const totalItems = inboxCount + laterCount + shortlistCount + archivedCount;
    
    const recentActivity = await db.items
      .orderBy("createdAt")
      .reverse()
      .limit(5)
      .toArray();

    return {
      counts: { inboxCount, laterCount, shortlistCount, archivedCount, totalItems },
      recentActivity,
    };
  }

  static async getStorageInfo() {
    return await db.getStorageStats();
  }
}
