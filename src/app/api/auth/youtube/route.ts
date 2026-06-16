import { getAuthUrl } from '@/lib/youtube-oauth';
import { logger } from '@/lib/logger';

export async function GET() {
  logger.debug('🔐 OAuth route - GOOGLE_OAUTH_REDIRECT_URI:', process.env.GOOGLE_OAUTH_REDIRECT_URI);
  const authUrl = getAuthUrl();
  logger.debug('🔐 Generated auth URL:', authUrl.substring(0, 100) + '...');
  return Response.redirect(authUrl);
}
