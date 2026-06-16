import { exchangeCode, getOAuthClient } from '@/lib/youtube-oauth';
import { getSession } from '@/lib/session';
import { logger } from '@/lib/logger';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  logger.debug('🔐 Callback request.url:', request.url);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    const { accessToken, refreshToken, expiryDate } = await exchangeCode(code);
    logger.info('✓ Code exchanged for tokens');

    const session = await getSession();
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.expiryDate = expiryDate;
    logger.debug('✓ Session tokens set:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

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
    logger.info('✓ Channel ID retrieved:', channelId);

    await session.save();
    logger.info('✓ Session saved', { accessToken: session.accessToken?.substring(0, 10), refreshToken: !!session.refreshToken });

    // Verify session was persisted
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('clipiq_session');
    logger.debug('✓ Session cookie set:', !!sessionCookie?.value, 'length:', sessionCookie?.value?.length);

    // Use Railway's public domain if available, otherwise fall back to request.url
    let redirectUrl;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      redirectUrl = new URL('/videos', `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      logger.debug('🔐 Using Railway domain:', process.env.RAILWAY_PUBLIC_DOMAIN);
    } else {
      redirectUrl = new URL('/videos', request.url);
    }
    logger.debug('🔐 Redirecting to:', redirectUrl.toString());
    const redirectResponse = NextResponse.redirect(redirectUrl);
    return redirectResponse;
  } catch (error) {
    logger.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
