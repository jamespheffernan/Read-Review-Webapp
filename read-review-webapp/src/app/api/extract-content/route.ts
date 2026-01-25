import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedDate?: string; // Changed to string for JSON serialization
  siteName?: string;
  readingTime: number;
  wordCount: number;
  readabilityScore: number;
  images: string[];
  links: Array<{ url: string; text: string }>;
  tags: string[];
  language?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, options = {} } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReadReview/1.0; +https://readreview.app)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const extractedContent = await extractFromHtml(html, url, options);

    return NextResponse.json({
      success: true,
      data: extractedContent,
    });

  } catch (error) {
    console.error('Content extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Content extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function extractFromHtml(html: string, url?: string, options: Record<string, unknown> = {}): Promise<ExtractedContent> {
  // Use Cheerio for metadata and fallback extraction
  const $ = cheerio.load(html);
  
  // Extract metadata first
  const metadata = extractMetadata($, url);
  
  // Try multiple extraction methods
  let article: { title?: string; content?: string; textContent?: string; byline?: string } | null = null;
  let extractedContent = '';
  let extractedText = '';
  
  // Method 1: Try Mozilla Readability first
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const reader = new Readability(doc, {
      keepClasses: false,
      classesToPreserve: [],
    });
    article = reader.parse();
  } catch (e) {
    console.warn('Readability extraction failed:', e);
  }
  
  // Method 2: Special handling for known sites that Readability struggles with
  if (url?.includes('daringfireball.net')) {
    console.log('Using custom Daring Fireball extraction');
    const customExtracted = extractDaringFireball($);
    if (customExtracted.content && customExtracted.textContent && customExtracted.textContent.length > 50) {
      article = customExtracted;
    }
  }
  
  // Method 3: If Readability fails or gets poor results, try custom extraction
  if (!article || !article.content || countWords(article.textContent || '') < 100) {
    console.log('Falling back to generic custom extraction for:', url);
    const customExtracted = extractWithCheerio($);
    if (customExtracted.content) {
      article = customExtracted;
    }
  }
  
  // If we still have no content, throw error
  if (!article || !article.content) {
    throw new Error('Could not extract readable content from the page');
  }
  
  // Use the extracted content
  extractedContent = article.content || '';
  extractedText = article.textContent || stripHtmlTags(extractedContent);
  
  // Process content
  const processedContent = processContent(extractedContent, options);
  
  // Calculate reading metrics
  const wordCount = countWords(extractedText);
  const readingTime = estimateReadingTime(wordCount);
  const readabilityScore = calculateReadabilityScore(extractedText);

  // Extract additional data
  const images = options.includeImages !== false ? extractImages($, url) : [];
  const links = options.includeLinks !== false ? extractLinks($, url) : [];
  const tags = options.generateTags !== false ? generateTags(extractedText, metadata) : [];
  const language = options.detectLanguage !== false ? detectLanguage(extractedText) : undefined;

  return {
    title: article.title || metadata.title || 'Untitled',
    content: processedContent,
    excerpt: generateExcerpt(extractedText),
    author: article.byline || metadata.author,
    publishedDate: metadata.publishedDate,
    siteName: metadata.siteName || extractSiteName(url),
    readingTime,
    wordCount,
    readabilityScore,
    images,
    links,
    tags,
    language,
  };
}

