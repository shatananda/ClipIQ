import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';

export async function GET() {
  const session = await getSession();

  if (!isLoggedIn(session)) {
    return Response.json({ isLoggedIn: false });
  }

  if (session.expiryDate && isTokenExpiringSoon(session.expiryDate)) {
    try {
      const { accessToken, expiryDate } = await refreshAccessToken(session.refreshToken!);
      session.accessToken = accessToken;
      session.expiryDate = expiryDate;
      await session.save();
    } catch (error) {
      console.error('Token refresh failed:', error);
      session.destroy();
      return Response.json({ isLoggedIn: false });
    }
  }

  return Response.json({ isLoggedIn: true });
}
