"use client";

import { ItemService, SnapshotService } from './data-access';
import { Item, ItemKind, ItemSource, Snapshot } from '@/types';
import { generateId } from './utils';

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedDate?: string | Date; // Can be string from API or Date object
  siteName?: string;
  readingTime: number;
  wordCount: number;
  readabilityScore: number;
  images: string[];
  links: Array<{ url: string; text: string }>;
  tags: string[];
  language?: string;
}

export interface ProcessingOptions {
  extractContent?: boolean;
  generateSnapshot?: boolean;
  autoTag?: boolean;
  maxRetries?: number;
}

export interface ProcessingResult {
  item: Item;
  snapshot?: Snapshot;
  extractedContent?: ExtractedContent;
  success: boolean;
  error?: string;
}

export class ContentProcessor {
  private static readonly DEFAULT_OPTIONS: ProcessingOptions = {
    extractContent: true,
    generateSnapshot: true,
    autoTag: true,
    maxRetries: 3,
  };

  /**
   * Process a URL and create an item with extracted content
   */
  static async processUrl(
    url: string, 
    title?: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < (opts.maxRetries || 3)) {
      try {
        attempt++;
        
        // Extract content from URL using API route
        let extractedContent: ExtractedContent | undefined;
        if (opts.extractContent) {
          try {
            const response = await fetch('/api/extract-content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url,
                options: {
                  includeImages: true,
                  includeLinks: true,
                  generateTags: opts.autoTag,
                },
              }),
            });

            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
              extractedContent = result.data;
            } else {
              throw new Error(result.error || 'Content extraction failed');
            }
          } catch (error) {
            console.warn(`Content extraction failed (attempt ${attempt}):`, error);
            if (attempt >= (opts.maxRetries || 3)) {
              // If extraction fails completely, we'll still create a basic item
              extractedContent = undefined;
            } else {
              throw error; // Retry
            }
          }
        }

        // Create the item
        const itemData = {
          title: extractedContent?.title || title || this.extractTitleFromUrl(url),
          url,
          kind: ItemKind.URL,
          source: ItemSource.MANUAL,
          content: extractedContent?.content,
          synopsis: extractedContent?.excerpt,
          estMinutes: extractedContent?.readingTime,
          wordCount: extractedContent?.wordCount,
          tags: extractedContent?.tags || [],
        };

        const item = await ItemService.create(itemData);

        // Create snapshot if content was extracted
        let snapshot: Snapshot | undefined;
        if (opts.generateSnapshot && extractedContent) {
          try {
            snapshot = await SnapshotService.create({
              itemId: item.id,
              html: extractedContent.content,
              plaintext: this.stripHtml(extractedContent.content),
              images: extractedContent.images,
              readabilityScore: extractedContent.readabilityScore,
            });
          } catch (error) {
            console.warn('Failed to create snapshot:', error);
            // Don't fail the entire process if snapshot creation fails
          }
        }

        return {
          item,
          snapshot,
          extractedContent,
          success: true,
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`Processing attempt ${attempt} failed:`, error);
        
        // Wait before retrying (exponential backoff)
        if (attempt < (opts.maxRetries || 3)) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // If all attempts failed, create a basic item without extracted content
    try {
      const basicItem = await ItemService.create({
        title: title || this.extractTitleFromUrl(url),
        url,
        kind: ItemKind.URL,
        source: ItemSource.MANUAL,
        tags: [],
      });

      return {
        item: basicItem,
        success: false,
        error: `Content extraction failed after ${opts.maxRetries} attempts: ${lastError?.message}`,
      };
    } catch (error) {
      throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process text content and create an item
   */
  static async processText(
    title: string,
    content: string,
    tags: string[] = [],
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Analyze the text content
      const wordCount = this.countWords(content);
      const readingTime = this.estimateReadingTime(wordCount);
      const synopsis = this.generateSynopsis(content);
      
      // Auto-generate tags if enabled
      let finalTags = [...tags];
      if (opts.autoTag) {
        const autoTags = this.generateTextTags(content, title);
        finalTags = [...new Set([...tags, ...autoTags])];
      }

      // Create the item
      const item = await ItemService.create({
        title,
        content,
        synopsis,
        kind: ItemKind.NOTE,
        source: ItemSource.MANUAL,
        estMinutes: readingTime,
        wordCount,
        tags: finalTags,
      });

      // Create snapshot for text content
      let snapshot: Snapshot | undefined;
      if (opts.generateSnapshot) {
        try {
          snapshot = await SnapshotService.create({
            itemId: item.id,
            plaintext: content,
            images: [],
            readabilityScore: this.calculateTextReadability(content),
          });
        } catch (error) {
          console.warn('Failed to create text snapshot:', error);
        }
      }

      return {
        item,
        snapshot,
        success: true,
      };

    } catch (error) {
      throw new Error(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reprocess an existing item to update its content
   */
  static async reprocessItem(itemId: string, options: ProcessingOptions = {}): Promise<ProcessingResult> {
    const item = await ItemService.getById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.kind === ItemKind.URL && item.url) {
      return this.processUrl(item.url, item.title, options);
    } else if (item.kind === ItemKind.NOTE && item.content) {
      return this.processText(item.title, item.content, item.tags, options);
    } else {
      throw new Error('Item cannot be reprocessed');
    }
  }

  /**
   * Batch process multiple URLs
   */
  static async batchProcessUrls(
    urls: Array<{ url: string; title?: string }>,
    options: ProcessingOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const result = await this.processUrl(urls[i].url, urls[i].title, options);
        results.push(result);
      } catch (error) {
        results.push({
          item: {
            id: generateId(),
            title: urls[i].title || this.extractTitleFromUrl(urls[i].url),
            url: urls[i].url,
            kind: ItemKind.URL,
            source: ItemSource.MANUAL,
            tags: [],
            highlights: [],
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 0,
            hasSnapshot: false,
          },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      onProgress?.(i + 1, urls.length);
      
      // Add small delay between requests to be respectful
      if (i < urls.length - 1) {
        await this.delay(500);
      }
    }

    return results;
  }

  // Helper methods

  private static extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter(s => s.length > 0);
      
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Clean up the segment
        return lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]*$/, '') // Remove file extension
          .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      }
      
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'Untitled';
    }
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static estimateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / 200); // 200 words per minute
  }

  private static generateSynopsis(content: string, maxLength: number = 200): string {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private static generateTextTags(content: string, title: string): string[] {
    const tags: string[] = [];
    const text = (content + ' ' + title).toLowerCase();

    // Common categories
    const categories = {
      'programming': ['code', 'programming', 'development', 'software', 'algorithm'],
      'design': ['design', 'ui', 'ux', 'interface', 'visual'],
      'business': ['business', 'startup', 'entrepreneur', 'marketing', 'strategy'],
      'productivity': ['productivity', 'workflow', 'efficiency', 'organization'],
      'tutorial': ['tutorial', 'how to', 'guide', 'step by step', 'learn'],
      'research': ['research', 'study', 'analysis', 'data', 'findings'],
    };

    Object.entries(categories).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags.slice(0, 5); // Limit to 5 auto-tags
  }

  private static calculateTextReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = this.countWords(text);
    
    if (sentences === 0 || words === 0) return 50; // Default score
    
    const avgWordsPerSentence = words / sentences;
    
    // Simple readability score based on sentence length
    if (avgWordsPerSentence <= 10) return 90;
    if (avgWordsPerSentence <= 15) return 80;
    if (avgWordsPerSentence <= 20) return 70;
    if (avgWordsPerSentence <= 25) return 60;
    return 50;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
