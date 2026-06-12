import { readKeywords, writeKeywords } from '@/lib/keywords';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return Response.json({ error: 'keyword required' }, { status: 400 });
    }

    const keywords = readKeywords();
    const updated = keywords.filter((k) => k !== keyword);
    writeKeywords(updated);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete keyword error:', error);
    return Response.json({ error: 'Failed to delete keyword' }, { status: 500 });
  }
}
