"use client";

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ContentProcessingStatus } from "@/components/ContentProcessingStatus";
import { ContentProcessor, type ProcessingResult } from "@/lib/content-processor";
import { ItemKind, ItemSource, ItemStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function DemoPage() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demoUrls = [
    "https://daringfireball.net/linked/2025/09/06/siegler-cynical-read",
    "https://www.theverge.com/2024/7/10/24195000/apple-ai-ios-18-siri-openai-chatgpt-wwdc-2024",
    "https://www.nytimes.com/2024/07/10/technology/ai-chatbots-election-misinformation.html",
    "https://www.smashingmagazine.com/2024/07/modern-css-techniques-2024/",
    "https://react.dev/learn/thinking-in-react",
  ];

  const processUrl = async () => {
    if (!url.trim()) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);
    setStatus("Initializing...");

    try {
      // Simulate processing steps with progress
      const steps = [
        { progress: 20, status: "Fetching content..." },
        { progress: 50, status: "Extracting readable text..." },
        { progress: 80, status: "Analyzing content..." },
        { progress: 95, status: "Generating tags..." },
        { progress: 100, status: "Complete!" },
      ];

      for (const step of steps) {
        setProgress(step.progress);
        setStatus(step.status);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Actually process the content using the API directly
      console.log('Calling extraction API for:', url);
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
            generateTags: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const apiResult = await response.json();
      console.log('API response:', apiResult);

      if (apiResult.success && apiResult.data) {
        // Convert API response to ProcessingResult format
        const processingResult: ProcessingResult = {
          item: {
            id: "demo-" + Date.now(),
            title: apiResult.data.title,
            url,
            content: apiResult.data.content,
            synopsis: apiResult.data.excerpt,
            kind: ItemKind.URL,
            source: ItemSource.MANUAL,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: ItemStatus.INBOX,
            hasSnapshot: true,
            tags: apiResult.data.tags || [],
            estMinutes: apiResult.data.readingTime,
            wordCount: apiResult.data.wordCount,
            highlights: [],
            attachments: [],
          },
          extractedContent: apiResult.data,
          success: true,
        };
        setResult(processingResult);
      } else {
        throw new Error(apiResult.error || 'Content extraction failed');
      }
    } catch (err) {
      console.error('Demo error:', err);
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus("");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-foreground-tertiary/20">
          <div>
            <h1 className="text-2xl font-semibold">Content Processing Demo</h1>
            <p className="text-sm text-foreground-secondary">
              Test the advanced content extraction and analysis capabilities
            </p>
          </div>
        </div>

        {/* Demo content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* URL Input */}
            <div className="bg-background-secondary rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Test Content Extraction</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Enter a URL to process:</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="flex-1 px-4 py-2 border border-foreground-tertiary/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                      disabled={isProcessing}
                    />
                    <button
                      onClick={processUrl}
                      disabled={!url.trim() || isProcessing}
                      className={cn(
                        "px-6 py-2 rounded-lg font-medium transition-colors",
                        "bg-accent text-white hover:bg-accent/90",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? "Processing..." : "Extract Content"}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-foreground-tertiary">
                  <p className="mb-2">Try these example URLs (demo data will be shown):</p>
                  <div className="flex flex-wrap gap-2">
                    {demoUrls.map((demoUrl) => (
                      <button
                        key={demoUrl}
                        onClick={() => setUrl(demoUrl)}
                        className="px-3 py-1 bg-background border border-foreground-tertiary/20 rounded text-xs hover:bg-background-tertiary transition-colors"
                        disabled={isProcessing}
                      >
                        {demoUrl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-background-secondary rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Extraction Results</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-foreground-secondary mb-2">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {result.item.title}</div>
                        <div><strong>Word Count:</strong> {result.item.wordCount?.toLocaleString()}</div>
                        <div><strong>Reading Time:</strong> {result.item.estMinutes} minutes</div>
                        <div><strong>Status:</strong> {result.success ? "✅ Success" : "❌ Failed"}</div>
                      </div>
                    </div>

                    {result.extractedContent && (
                      <div>
                        <h3 className="font-medium text-sm text-foreground-secondary mb-2">Content Analysis</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>Readability Score:</strong> {result.extractedContent.readabilityScore}/100</div>
                          <div><strong>Author:</strong> {result.extractedContent.author || "Unknown"}</div>
                          <div><strong>Published:</strong> {result.extractedContent.publishedDate ? new Date(result.extractedContent.publishedDate).toLocaleDateString() : "Unknown"}</div>
                          <div><strong>Site:</strong> {result.extractedContent.siteName || "Unknown"}</div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium text-sm text-foreground-secondary mb-2">Auto-Generated Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {result.item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-accent/10 text-accent text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-foreground-secondary mb-2">Content Excerpt</h3>
                      <div className="text-sm bg-background border border-foreground-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
                        {result.item.synopsis || "No excerpt available"}
                      </div>
                    </div>

                    {result.extractedContent && (
                      <>
                        <div>
                          <h3 className="font-medium text-sm text-foreground-secondary mb-2">
                            Images ({result.extractedContent.images.length})
                          </h3>
                          <div className="text-xs text-foreground-tertiary max-h-20 overflow-y-auto">
                            {result.extractedContent.images.length > 0 ? (
                              result.extractedContent.images.map((img, i) => (
                                <div key={i} className="truncate">{img}</div>
                              ))
                            ) : (
                              "No images found"
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium text-sm text-foreground-secondary mb-2">
                            Links ({result.extractedContent.links.length})
                          </h3>
                          <div className="text-xs text-foreground-tertiary max-h-20 overflow-y-auto">
                            {result.extractedContent.links.length > 0 ? (
                              result.extractedContent.links.slice(0, 5).map((link, i) => (
                                <div key={i} className="truncate">
                                  <span className="font-medium">{link.text}</span> → {link.url}
                                </div>
                              ))
                            ) : (
                              "No links found"
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Processing Error</h2>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Features Overview */}
            <div className="bg-background-secondary rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Content Processing Features</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  icon="🌐"
                  title="Web Scraping"
                  description="Extract clean, readable content from any web page using Mozilla Readability"
                />
                <FeatureCard
                  icon="🏷️"
                  title="Auto-Tagging"
                  description="Automatically generate relevant tags based on content analysis"
                />
                <FeatureCard
                  icon="📊"
                  title="Reading Metrics"
                  description="Calculate reading time, word count, and readability scores"
                />
                <FeatureCard
                  icon="🖼️"
                  title="Media Extraction"
                  description="Extract and catalog images and links from web pages"
                />
                <FeatureCard
                  icon="📝"
                  title="Metadata Detection"
                  description="Extract author, publication date, and site information"
                />
                <FeatureCard
                  icon="🎯"
                  title="Content Analysis"
                  description="Analyze content quality and generate summaries"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      <ContentProcessingStatus
        isProcessing={isProcessing}
        progress={progress}
        status={status}
      />
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-background border border-foreground-tertiary/20 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-foreground-secondary">{description}</p>
    </div>
  );
}
