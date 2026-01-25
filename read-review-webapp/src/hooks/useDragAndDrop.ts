"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuickCapture } from "./useItems";

interface UseDragAndDropProps {
  enabled?: boolean;
  onSuccess?: (count: number) => void;
  onError?: (error: string) => void;
}

interface DragState {
  isDragging: boolean;
  isOver: boolean;
  itemCount: number;
}

export function useDragAndDrop({ 
  enabled = true, 
  onSuccess, 
  onError 
}: UseDragAndDropProps = {}) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isOver: false,
    itemCount: 0,
  });
  
  const { captureUrl, captureText } = useQuickCapture();

  // Extract URLs from text
  const extractUrls = useCallback((text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    return text.match(urlRegex) || [];
  }, []);

  // Extract text from files
  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  }, []);

  // Process dropped items
  const processDroppedItems = useCallback(async (dataTransfer: DataTransfer) => {
    const items: Array<{ type: 'url' | 'text' | 'file', content: string, title?: string }> = [];
    
    try {
      // Handle dropped files
      const files = Array.from(dataTransfer.files);
      for (const file of files) {
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          try {
            const content = await readFileAsText(file);
            const urls = extractUrls(content);
            
            if (urls.length > 0) {
              // File contains URLs
              urls.forEach(url => {
                items.push({ type: 'url', content: url, title: `From ${file.name}` });
              });
            } else {
              // File is text content
              items.push({ 
                type: 'text', 
                content: content.trim(), 
                title: file.name.replace(/\.[^/.]+$/, "") 
              });
            }
          } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
          }
        } else {
          // Non-text file - save as reference
          items.push({ 
            type: 'text', 
            content: `File: ${file.name} (${file.type || 'unknown type'})`, 
            title: file.name 
          });
        }
      }

      // Handle dropped text/URLs
      const droppedText = dataTransfer.getData('text/plain');
      if (droppedText) {
        const urls = extractUrls(droppedText);
        
        if (urls.length > 0) {
          // Text contains URLs
          urls.forEach(url => {
            items.push({ type: 'url', content: url });
          });
        } else if (droppedText.trim()) {
          // Plain text
          items.push({ type: 'text', content: droppedText.trim() });
        }
      }

      // Handle dropped HTML (from web pages)
      const droppedHtml = dataTransfer.getData('text/html');
      if (droppedHtml && !droppedText) {
        const urls = extractUrls(droppedHtml);
        urls.forEach(url => {
          items.push({ type: 'url', content: url });
        });
      }

      // Capture all items
      let successCount = 0;
      for (const item of items) {
        try {
          if (item.type === 'url') {
            await captureUrl(item.content, item.title);
          } else {
            await captureText(item.title || "Dropped content", item.content);
          }
          successCount++;
        } catch (error) {
          console.error('Failed to capture item:', error);
        }
      }

      if (successCount > 0) {
        onSuccess?.(successCount);
      } else {
        onError?.("No items could be captured from the dropped content");
      }

    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Failed to process dropped items");
    }
  }, [captureUrl, captureText, extractUrls, readFileAsText, onSuccess, onError]);

  // Drag event handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!enabled) return;

    const items = e.dataTransfer?.items;
    const itemCount = items ? Array.from(items).length : 0;

    setDragState({
      isDragging: true,
      isOver: true,
      itemCount,
    });
  }, [enabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!enabled) return;

    // Set dropEffect to indicate we can accept the drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [enabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!enabled) return;

    // Only hide if we're leaving the document body
    if (e.target === document.body || e.target === document.documentElement) {
      setDragState(prev => ({
        ...prev,
        isOver: false,
      }));
    }
  }, [enabled]);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!enabled) return;

    setDragState({
      isDragging: false,
      isOver: false,
      itemCount: 0,
    });

    if (e.dataTransfer) {
      await processDroppedItems(e.dataTransfer);
    }
  }, [enabled, processDroppedItems]);

  // Global drag state management
  const handleGlobalDragStart = useCallback(() => {
    if (!enabled) return;
    setDragState(prev => ({ ...prev, isDragging: true }));
  }, [enabled]);

  const handleGlobalDragEnd = useCallback(() => {
    if (!enabled) return;
    setDragState({
      isDragging: false,
      isOver: false,
      itemCount: 0,
    });
  }, [enabled]);

  // Set up global event listeners
  useEffect(() => {
    if (!enabled) return;

    // Prevent default drag behavior on the entire document
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    // Prevent default behaviors
    document.addEventListener('dragenter', preventDefaults);
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('dragleave', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      
      document.removeEventListener('dragenter', preventDefaults);
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('dragleave', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, [
    enabled,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleGlobalDragStart,
    handleGlobalDragEnd,
  ]);

  return {
    ...dragState,
    isActive: dragState.isDragging && dragState.isOver,
  };
}
