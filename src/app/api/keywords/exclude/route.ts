import { toggleExcluded } from '@/lib/keywords';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return Response.json({ error: 'keyword required' }, { status: 400 });
    }

    const excluded = toggleExcluded(keyword);
    return Response.json({ success: true, excluded });
  } catch (error) {
    logger.error('Exclude error:', error);
    return Response.json({ error: 'Failed to toggle keyword' }, { status: 500 });
  }
}
