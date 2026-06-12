import { extractAudio } from '@/lib/ffmpeg';
import { transcribeAudio } from '@/lib/assemblyai';

export async function POST(req: Request) {
  try {
    const { videoId, videoPath } = await req.json();

    if (!videoId || !videoPath) {
      return Response.json({ error: 'videoId and videoPath required' }, { status: 400 });
    }

    const audioPath = extractAudio(videoPath, videoId);
    const paragraphs = await transcribeAudio(audioPath);

    return Response.json({ success: true, paragraphs });
  } catch (error) {
    console.error('Transcribe error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
