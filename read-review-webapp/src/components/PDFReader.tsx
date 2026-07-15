"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Item } from "@/types";
import { cn } from "@/lib/utils";

interface PDFReaderProps {
  item: Item;
}

export function PDFReader({ item }: PDFReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPDF() {
      if (!item.url) {
        setError("No PDF URL provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const pdf = await pdfjsLib.getDocument(item.url).promise;
        
        if (!isMounted) return;
        
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (isMounted) {
          setError("Failed to load PDF. Please check the URL or try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [item.url]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Canvas rendering is unavailable");
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvas,
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error("Failed to render page:", err);
      setError("Failed to render PDF page");
    }
  }, [scale]);

  useEffect(() => {
    if (totalPages > 0) {
      void renderPage(currentPage);
    }
  }, [currentPage, renderPage, totalPages]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setScale((currentScale) => Math.min(currentScale + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((currentScale) => Math.max(currentScale - 0.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.2);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          nextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, resetZoom, zoomIn, zoomOut]);

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
          <p className="text-foreground-secondary">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <FileXIcon className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium mb-2">PDF Load Error</h3>
          <p className="text-foreground-secondary mb-4">{error}</p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Original PDF
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-reader">
      {/* PDF Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-background-secondary rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentPage <= 1 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-background-tertiary"
            )}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-mono">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentPage >= totalPages 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-background-tertiary"
            )}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOutIcon className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-mono min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            aria-label="Zoom in"
          >
            <ZoomInIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={resetZoom}
            className="px-3 py-2 text-sm rounded-lg hover:bg-background-tertiary transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex justify-center">
        <div className="border border-foreground-tertiary/20 rounded-lg overflow-hidden shadow-lg bg-white">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-6 p-4 bg-background-secondary rounded-lg">
        <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-foreground-secondary">
          <div><kbd className="px-1 py-0.5 bg-background-tertiary rounded">←/↑</kbd> Previous</div>
          <div><kbd className="px-1 py-0.5 bg-background-tertiary rounded">→/↓/Space</kbd> Next</div>
          <div><kbd className="px-1 py-0.5 bg-background-tertiary rounded">+</kbd> Zoom in</div>
          <div><kbd className="px-1 py-0.5 bg-background-tertiary rounded">-</kbd> Zoom out</div>
        </div>
      </div>
    </div>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="M21 21l-4.35-4.35"></path>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  );
}

function ZoomOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="M21 21l-4.35-4.35"></path>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  );
}

function FileXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"></line>
      <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"></line>
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