// Special extraction for Daring Fireball
function extractDaringFireball($: cheerio.CheerioAPI): { title?: string; content?: string; textContent?: string; byline?: string } {
  let content = '';
  let title = '';
  let textContent = '';
  
  // Daring Fireball has a unique structure with dl/dt/dd elements for linked list items
  // and different structure for full articles
  
  // First check if this is a linked list item (most common on DF)
  const linkedListItems = $('dl.linkedlist');
  if (linkedListItems.length > 0) {
    const articles: string[] = [];
    
    linkedListItems.each((_, element) => {
      const $dl = $(element);
      const $dt = $dl.find('dt').first();
      const $dd = $dl.find('dd').first();
      
      // Get the title from dt (remove the permalink star)
      const dtText = $dt.clone();
      dtText.find('a.permalink').remove();
      const articleTitle = dtText.text().trim();
      
      if (articleTitle && !title) {
        title = articleTitle;
      }
      
      // Get the content from dd
      const articleContent = $dd.html();
      if (articleContent) {
        // Don't add redundant title if we only have one article
        if (linkedListItems.length === 1) {
          articles.push(articleContent);
        } else {
          articles.push(`<h2>${articleTitle}</h2>\n${articleContent}`);
        }
      }
    });
    
    content = articles.join('\n\n');
  }
  
  // If no linked list items, check for regular article structure
  if (!content) {
    // Look for the main content area
    const mainContent = $('#Main');
    if (mainContent.length > 0) {
      // Remove the sidebar and other non-content elements
      const $main = mainContent.clone();
      $main.find('#Sidebar, .sidebar, nav, .navigation').remove();
      
      content = $main.html() || '';
      
      // Try to extract title from h1 or first heading
      if (!title) {
        title = $main.find('h1').first().text().trim() || 
                $main.find('h2').first().text().trim() ||
                $('title').text().replace(' - Daring Fireball', '').trim();
      }
    }
  }
  
  // If still no content, try the entire #Box area
  if (!content) {
    const box = $('#Box');
    if (box.length > 0) {
      const $box = box.clone();
      // Remove sidebar and navigation
      $box.find('#Sidebar, .sidebar, nav, .navigation, script, style').remove();
      content = $box.html() || '';
    }
  }
  
  textContent = stripHtmlTags(content);
  
  // Extract byline - DF articles are always by John Gruber
  const byline = 'John Gruber';
  
  return {
    title: title || 'Untitled',
    content,
    textContent,
    byline,
  };
}

// Generic fallback extraction using Cheerio
function extractWithCheerio($: cheerio.CheerioAPI): { title?: string; content?: string; textContent?: string; byline?: string } {
  let content = '';
  let title = '';
  
  // Try to find the main content area
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.post',
    '.entry',
    '.content',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '#main',
    '.main-content',
    '.body',
    '.story',
  ];
  
  for (const selector of contentSelectors) {
    const $element = $(selector).first();
    if ($element.length && $element.text().length > 100) {
      content = $element.html() || '';
      break;
    }
  }
  
  // If no main content found, try to extract from body
  if (!content) {
    // Remove navigation, headers, footers, sidebars
    const $body = $('body').clone();
    $body.find('nav, header, footer, aside, .nav, .header, .footer, .sidebar, .menu, script, style, noscript').remove();
    content = $body.html() || '';
  }
  
  // Extract title
  title = $('h1').first().text().trim() || $('title').text().trim();
  
  // Extract byline
  const byline = $('.byline, .author, .by, [rel="author"]').first().text().trim();
  
  const textContent = stripHtmlTags(content);
  
  return {
    title,
    content,
    textContent,
    byline,
  };
}

// Extract site name from URL
function extractSiteName(url?: string): string | undefined {
  if (!url) return undefined;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    // Special cases for known sites
    const siteNames: Record<string, string> = {
      'daringfireball.net': 'Daring Fireball',
      'github.com': 'GitHub',
      'stackoverflow.com': 'Stack Overflow',
      'medium.com': 'Medium',
      'dev.to': 'DEV Community',
      'hackernews.com': 'Hacker News',
      'reddit.com': 'Reddit',
      'twitter.com': 'Twitter',
      'x.com': 'X',
    };
    
    return siteNames[hostname] || hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return undefined;
  }
}

function extractMetadata($: cheerio.CheerioAPI, _url?: string) {
  const metadata: Record<string, unknown> = {};

  // OpenGraph and Twitter Card metadata
  metadata.title = 
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    '';

  metadata.description = 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  metadata.author = 
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('.author, .byline, [rel="author"]').first().text().trim() ||
    undefined;

  metadata.siteName = 
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    undefined;

  // Try to extract published date
  const publishedTime = 
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    $('.published, .date, .timestamp').first().attr('datetime') ||
    $('.published, .date, .timestamp').first().text();

  if (publishedTime) {
    const date = new Date(publishedTime);
    if (!isNaN(date.getTime())) {
      metadata.publishedDate = date.toISOString(); // Convert to ISO string for JSON
    }
  }

  // Try to extract from JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const jsonLd = JSON.parse($(element).html() || '');
      if (jsonLd['@type'] === 'Article' || jsonLd['@type'] === 'NewsArticle') {
        metadata.title = metadata.title || jsonLd.headline;
        metadata.author = metadata.author || jsonLd.author?.name;
        metadata.publishedDate = metadata.publishedDate || (jsonLd.datePublished ? new Date(jsonLd.datePublished).toISOString() : undefined);
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  });

  return metadata;
}

