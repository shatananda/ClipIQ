import { extractAudio } from '@/lib/ffmpeg';
import { transcribeAudio } from '@/lib/assemblyai';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { videoId, videoPath } = await req.json();

    if (!videoId || !videoPath) {
      return Response.json({ error: 'videoId and videoPath required' }, { status: 400 });
    }

    const audioPath = extractAudio(videoPath, videoId);
    const paragraphs = await transcribeAudio(audioPath);

    // Save transcript to temporary file on server
    const transcriptDir = path.join(process.cwd(), '.transcripts');
    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }

    const transcriptPath = path.join(transcriptDir, `${videoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(paragraphs));
    logger.info('Transcript saved:', transcriptPath);

    return Response.json({ success: true, paragraphs, transcriptId: videoId });
  } catch (error) {
    logger.error('Transcribe error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
