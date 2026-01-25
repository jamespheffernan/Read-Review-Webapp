import Dexie, { Table } from "dexie";
import {
  Item,
  Attachment,
  Highlight,
  Tag,
  Snapshot,
  ReviewSession,
  ExportLog,
  ItemStatus,
  ItemKind,
  ItemSource,
} from "@/types";

export class ReadReviewDatabase extends Dexie {
  // Tables
  items!: Table<Item>;
  attachments!: Table<Attachment>;
  highlights!: Table<Highlight>;
  tags!: Table<Tag>;
  snapshots!: Table<Snapshot>;
  reviewSessions!: Table<ReviewSession>;
  exportLogs!: Table<ExportLog>;

  constructor() {
    super("ReadReviewDatabase");

    // Define schemas
    this.version(1).stores({
      items: "id, createdAt, updatedAt, status, kind, source, title, url, domain, hasSnapshot, *tags",
      attachments: "id, itemId, type, localPath, fileSize, createdAt",
      highlights: "id, itemId, start, end, quote, pageIndex, createdAt",
      tags: "id, &name, usageCount, createdAt",
      snapshots: "id, &itemId, extractedAt, readabilityScore",
      reviewSessions: "id, startedAt, endedAt, itemsReviewed",
      exportLogs: "id, itemId, destination, timestamp, status",
    });

    // Hooks for data integrity
    this.items.hook("creating", (primKey, obj) => {
      const now = new Date();
      obj.createdAt = now;
      obj.updatedAt = now;
      obj.hasSnapshot = false;
      obj.tags = obj.tags || [];
      obj.highlights = [];
      obj.attachments = [];
    });

    this.items.hook("updating", (modifications) => {
      (modifications as Record<string, unknown>).updatedAt = new Date();
    });

    this.tags.hook("creating", (primKey, obj) => {
      obj.createdAt = obj.createdAt || new Date();
      obj.usageCount = obj.usageCount || 0;
    });
  }

  // Utility methods
  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Migration helpers for future versions
  async migrate() {
    // Future migrations will be added here
    console.log("Database migration completed");
  }

  // Reset database (for development)
  async reset() {
    await this.transaction("rw", [this.items, this.tags, this.highlights, this.attachments, this.snapshots, this.reviewSessions, this.exportLogs], async () => {
      await Promise.all([
        this.items.clear(),
        this.tags.clear(),
        this.highlights.clear(),
        this.attachments.clear(),
        this.snapshots.clear(),
        this.reviewSessions.clear(),
        this.exportLogs.clear(),
      ]);
    });
    console.log("Database reset completed");
  }

  // Cleanup old data
  async cleanup(olderThanDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Clean up archived items older than cutoff
    const oldArchivedItems = await this.items
      .where("status")
      .equals(ItemStatus.ARCHIVED)
      .and((item) => item.updatedAt < cutoffDate)
      .toArray();

    for (const item of oldArchivedItems) {
      await this.deleteItem(item.id);
    }

    // Clean up old export logs
    await this.exportLogs
      .where("timestamp")
      .below(cutoffDate)
      .delete();

    // Clean up old review sessions
    await this.reviewSessions
      .where("startedAt")
      .below(cutoffDate)
      .delete();

    console.log(`Cleaned up ${oldArchivedItems.length} old items and related data`);
  }

  // Delete item and all related data
  async deleteItem(itemId: string) {
    await this.transaction("rw", [this.items, this.attachments, this.highlights, this.snapshots], async () => {
      await this.items.delete(itemId);
      await this.attachments.where("itemId").equals(itemId).delete();
      await this.highlights.where("itemId").equals(itemId).delete();
      await this.snapshots.where("itemId").equals(itemId).delete();
    });
  }

  // Get storage usage statistics
  async getStorageStats() {
    const [itemCount, attachmentCount, highlightCount, snapshotCount] = await Promise.all([
      this.items.count(),
      this.attachments.count(),
      this.highlights.count(),
      this.snapshots.count(),
    ]);

    // Estimate storage usage (rough calculation)
    const estimatedSize = {
      items: itemCount * 1024, // ~1KB per item
      attachments: attachmentCount * 1024 * 1024, // ~1MB per attachment (PDFs)
      highlights: highlightCount * 256, // ~256B per highlight
      snapshots: snapshotCount * 10 * 1024, // ~10KB per snapshot
    };

    const totalEstimated = Object.values(estimatedSize).reduce((sum, size) => sum + size, 0);

    return {
      counts: { itemCount, attachmentCount, highlightCount, snapshotCount },
      estimatedSize,
      totalEstimated,
    };
  }
}

// Export singleton instance
export const db = new ReadReviewDatabase();
