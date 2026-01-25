const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const cheerio = require('cheerio');

async function testExtraction() {
  const url = 'https://daringfireball.net/linked/2025/09/06/siegler-cynical-read';
  
  console.log('Fetching:', url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const html = await response.text();
  console.log('HTML length:', html.length);
  
  // Try Cheerio extraction
  const $ = cheerio.load(html);
  
  console.log('\n=== CHEERIO EXTRACTION ===');
  
  // Look for Daring Fireball's specific structure
  console.log('Looking for dl.linkedlist elements...');
  const dlElements = $('dl.linkedlist');
  console.log('Found dl.linkedlist elements:', dlElements.length);
  
  dlElements.each((i, elem) => {
    const $dl = $(elem);
    const $dt = $dl.find('dt').first();
    const $dd = $dl.find('dd').first();
    
    console.log(`\nArticle ${i + 1}:`);
    console.log('Title from dt:', $dt.text().trim().substring(0, 100));
    console.log('Content from dd (text):', $dd.text().trim().substring(0, 200));
    console.log('Content from dd (html) length:', ($dd.html() || '').length);
  });
  
  // Also try the main content area
  console.log('\n=== MAIN CONTENT AREA ===');
  const mainContent = $('#Main');
  console.log('Found #Main:', mainContent.length > 0);
  console.log('#Main text length:', mainContent.text().length);
  console.log('#Main html length:', mainContent.html()?.length);
  
  // Try Mozilla Readability
  console.log('\n=== READABILITY EXTRACTION ===');
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (article) {
      console.log('Title:', article.title);
      console.log('Content length:', article.content?.length);
      console.log('Text length:', article.textContent?.length);
      console.log('Excerpt:', article.excerpt?.substring(0, 200));
    } else {
      console.log('Readability failed to parse');
    }
  } catch (e) {
    console.log('Readability error:', e.message);
  }
}

testExtraction().catch(console.error);
