import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';
import { getChannelUploadsPlaylistId, listVideos } from '@/lib/youtube-api';

export async function GET(request: Request) {
  const session = await getSession();

  if (!isLoggedIn(session)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accessToken = session.accessToken!;

  if (session.expiryDate && isTokenExpiringSoon(session.expiryDate)) {
    try {
      const { accessToken: newToken, expiryDate } = await refreshAccessToken(session.refreshToken!);
      accessToken = newToken;
      session.accessToken = newToken;
      session.expiryDate = expiryDate;
      await session.save();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return Response.json({ error: 'Token refresh failed' }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;

    const playlistId = await getChannelUploadsPlaylistId(accessToken);
    const { videos, nextPageToken } = await listVideos(accessToken, playlistId, pageToken);

    return Response.json({ videos, nextPageToken });
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return Response.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
