import { exchangeCode } from '@/lib/youtube-oauth';
import { getSession } from '@/lib/session';
import { getChannelUploadsPlaylistId } from '@/lib/youtube-api';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return Response.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    const { accessToken, refreshToken, expiryDate } = await exchangeCode(code);

    const session = await getSession();
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.expiryDate = expiryDate;

    const youtube = google.youtube('v3');
    const response = await youtube.channels.list({
      auth: accessToken,
      part: ['id'],
      mine: true,
    });

    const channelId = response.data.items?.[0]?.id;
    if (channelId) {
      session.channelId = channelId;
    }

    await session.save();

    return Response.redirect(new URL('/videos', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
