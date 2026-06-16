import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';

export async function GET() {
  try {
    const session = await getSession();
    console.log('Session check:', { accessToken: !!session.accessToken, refreshToken: !!session.refreshToken, isLoggedIn: isLoggedIn(session) });

    if (!isLoggedIn(session)) {
      console.log('Not logged in, returning false');
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
  } catch (error) {
    console.error('Session check error:', error);
    return Response.json({ isLoggedIn: false }, { status: 200 });
  }
}
