import { downloadVideo } from '@/lib/ytdlp';
import { downloadVideoWithOAuth } from '@/lib/youtube-download';
import { ensureDirs } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { getSession, isLoggedIn } from '@/lib/session';

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new Error('Invalid YouTube URL');
}

export async function POST(req: Request) {
  try {
    ensureDirs();

    const { url } = await req.json();
    logger.debug('Download route received URL:', url);

    if (!url) {
      return Response.json({ error: 'URL required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    logger.debug('Extracted video ID:', videoId);

    const session = await getSession();
    let info;

    // Try OAuth-authenticated download first if user is logged in
    if (isLoggedIn(session) && session.accessToken) {
      logger.info('📺 Attempting OAuth-authenticated download for video:', videoId);
      try {
        info = await downloadVideoWithOAuth(videoId, session.accessToken);
        logger.info('✓ OAuth download successful:', info.title);
        return Response.json({ success: true, ...info });
      } catch (oauthError) {
        logger.error('OAuth download failed, falling back to standard yt-dlp:', oauthError);
        // Fall through to standard download
      }
    }

    // Fall back to standard yt-dlp download
    logger.info('📥 Downloading video with yt-dlp:', { url, videoId });
    info = await downloadVideo(url);
    logger.info('✓ Video download complete:', info.title);
    return Response.json({ success: true, ...info });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Download failed';
    logger.error('Download error:', error);

    // Provide helpful error messages for common issues
    if (errorMsg.includes('429') || errorMsg.includes('bot')) {
      return Response.json(
        {
          error: 'YouTube is blocking the download request. Please try again in a few moments, or ensure you\'re logged in with a valid YouTube account.',
          details: errorMsg
        },
        { status: 429 }
      );
    }

    return Response.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
