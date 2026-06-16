import { getAuthUrl } from '@/lib/youtube-oauth';

export async function GET() {
  console.log('🔐 OAuth route - GOOGLE_OAUTH_REDIRECT_URI:', process.env.GOOGLE_OAUTH_REDIRECT_URI);
  const authUrl = getAuthUrl();
  console.log('🔐 Generated auth URL:', authUrl.substring(0, 100) + '...');
  return Response.redirect(authUrl);
}
