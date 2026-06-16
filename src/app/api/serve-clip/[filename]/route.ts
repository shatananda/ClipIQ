import fs from 'fs';
import path from 'path';
import { PATHS } from '@/lib/storage';
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;

    // If filename is a Blob URL, redirect to it
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': filename,
        },
      });
    }

    // Otherwise serve from local storage (development mode)
    const clipPath = path.join(PATHS.clips, filename);

    if (!fs.existsSync(clipPath)) {
      return new Response('Clip not found', { status: 404 });
    }

    const fileSize = fs.statSync(clipPath).size;
    const stream = fs.createReadStream(clipPath);

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileSize.toString(),
      },
    });
  } catch (error) {
    logger.error('Serve clip error:', error);
    return new Response('Server error', { status: 500 });
  }
}
