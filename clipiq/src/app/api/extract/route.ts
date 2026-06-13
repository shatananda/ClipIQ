import { extractClip } from '@/lib/ffmpeg';
import { ClipSuggestion } from '@/types';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const { videoPath, clip } = await req.json();

    if (!videoPath || !clip) {
      return Response.json({ error: 'videoPath and clip required' }, { status: 400 });
    }

    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      return Response.json(
        { error: `Video file not found at ${videoPath}. Please re-analyze the video.` },
        { status: 400 }
      );
    }

    const clipData = clip as ClipSuggestion;
    const filename = extractClip(videoPath, clipData.start_ms, clipData.end_ms, clipData.id, clipData.headline);

    return Response.json({ success: true, filename, clipPath: `/api/serve-clip/${filename}` });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Extraction failed';
    console.error('Extract error:', error);
    return Response.json(
      {
        error: `Clip extraction failed: ${errorMsg}. Make sure FFmpeg is installed and the video file exists.`
      },
      { status: 500 }
    );
  }
}
