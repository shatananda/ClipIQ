import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  channelId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'default-secret-change-me-in-production',
  cookieName: 'clipiq_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export function isLoggedIn(session: SessionData): boolean {
  return !!session.accessToken && !!session.refreshToken;
}
