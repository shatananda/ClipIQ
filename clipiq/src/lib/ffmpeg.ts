import { execSync } from 'child_process';
import path from 'path';
import { PATHS } from './storage';

export function extractAudio(videoPath: string, videoId: string): string {
  try {
    const audioPath = path.join(PATHS.audio, `${videoId}.m4a`);
    const command = `ffmpeg -i "${videoPath}" -q:a 9 -n "${audioPath}"`;
    execSync(command, { stdio: 'ignore' });
    console.log('Audio extracted:', audioPath);
    return audioPath;
  } catch (error) {
    console.error('Audio extraction error:', error);
    throw error;
  }
}

export function extractClip(
  videoPath: string,
  startMs: number,
  endMs: number,
  clipId: number,
  headline: string,
  cropPosition: 'left' | 'center' | 'right' = 'center'
): string {
  try {
    const startSeconds = startMs / 1000;
    const durationSeconds = (endMs - startMs) / 1000;

    const sanitizedHeadline = headline.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const filename = `clip_${clipId}_${sanitizedHeadline}.mp4`;
    const clipPath = path.join(PATHS.clips, filename);

    // Calculate crop position: left=0, center=(ow-iw)/2, right=ow-iw
    let cropX = '(ow-iw)/2'; // center (default)
    if (cropPosition === 'left') {
      cropX = '0';
    } else if (cropPosition === 'right') {
      cropX = 'ow-iw';
    }

    // Extract and scale to 1080x1920 (9:16 vertical)
    const command = `ffmpeg -ss ${startSeconds} -i "${videoPath}" -t ${durationSeconds} \
      -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:${cropX}:(oh-ih)/2" \
      -c:v libx264 -preset fast -crf 23 \
      -c:a aac -b:a 128k -movflags +faststart \
      -n "${clipPath}"`;

    execSync(command, { stdio: 'ignore' });
    console.log('Clip extracted:', clipPath);

    return filename;
  } catch (error) {
    console.error('Clip extraction error:', error);
    throw error;
  }
}
