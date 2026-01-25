// Core data types for the Read/Review web app

export enum ItemStatus {
  INBOX = "inbox",
  LATER = "later",
  SHORTLIST = "shortlist",
  ARCHIVED = "archived",
}

export enum ItemKind {
  URL = "url",
  PDF = "pdf",
  EMAIL = "email",
  NOTE = "note",
}

export enum ItemSource {
  MANUAL = "manual",
  BOOKMARKLET = "bookmarklet",
  DRAG_DROP = "drag_drop",
  PASTE = "paste",
  IMPORT = "import",
}

export interface Item {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: ItemStatus;
  kind: ItemKind;
  source: ItemSource;
  
  // Content
  title: string;
  url?: string;
  domain?: string;
  synopsis?: string;
  
  // Metadata
  estMinutes?: number;
  wordCount?: number;
  hasSnapshot: boolean;
  
  // Relations
  tags: string[];
  highlights: Highlight[];
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  itemId: string;
  type: "pdf" | "image" | "eml";
  localPath: string;
  fileSize: number;
  checksum: string;
  createdAt: Date;
}

export interface Highlight {
  id: string;
  itemId: string;
  start: number;
  end: number;
  quote: string;
  note?: string;
  pageIndex?: number; // For PDFs
  pdfRect?: string; // JSON-encoded PDF rect
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
  usageCount: number;
}

export interface Snapshot {
  id: string;
  itemId: string;
  html?: string;
  plaintext: string;
  images: string[]; // URLs to cached images
  extractedAt: Date;
  readabilityScore?: number;
}

export interface ReviewSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  itemsReviewed: number;
  actions: ReviewAction[];
}

export interface ReviewAction {
  itemId: string;
  action: "archive" | "complete" | "skip" | "later" | "shortlist";
  timestamp: Date;
}

export interface ExportLog {
  id: string;
  itemId?: string; // undefined for batch exports
  destination: "markdown" | "json" | "csv";
  timestamp: Date;
  status: "success" | "error";
  errorMessage?: string;
}

// UI State types
export interface FilterState {
  status?: ItemStatus[];
  tags?: string[];
  search?: string;
  source?: ItemSource[];
  hasNotes?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ViewState {
  selectedItems: string[];
  sortBy: "createdAt" | "updatedAt" | "title" | "domain";
  sortOrder: "asc" | "desc";
  viewMode: "list" | "cards" | "compact";
}

export interface ReaderSettings {
  fontSize: number; // 16-24px
  lineHeight: number; // 1.4-2.0
  maxWidth: number; // pixels
  theme: "light" | "dark" | "system";
}

// Status color mapping (matches CSS variables)
export const STATUS_COLORS: Record<ItemStatus, string> = {
  [ItemStatus.INBOX]: "info",
  [ItemStatus.LATER]: "warn", 
  [ItemStatus.SHORTLIST]: "accent",
  [ItemStatus.ARCHIVED]: "muted",
};

// Estimated reading time brackets
export const TIME_ESTIMATES = [2, 5, 10, 20, 30, 60] as const;
export type TimeEstimate = typeof TIME_ESTIMATES[number];
