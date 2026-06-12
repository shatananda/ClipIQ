import { addCustomKeyword } from '@/lib/keywords';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { keyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return Response.json({ error: 'keyword required' }, { status: 400 });
    }

    addCustomKeyword(keyword);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Add keyword error:', error);
    return Response.json({ error: 'Failed to add keyword' }, { status: 500 });
  }
}
