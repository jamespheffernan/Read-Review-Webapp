"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ItemService } from "@/lib/data-access";
import { Item, ItemKind } from "@/types";
import { ReaderLayout } from "@/components/ReaderLayout";
import { ArticleReader } from "@/components/ArticleReader";
import { PDFReader } from "@/components/PDFReader";

interface ReaderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const resolvedParams = use(params);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        const foundItem = await ItemService.getById(resolvedParams.id);
        
        if (!foundItem) {
          setError("Item not found");
          return;
        }

        setItem(foundItem);
      } catch (err) {
        console.error("Failed to load item:", err);
        setError("Failed to load item");
      } finally {
        setLoading(false);
      }
    }

    if (resolvedParams.id) {
      loadItem();
    }
  }, [resolvedParams.id]);

  const handleClose = () => {
    router.back();
  };

  const handleItemUpdate = async (updatedItem: Partial<Item>) => {
    if (!item) return;

    try {
      await ItemService.update(item.id, updatedItem);
      setItem(prev => prev ? { ...prev, ...updatedItem } : null);
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  if (loading) {
    return (
      <ReaderLayout onClose={handleClose}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 animate-spin">
              <svg viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-foreground-secondary">Loading item...</p>
          </div>
        </div>
      </ReaderLayout>
    );
  }

  if (error || !item) {
    return (
      <ReaderLayout onClose={handleClose}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
            <p className="text-foreground-secondary mb-4">
              {error || "The item you're looking for doesn't exist."}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </ReaderLayout>
    );
  }

  return (
    <ReaderLayout item={item} onClose={handleClose} onItemUpdate={handleItemUpdate}>
      {item.kind === ItemKind.PDF ? (
        <PDFReader item={item} />
      ) : (
        <ArticleReader item={item} />
      )}
    </ReaderLayout>
  );
}
