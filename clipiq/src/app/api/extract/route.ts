import { extractClip } from '@/lib/ffmpeg';
import { ClipSuggestion } from '@/types';

export async function POST(req: Request) {
  try {
    const { videoPath, clip } = await req.json();

    if (!videoPath || !clip) {
      return Response.json({ error: 'videoPath and clip required' }, { status: 400 });
    }

    const clipData = clip as ClipSuggestion;
    const filename = extractClip(videoPath, clipData.start_ms, clipData.end_ms, clipData.id, clipData.headline);

    return Response.json({ success: true, filename, clipPath: `/api/serve-clip/${filename}` });
  } catch (error) {
    console.error('Extract error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
