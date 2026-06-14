import { extractClip } from '@/lib/ffmpeg';
import { ClipSuggestion, Paragraph } from '@/types';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { videoPath, clips, videoId } = await req.json();

    if (!videoPath || !clips || !Array.isArray(clips)) {
      return Response.json({ error: 'videoPath and clips array required' }, { status: 400 });
    }

    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      return Response.json(
        { error: `Video file not found at ${videoPath}. Please re-analyze the video.` },
        { status: 400 }
      );
    }

    // Load transcript if available
    let transcript: Paragraph[] | undefined;
    if (videoId) {
      const transcriptPath = path.join(process.cwd(), '.transcripts', `${videoId}.json`);
      try {
        if (fs.existsSync(transcriptPath)) {
          const transcriptData = fs.readFileSync(transcriptPath, 'utf-8');
          transcript = JSON.parse(transcriptData);
          console.log('Loaded transcript from file:', transcriptPath);
        }
      } catch (e) {
        console.warn('Could not load transcript:', e);
      }
    }

    // Extract all clips
    const results = [];
    for (const clip of clips) {
      try {
        const clipData = clip as any;
        const cropPosition = clipData.cropPosition || 'center';
        const burnCaptions = clipData.burnCaptions !== false;
        const captionFontSize = clipData.captionFontSize || 18;

        console.log('Batch extracting clip:', {
          id: clipData.id,
          headline: clipData.headline,
          cropPosition,
          burnCaptions,
        });

        const filename = await extractClip(
          videoPath,
          clipData.start_ms,
          clipData.end_ms,
          clipData.id,
          clipData.headline,
          cropPosition,
          transcript,
          burnCaptions,
          captionFontSize
        );

        results.push({
          id: clipData.id,
          headline: clipData.headline,
          filename,
          success: true,
        });
      } catch (clipError) {
        const errorMsg = clipError instanceof Error ? clipError.message : 'Failed to extract';
        results.push({
          id: clip.id,
          headline: clip.headline,
          success: false,
          error: errorMsg,
        });
      }
    }

    const hasErrors = results.some((r) => !r.success);
    return Response.json({
      success: !hasErrors,
      total: clips.length,
      extracted: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Batch extraction failed';
    console.error('Batch extract error:', error);
    return Response.json(
      {
        error: `Batch extraction failed: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
