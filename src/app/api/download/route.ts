import { downloadVideo } from '@/lib/ytdlp';
import { ensureDirs } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    ensureDirs();

    const { url } = await req.json();
    logger.debug('Download route received URL:', url);

    if (!url) {
      return Response.json({ error: 'URL required' }, { status: 400 });
    }

    const session = await getSession();
    if (session.accessToken) {
      logger.debug('User authenticated, OAuth token available for download');
    }

    const info = await downloadVideo(url);
    logger.info('✓ Video download complete:', info.title);
    return Response.json({ success: true, ...info });
  } catch (error) {
    logger.error('Download error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
