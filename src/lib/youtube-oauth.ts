import { google } from 'googleapis';
import { logger } from './logger';

export function getOAuthClient() {
  logger.debug('🔐 getOAuthClient() called with REDIRECT_URI:', process.env.GOOGLE_OAUTH_REDIRECT_URI);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
  return oauth2Client;
}

export function getAuthUrl(): string {
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
    prompt: 'consent',
  });
  logger.debug('🔐 Generated OAuth URL:', url);
  logger.debug('🔐 Redirect URI in URL:', url.includes('redirect_uri=') ? url.substring(url.indexOf('redirect_uri='), url.indexOf('redirect_uri=') + 100) : 'NOT FOUND');
  return url;
}

export async function exchangeCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiryDate: tokens.expiry_date!,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token!,
    expiryDate: credentials.expiry_date!,
  };
}

export function isTokenExpiringSoon(expiryDate: number): boolean {
  const fiveMinutesMs = 5 * 60 * 1000;
  return Date.now() + fiveMinutesMs > expiryDate;
}
