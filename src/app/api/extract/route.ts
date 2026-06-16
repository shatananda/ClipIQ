import { extractClip } from '@/lib/ffmpeg';
import { ClipSuggestion, Paragraph } from '@/types';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { videoPath, clip, videoId } = await req.json();

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

    // Try to load transcript from file if available
    let transcript: Paragraph[] | undefined;
    if (videoId) {
      const transcriptPath = path.join(process.cwd(), '.transcripts', `${videoId}.json`);
      try {
        if (fs.existsSync(transcriptPath)) {
          const transcriptData = fs.readFileSync(transcriptPath, 'utf-8');
          transcript = JSON.parse(transcriptData);
          logger.debug('Loaded transcript from file:', transcriptPath);
        }
      } catch (e) {
        logger.debug('Could not load transcript:', e);
      }
    }

    const clipData = clip as any;
    const cropPosition = clipData.cropPosition || 'center';
    const burnCaptions = clipData.burnCaptions !== false;
    const captionFontSize = clipData.captionFontSize || 18;
    logger.debug('Extracting clip:', { id: clipData.id, headline: clipData.headline, cropPosition, hasTranscript: !!transcript, burnCaptions, captionFontSize });
    const filename = await extractClip(videoPath, clipData.start_ms, clipData.end_ms, clipData.id, clipData.headline, cropPosition, transcript, burnCaptions, captionFontSize);

    return Response.json({ success: true, filename, clipPath: `/api/serve-clip/${filename}` });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Extraction failed';
    logger.error('Extract error:', error);
    return Response.json(
      {
        error: `Clip extraction failed: ${errorMsg}. Make sure FFmpeg is installed and the video file exists.`
      },
      { status: 500 }
    );
  }
}
