import fs from 'fs';
import path from 'path';
import { PATHS } from '@/lib/storage';

export async function GET(req: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params;
    const videoPath = path.join(PATHS.videos, `${videoId}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return new Response('Video not found', { status: 404 });
    }

    const fileSize = fs.statSync(videoPath).size;
    const stream = fs.createReadStream(videoPath);

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Serve video error:', error);
    return new Response('Server error', { status: 500 });
  }
}
