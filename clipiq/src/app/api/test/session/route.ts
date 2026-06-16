import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getSession();

    // Set test data
    session.accessToken = body.accessToken || 'test-token';
    session.refreshToken = body.refreshToken || 'test-refresh';
    session.expiryDate = body.expiryDate || Date.now() + 3600000;

    await session.save();
    console.log('✓ Test session saved');

    return Response.json({ success: true, session });
  } catch (error) {
    console.error('Test session error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  console.log('✓ Test session retrieved:', { accessToken: !!session.accessToken, refreshToken: !!session.refreshToken });
  return Response.json({ session });
}
