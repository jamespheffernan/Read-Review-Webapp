"use client";

import { useState, useEffect, useRef } from "react";
import { Item, Snapshot } from "@/types";
import { SnapshotService } from "@/lib/data-access";
import { cn } from "@/lib/utils";

interface ArticleReaderProps {
  item: Item;
}

export function ArticleReader({ item }: ArticleReaderProps) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        setLoading(true);
        const itemSnapshot = await SnapshotService.getByItem(item.id);
        setSnapshot(itemSnapshot ?? null);
      } catch (error) {
        console.error("Failed to load snapshot:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
  }, [item.id]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin">
            <svg viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-foreground-secondary">Loading article...</p>
        </div>
      </div>
    );
  }

  const content = snapshot?.html || item.content;
  const hasContent = content && content.length > 0;

  return (
    <div className="relative">
      {/* Reading Progress Bar */}
      <div 
        ref={progressRef}
        className="fixed top-0 left-0 h-1 bg-accent transition-all duration-150 ease-out z-50"
        style={{ width: `${readingProgress}%` }}
      />

      <div ref={contentRef} className="article-content">
        {/* Article Header */}
        <header className="mb-8 pb-6 border-b border-foreground-tertiary/20">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {item.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-secondary">
            {item.domain && (
              <span className="flex items-center gap-1">
                <GlobeIcon className="w-4 h-4" />
                {item.domain}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
            
            {item.estMinutes && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                ~{item.estMinutes} min read
              </span>
            )}

            {item.wordCount && (
              <span className="flex items-center gap-1">
                <FileTextIcon className="w-4 h-4" />
                {item.wordCount.toLocaleString()} words
              </span>
            )}
          </div>

          {item.synopsis && (
            <div className="mt-4 p-4 bg-background-secondary rounded-lg">
              <p className="text-foreground-secondary italic">
                {item.synopsis}
              </p>
            </div>
          )}
        </header>

        {/* Article Content */}
        {hasContent ? (
          <div 
            className={cn(
              "prose prose-lg max-w-none",
              "prose-headings:font-bold prose-headings:text-foreground",
              "prose-p:text-foreground prose-p:leading-relaxed",
              "prose-a:text-accent prose-a:no-underline hover:prose-a:underline",
              "prose-strong:text-foreground prose-strong:font-semibold",
              "prose-code:bg-background-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
              "prose-pre:bg-background-secondary prose-pre:border prose-pre:border-foreground-tertiary/20",
              "prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-background-secondary prose-blockquote:pl-4 prose-blockquote:py-2",
              "prose-ul:text-foreground prose-ol:text-foreground",
              "prose-li:text-foreground",
              "prose-img:rounded-lg prose-img:shadow-md"
            )}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-foreground-tertiary">
              <FileTextIcon className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Content Available</h3>
            <p className="text-foreground-secondary mb-4">
              This item doesn&apos;t have readable content yet.
            </p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                View Original
              </a>
            )}
          </div>
        )}

        {/* Original Link */}
        {item.url && hasContent && (
          <footer className="mt-12 pt-6 border-t border-foreground-tertiary/20">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              View Original Article
            </a>
          </footer>
        )}
      </div>
    </div>
  );
}

// Icons
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15,3 21,3 21,9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
