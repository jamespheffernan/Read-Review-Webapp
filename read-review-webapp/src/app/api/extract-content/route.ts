import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import sanitizeHtml from 'sanitize-html';

const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;

class ExtractionRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

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

interface PageMetadata {
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  publishedDate?: string;
}

interface ExtractionOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  generateTags?: boolean;
  detectLanguage?: boolean;
  maxContentLength?: number;
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.ALLOW_REMOTE_EXTRACTION !== '1') {
      return NextResponse.json(
        { error: 'Remote extraction is disabled' },
        { status: 503 },
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      throw new ExtractionRequestError('A JSON request body is required', 400);
    }

    const { url, options = {} } = body as {
      url?: unknown;
      options?: ExtractionOptions;
    };

    if (typeof url !== 'string' || url.length > 2_048) {
      throw new ExtractionRequestError('A valid URL is required', 400);
    }

    const response = await fetchPublicPage(url);

    if (!response.ok) {
      throw new ExtractionRequestError(
        `The remote page returned HTTP ${response.status}`,
        502,
      );
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new ExtractionRequestError('The remote resource is not an HTML page', 415);
    }

    const html = await readLimitedText(response);
    const extractedContent = await extractFromHtml(html, url, options);

    return NextResponse.json({
      success: true,
      data: extractedContent,
    });

  } catch (error) {
    if (!(error instanceof ExtractionRequestError)) {
      console.error('Content extraction error:', error);
    }
    const status = error instanceof ExtractionRequestError ? error.status : 500;
    return NextResponse.json(
      {
        error: error instanceof ExtractionRequestError
          ? error.message
          : 'Content extraction failed',
      },
      { status },
    );
  }
}

async function fetchPublicPage(input: string): Promise<Response> {
  let currentUrl = await validatePublicUrl(input);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadReview/0.1)',
        },
      });
    } catch {
      throw new ExtractionRequestError('The remote page could not be reached', 502);
    }

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new ExtractionRequestError('The remote page returned an invalid redirect', 502);
    }
    if (redirectCount === MAX_REDIRECTS) {
      throw new ExtractionRequestError('The remote page redirected too many times', 502);
    }

    currentUrl = await validatePublicUrl(new URL(location, currentUrl).toString());
  }

  throw new ExtractionRequestError('The remote page could not be reached', 502);
}

async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ExtractionRequestError('The URL is invalid', 400);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ExtractionRequestError('Only HTTP and HTTPS URLs are supported', 400);
  }
  if (url.username || url.password) {
    throw new ExtractionRequestError('URLs containing credentials are not supported', 400);
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const blockedSuffixes = ['.localhost', '.local', '.internal', '.home', '.lan'];
  if (
    !hostname.includes('.') ||
    hostname === 'localhost' ||
    blockedSuffixes.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new ExtractionRequestError('Private and local network addresses are not supported', 400);
  }

  const defaultPort = url.protocol === 'https:' ? '443' : '80';
  if (url.port && url.port !== defaultPort) {
    throw new ExtractionRequestError('Only standard HTTP and HTTPS ports are supported', 400);
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ExtractionRequestError('The remote host could not be resolved', 400);
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => ipaddr.process(address).range() !== 'unicast')
  ) {
    throw new ExtractionRequestError('Private and reserved network addresses are not supported', 400);
  }

  return url;
}

async function readLimitedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAGE_BYTES) {
    throw new ExtractionRequestError('The remote page is larger than 2 MB', 413);
  }
  if (!response.body) {
    throw new ExtractionRequestError('The remote page returned no content', 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_PAGE_BYTES) {
      await reader.cancel();
      throw new ExtractionRequestError('The remote page is larger than 2 MB', 413);
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

async function extractFromHtml(html: string, url?: string, options: ExtractionOptions = {}): Promise<ExtractedContent> {
  // Use Cheerio for metadata and fallback extraction
  const $ = cheerio.load(html);
  
  // Extract metadata first
  const metadata = extractMetadata($);
  
  // Try multiple extraction methods
  let article: {
    title?: string | null;
    content?: string | null;
    textContent?: string | null;
    byline?: string | null;
  } | null = null;
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

function extractMetadata($: cheerio.CheerioAPI): PageMetadata {
  const metadata: PageMetadata = {};

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
    } catch {
      // Ignore JSON parsing errors
    }
  });

  return metadata;
}

function processContent(content: string, options: ExtractionOptions): string {
  const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'figure',
      'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: 'a',
        attribs: {
          ...attributes,
          rel: 'noopener noreferrer',
        },
      }),
    },
  };

  let processed = sanitizeHtml(content, sanitizeOptions);

  // Limit content length if specified
  if (
    typeof options.maxContentLength === 'number' &&
    options.maxContentLength > 0 &&
    processed.length > options.maxContentLength
  ) {
    processed = `${sanitizeHtml(
      processed.substring(0, options.maxContentLength),
      sanitizeOptions,
    )}...`;
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
      } catch {
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
      } catch {
        // Skip invalid URLs
      }
    }
  });

  return links.slice(0, 20); // Limit to 20 links
}

function generateTags(content: string, metadata: PageMetadata): string[] {
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
