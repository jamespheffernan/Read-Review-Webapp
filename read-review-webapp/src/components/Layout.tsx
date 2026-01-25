"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSettings";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { Sidebar } from "./Sidebar";
import { QuickAddBar } from "./QuickAddBar";
import { DragDropOverlay } from "./DragDropOverlay";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { collapsed, toggle } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Drag and drop functionality
  const { isActive: isDragActive, itemCount } = useDragAndDrop({
    onSuccess: (count) => {
      console.log(`Successfully captured ${count} item${count !== 1 ? 's' : ''}!`);
      // Could show a toast notification here
    },
    onError: (error) => {
      console.error('Drag and drop error:', error);
      // Could show an error toast here
    },
  });

  // Global keyboard shortcut for Quick Add (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-background-secondary border-r border-foreground-tertiary/20",
          "lg:static lg:z-auto",
          // Mobile styles
          "w-64 transform transition-transform duration-300 ease-in-out lg:transition-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop styles
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <Sidebar 
          collapsed={collapsed} 
          onItemClick={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-foreground-tertiary/20 bg-background">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-background-secondary lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={toggle}
              className="hidden lg:block p-2 rounded-lg hover:bg-background-secondary"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SidebarIcon className="w-5 h-5" />
            </button>

            <h1 className="text-xl font-semibold">Read/Review</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick add button */}
            <button
              onClick={() => setQuickAddOpen(true)}
              className="p-2 rounded-lg hover:bg-background-secondary"
              aria-label="Quick add"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {/* Search button */}
            <button
              className="p-2 rounded-lg hover:bg-background-secondary"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Quick Add Bar */}
      <QuickAddBar
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          // Optionally show a success notification
          console.log("Item captured successfully!");
        }}
      />

      {/* Drag and Drop Overlay */}
      <DragDropOverlay
        isActive={isDragActive}
        itemCount={itemCount}
      />
    </div>
  );
}

// Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
