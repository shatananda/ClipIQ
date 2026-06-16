import { exchangeCode, getOAuthClient } from '@/lib/youtube-oauth';
import { getSession } from '@/lib/session';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    const { accessToken, refreshToken, expiryDate } = await exchangeCode(code);
    console.log('✓ Code exchanged for tokens');

    const session = await getSession();
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.expiryDate = expiryDate;
    console.log('✓ Session tokens set:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

    // Set up OAuth client with the new credentials
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
    });

    const youtube = google.youtube('v3');
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['id'],
      mine: true,
    });

    const channelId = response.data.items?.[0]?.id;
    if (channelId) {
      session.channelId = channelId;
    }
    console.log('✓ Channel ID retrieved:', channelId);

    await session.save();
    console.log('✓ Session saved', { accessToken: session.accessToken?.substring(0, 10), refreshToken: !!session.refreshToken });

    // Verify session was persisted
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('clipiq_session');
    console.log('✓ Session cookie set:', !!sessionCookie?.value, 'length:', sessionCookie?.value?.length);

    const redirectResponse = NextResponse.redirect(new URL('/videos', request.url));
    return redirectResponse;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
