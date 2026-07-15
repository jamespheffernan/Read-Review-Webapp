"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Force dynamic rendering since we use IndexedDB
export const dynamic = 'force-dynamic';
import { Layout } from "@/components/Layout";
import { ItemList } from "@/components/ItemList";
import { useItems, useQuickCapture } from "@/hooks/useItems";
import { ItemStatus, Item } from "@/types";
import { db } from "@/lib/database";

export default function Home() {
  const router = useRouter();
  const { items, loading, error } = useItems();
  const { captureUrl, captureText } = useQuickCapture();
  const [mounted, setMounted] = useState(false);

  // Simple mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <Layout>
        <div className="flex flex-col h-full items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 animate-spin">
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-foreground-secondary">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleItemClick = (item: Item) => {
    router.push(`/reader/${item.id}`);
  };

  const addSampleData = async () => {
    try {
      await captureUrl("https://nextjs.org/docs", "Next.js Documentation");
      await captureUrl("https://tailwindcss.com/docs", "Tailwind CSS Docs");  
      await captureText("Project Notes", "Build a read-later app with GTD principles.", ["productivity", "gtd"]);
    } catch (error) {
      console.error("Failed to add sample data:", error);
      alert("Failed to add sample data. Check console for details.");
    }
  };

  const addManyTestItems = async () => {
    try {
      const domains = ["github.com", "stackoverflow.com", "medium.com", "dev.to", "hackernews.com"];
      const topics = ["React", "TypeScript", "Next.js", "Web Development", "JavaScript", "CSS", "Node.js", "Python", "AI", "Machine Learning"];
      
      for (let i = 0; i < 100; i++) {
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        await captureUrl(
          `https://${domain}/article/${i}`, 
          `${topic} - Article ${i + 1}`
        );
      }
      alert("Added 100 test items for virtual scrolling demo!");
    } catch (error) {
      console.error("Failed to add test items:", error);
      alert("Failed to add test items. Check console for details.");
    }
  };

  const resetDatabase = async () => {
    if (confirm("This will delete all data. Are you sure?")) {
      try {
        await db.reset();
        // Force a page reload to reinitialize everything
        window.location.reload();
      } catch (error) {
        console.error("Failed to reset database:", error);
        alert("Failed to reset database. Check console for details.");
      }
    }
  };

  const inboxItems = items.filter(item => item.status === ItemStatus.INBOX);

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-foreground-tertiary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Inbox</h1>
              <p className="text-sm text-foreground-secondary">
                {inboxItems.length} item{inboxItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {process.env.NODE_ENV === "development" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={addSampleData}
                  className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Add Sample Data
                </button>
                <button
                  onClick={addManyTestItems}
                  className="px-3 py-1.5 text-sm bg-info text-white rounded-lg hover:bg-info/90 transition-colors"
                >
                  Add 100 Items
                </button>
                <button
                  onClick={resetDatabase}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reset DB
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item list */}
        <ItemList
          items={inboxItems}
          loading={loading}
          error={error}
          emptyMessage="Your inbox is empty. Click 'Add Item' to get started!"
          onItemClick={handleItemClick}
          className="flex-1"
        />
      </div>
    </Layout>
  );
}
