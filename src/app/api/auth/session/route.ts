import { getSession, isLoggedIn } from '@/lib/session';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/youtube-oauth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSession();
    logger.debug('Session check:', { accessToken: !!session.accessToken, refreshToken: !!session.refreshToken, isLoggedIn: isLoggedIn(session) });

    if (!isLoggedIn(session)) {
      logger.debug('Not logged in, returning false');
      return Response.json({ isLoggedIn: false });
    }

    if (session.expiryDate && isTokenExpiringSoon(session.expiryDate)) {
      try {
        const { accessToken, expiryDate } = await refreshAccessToken(session.refreshToken!);
        session.accessToken = accessToken;
        session.expiryDate = expiryDate;
        await session.save();
      } catch (error) {
        logger.error('Token refresh failed:', error);
        session.destroy();
        return Response.json({ isLoggedIn: false });
      }
    }

    return Response.json({ isLoggedIn: true });
  } catch (error) {
    logger.error('Session check error:', error);
    return Response.json({ isLoggedIn: false }, { status: 200 });
  }
}
