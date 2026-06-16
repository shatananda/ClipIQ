import { readExcluded } from '@/lib/keywords';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const excluded = readExcluded();
    return Response.json({ success: true, excluded });
  } catch (error) {
    logger.error('Excluded keywords error:', error);
    return Response.json({ error: 'Failed to load excluded keywords', excluded: [] }, { status: 500 });
  }
}
