import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';
import { getChannelUploadsPlaylistId, listVideos } from '@/lib/youtube-api';

export async function GET(request: Request) {
  console.log('📺 GET /api/youtube/videos');
  const session = await getSession();
  console.log('   Session check:', { isLoggedIn: isLoggedIn(session), hasToken: !!session.accessToken });

  if (!isLoggedIn(session)) {
    console.log('   ❌ Not logged in');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accessToken = session.accessToken!;

  if (session.expiryDate && isTokenExpiringSoon(session.expiryDate)) {
    console.log('   🔄 Token expiring soon, refreshing...');
    try {
      const { accessToken: newToken, expiryDate } = await refreshAccessToken(session.refreshToken!);
      accessToken = newToken;
      session.accessToken = newToken;
      session.expiryDate = expiryDate;
      await session.save();
      console.log('   ✓ Token refreshed');
    } catch (error) {
      console.error('   ❌ Token refresh failed:', error);
      return Response.json({ error: 'Token refresh failed' }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;

    console.log('   📂 Fetching uploads playlist...');
    const playlistId = await getChannelUploadsPlaylistId(accessToken);
    console.log('   ✓ Got playlist:', playlistId);

    console.log('   📝 Fetching videos...');
    const { videos, nextPageToken } = await listVideos(accessToken, playlistId, pageToken);
    console.log('   ✓ Got', videos.length, 'videos');

    return Response.json({ videos, nextPageToken });
  } catch (error) {
    console.error('   ❌ Failed to fetch videos:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
