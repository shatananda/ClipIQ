import { getAuthUrl } from '@/lib/youtube-oauth';

export async function GET() {
  const authUrl = getAuthUrl();
  return Response.redirect(authUrl);
}
