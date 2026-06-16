import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';
import { getChannelUploadsPlaylistId, listVideos } from '@/lib/youtube-api';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  logger.info('📺 GET /api/youtube/videos');
  const session = await getSession();
  logger.debug('   Session check:', { isLoggedIn: isLoggedIn(session), hasToken: !!session.accessToken });

  if (!isLoggedIn(session)) {
    logger.debug('   ❌ Not logged in');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accessToken = session.accessToken!;

  if (session.expiryDate && isTokenExpiringSoon(session.expiryDate)) {
    logger.debug('   🔄 Token expiring soon, refreshing...');
    try {
      const { accessToken: newToken, expiryDate } = await refreshAccessToken(session.refreshToken!);
      accessToken = newToken;
      session.accessToken = newToken;
      session.expiryDate = expiryDate;
      await session.save();
      logger.debug('   ✓ Token refreshed');
    } catch (error) {
      logger.error('   ❌ Token refresh failed:', error);
      return Response.json({ error: 'Token refresh failed' }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;

    logger.debug('   📂 Fetching uploads playlist...');
    const playlistId = await getChannelUploadsPlaylistId(accessToken);
    logger.debug('   ✓ Got playlist:', playlistId);

    logger.debug('   📝 Fetching videos...');
    const { videos, nextPageToken } = await listVideos(accessToken, playlistId, pageToken);
    logger.info('   ✓ Got', videos.length, 'videos');

    return Response.json({ videos, nextPageToken });
  } catch (error) {
    logger.error('   ❌ Failed to fetch videos:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
