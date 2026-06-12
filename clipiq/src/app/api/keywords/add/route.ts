import { addCustomKeyword } from '@/lib/keywords';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return Response.json({ error: 'keyword required' }, { status: 400 });
    }

    addCustomKeyword(keyword);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Add keyword error:', error);
    return Response.json({ error: 'Failed to add keyword' }, { status: 500 });
  }
}
