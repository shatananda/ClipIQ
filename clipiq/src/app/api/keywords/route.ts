import { readKeywords, scrapeKeywords, getNonExcludedKeywords } from '@/lib/keywords';

export async function GET() {
  try {
    const keywords = readKeywords();
    const lastScraped = new Date(0).toISOString();
    return Response.json({ success: true, keywords, lastScraped });
  } catch (error) {
    console.error('Keywords error:', error);
    return Response.json({ error: 'Failed to load keywords' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const keywords = await scrapeKeywords();
    return Response.json({ success: true, keywords, lastScraped: new Date().toISOString() });
  } catch (error) {
    console.error('Scrape error:', error);
    return Response.json({ error: 'Failed to scrape keywords' }, { status: 500 });
  }
}
