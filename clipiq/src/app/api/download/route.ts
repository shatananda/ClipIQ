import { downloadVideo } from '@/lib/ytdlp';
import { ensureDirs } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    ensureDirs();

    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL required' }, { status: 400 });
    }

    const info = downloadVideo(url);
    return Response.json({ success: true, ...info });
  } catch (error) {
    console.error('Download error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