function processContent(content: string, options: Record<string, unknown>): string {
  let processed = content;

  // Limit content length if specified
  if (options.maxContentLength && processed.length > options.maxContentLength) {
    processed = processed.substring(0, options.maxContentLength) + '...';
  }

  // Clean up extra whitespace
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractImages($: cheerio.CheerioAPI, baseUrl?: string): string[] {
  const images: string[] = [];
  const seenUrls = new Set<string>();

  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src && !seenUrls.has(src)) {
      try {
        const absoluteUrl = baseUrl ? new URL(src, baseUrl).href : src;
        images.push(absoluteUrl);
        seenUrls.add(src);
      } catch (e) {
        // Skip invalid URLs
      }
    }
  });

  return images.slice(0, 10); // Limit to 10 images
}

function extractLinks($: cheerio.CheerioAPI, baseUrl?: string): Array<{ url: string; text: string }> {
  const links: Array<{ url: string; text: string }> = [];
  const seenUrls = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const text = $(element).text().trim();
    
    if (href && text && !seenUrls.has(href)) {
      try {
        const absoluteUrl = baseUrl ? new URL(href, baseUrl).href : href;
        links.push({ url: absoluteUrl, text });
        seenUrls.add(href);
      } catch (e) {
        // Skip invalid URLs
      }
    }
  });

  return links.slice(0, 20); // Limit to 20 links
}

function generateTags(content: string, metadata: Record<string, unknown>): string[] {
  const tags: string[] = [];
  const text = content.toLowerCase();

  // Technology tags
  const techTerms = ['javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'python', 'java', 'go', 'rust', 'css', 'html', 'api', 'database', 'ai', 'machine learning', 'blockchain'];
  techTerms.forEach(term => {
    if (text.includes(term.toLowerCase())) {
      tags.push(term);
    }
  });

  // Content type tags
  if (text.includes('tutorial') || text.includes('how to') || text.includes('guide')) {
    tags.push('tutorial');
  }
  if (text.includes('news') || text.includes('announcement')) {
    tags.push('news');
  }
  if (text.includes('opinion') || text.includes('thoughts') || text.includes('perspective')) {
    tags.push('opinion');
  }
  if (text.includes('review') || text.includes('comparison')) {
    tags.push('review');
  }

  // Add site-based tags
  if (metadata.siteName) {
    const siteName = metadata.siteName.toLowerCase();
    if (siteName.includes('github')) tags.push('opensource');
    if (siteName.includes('medium') || siteName.includes('blog')) tags.push('blog');
    if (siteName.includes('stackoverflow')) tags.push('q&a');
  }

  return [...new Set(tags)].slice(0, 8); // Remove duplicates and limit
}

function detectLanguage(text: string): string {
  // Very basic language detection - in a real app you'd use a proper library
  const sample = text.substring(0, 1000).toLowerCase();
  
  // Common English words
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const englishScore = englishWords.reduce((score, word) => {
    return score + (sample.split(word).length - 1);
  }, 0);

  return englishScore > 5 ? 'en' : 'unknown';
}

function generateExcerpt(text: string, maxLength: number = 200): string {
  // Strip any HTML tags that might be present
  const stripped = stripHtmlTags(text);
  const cleaned = stripped.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = countWords(text);
  const syllables = countSyllables(text);

  if (sentences === 0 || words === 0) return 0;

  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  
  return words.reduce((total, word) => {
    let syllables = word.match(/[aeiouy]+/g)?.length || 1;
    if (word.endsWith('e')) syllables--;
    return total + Math.max(1, syllables);
  }, 0);
}
