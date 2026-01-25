"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookmarkletInstructionsProps {
  className?: string;
}

export function BookmarkletInstructions({ className }: BookmarkletInstructionsProps) {
  const [copied, setCopied] = useState(false);

  // The bookmarklet code - minified JavaScript that captures the current page
  const bookmarkletCode = `javascript:(function(){
    const title = document.title;
    const url = window.location.href;
    const selectedText = window.getSelection().toString();
    
    // Create a popup to send to our app
    const popup = window.open('', 'ReadReviewCapture', 'width=400,height=300,scrollbars=no,resizable=no');
    popup.document.write(\`
      <html>
        <head><title>Capturing...</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; text-align: center;">
          <h2>Capturing Page...</h2>
          <p><strong>\${title}</strong></p>
          <p style="color: #666; font-size: 14px;">\${url}</p>
          \${selectedText ? '<p><em>Selected text: "' + selectedText.substring(0, 100) + (selectedText.length > 100 ? '..."' : '"') + '</em></p>' : ''}
          <div id="status">Sending to Read/Review...</div>
        </body>
      </html>
    \`);
    
    // Send data to our app (this would need to be implemented)
    fetch('http://localhost:3000/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, selectedText })
    }).then(() => {
      popup.document.getElementById('status').innerHTML = '<span style="color: green;">✓ Captured successfully!</span>';
      setTimeout(() => popup.close(), 1500);
    }).catch(() => {
      popup.document.getElementById('status').innerHTML = '<span style="color: red;">✗ Failed to capture. Is Read/Review running?</span>';
    });
  })();`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn("bg-background-secondary rounded-xl p-6", className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Browser Bookmarklet</h3>
          <p className="text-foreground-secondary text-sm">
            Add this bookmarklet to your browser to quickly capture any web page with one click.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Bookmarklet Code:
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={bookmarkletCode}
                className="w-full h-24 p-3 text-xs font-mono bg-background border border-foreground-tertiary/20 rounded-lg resize-none"
              />
              <button
                onClick={copyToClipboard}
                className={cn(
                  "absolute top-2 right-2 px-2 py-1 text-xs rounded",
                  "bg-accent text-white hover:bg-accent/90 transition-colors",
                  copied && "bg-success"
                )}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <h4 className="font-medium text-info mb-2">How to install:</h4>
            <ol className="text-sm space-y-1 text-foreground-secondary">
              <li>1. Copy the code above</li>
              <li>2. Create a new bookmark in your browser</li>
              <li>3. Set the name to "Read/Review Capture"</li>
              <li>4. Paste the code as the URL/location</li>
              <li>5. Click the bookmark on any page to capture it!</li>
            </ol>
          </div>

          <div className="bg-warn/10 border border-warn/20 rounded-lg p-4">
            <h4 className="font-medium text-warn mb-2">Note:</h4>
            <p className="text-sm text-foreground-secondary">
              This bookmarklet requires a capture API endpoint to be implemented. 
              For now, it will show an error, but the framework is ready for when 
              the API is added.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-foreground-tertiary/20">
          <h4 className="font-medium mb-2">Quick Bookmark Link:</h4>
          <p className="text-sm text-foreground-secondary mb-2">
            Drag this link to your bookmarks bar:
          </p>
          <a
            href={bookmarkletCode}
            className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
            onClick={(e) => e.preventDefault()}
          >
            📖 Read/Review Capture
          </a>
        </div>
      </div>
    </div>
  );
}
