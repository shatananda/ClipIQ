import { readKeywords, writeKeywords, readDeleted, writeDeleted } from '@/lib/keywords';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return Response.json({ error: 'keyword required' }, { status: 400 });
    }

    // Remove from active keywords
    const keywords = readKeywords();
    const updated = keywords.filter((k) => k !== keyword);
    writeKeywords(updated);

    // Add to permanently deleted keywords (so it won't come back on scrape)
    const deleted = readDeleted();
    if (!deleted.includes(keyword)) {
      deleted.push(keyword);
      writeDeleted(deleted);
    }

    return Response.json({ success: true });
  } catch (error) {
    logger.error('Delete keyword error:', error);
    return Response.json({ error: 'Failed to delete keyword' }, { status: 500 });
  }
}
