import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  channelId?: string;
}

class SimpleSession implements SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  channelId?: string;

  constructor(data: SessionData = {}) {
    Object.assign(this, data);
  }

  async save() {
    const cookieStore = await cookies();
    const encrypted = encryptSession(this);
    cookieStore.set('clipiq_session', encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }

  async destroy() {
    const cookieStore = await cookies();
    cookieStore.delete('clipiq_session');
  }
}

function encryptSession(data: SessionData): string {
  const secret = (process.env.SESSION_SECRET || 'default-secret-change-me-in-production').substring(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSession(encrypted: string): SessionData {
  try {
    const secret = (process.env.SESSION_SECRET || 'default-secret-change-me-in-production').substring(0, 32);
    const [ivHex, encryptedHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Session decryption failed:', error);
    return {};
  }
}

export async function getSession(): Promise<SimpleSession> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('clipiq_session');

  if (sessionCookie?.value) {
    const data = decryptSession(sessionCookie.value);
    return new SimpleSession(data);
  }

  return new SimpleSession();
}

export function isLoggedIn(session: SessionData): boolean {
  return !!session.accessToken && !!session.refreshToken;
}
