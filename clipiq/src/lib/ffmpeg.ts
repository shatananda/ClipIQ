import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PATHS } from './storage';
import { Paragraph } from '@/types';
import { uploadFile, getBlobKey } from './blob-storage';

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

function generateSrtSubtitles(transcript: Paragraph[], startMs: number, endMs: number, srtPath: string): void {
  const clipTranscript = transcript.filter(p => p.end > startMs && p.start < endMs);

  if (clipTranscript.length === 0) {
    fs.writeFileSync(srtPath, '');
    return;
  }

  const srtContent = clipTranscript
    .map((p, idx) => {
      const adjustedStart = Math.max(0, p.start - startMs);
      const adjustedEnd = Math.min(endMs - startMs, p.end - startMs);

      const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
      };

      return `${idx + 1}\n${formatTime(adjustedStart)} --> ${formatTime(adjustedEnd)}\n${p.text}\n`;
    })
    .join('\n');

  fs.writeFileSync(srtPath, srtContent);
}

export async function extractClip(
  videoPath: string,
  startMs: number,
  endMs: number,
  clipId: number,
  headline: string,
  cropPosition: 'left' | 'center' | 'right' = 'center',
  transcript?: Paragraph[],
  burnCaptions: boolean = true,
  captionFontSize: number = 18
): Promise<string> {
  try {
    const startSeconds = startMs / 1000;
    const durationSeconds = (endMs - startMs) / 1000;

    const sanitizedHeadline = headline.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const filename = `clip_${clipId}_${sanitizedHeadline}.mp4`;

    // In development: store clips in storage/clips
    // In production: store in /tmp and upload to Blob
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const clipsDir = isProduction
      ? path.join(os.tmpdir(), 'clipiq-tmp')
      : path.resolve(PATHS.clips);

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    // SRT file goes to temp directory
    const tmpDir = path.join(os.tmpdir(), 'clipiq-tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const clipPath = path.resolve(path.join(clipsDir, filename));
    const srtPath = path.resolve(path.join(tmpDir, `clip_${clipId}.srt`));

    // Generate captions if transcript is provided and burning is enabled
    let hasCaptions = false;
    if (transcript && transcript.length > 0 && burnCaptions) {
      try {
        generateSrtSubtitles(transcript, startMs, endMs, srtPath);
        hasCaptions = fs.existsSync(srtPath) && fs.statSync(srtPath).size > 0;
        console.log('SRT file created and captions will be burned:', { srtPath, size: fs.statSync(srtPath).size, hasCaptions });
      } catch (srtError) {
        console.warn('Failed to create SRT file:', srtError);
        hasCaptions = false;
      }
    } else if (transcript && transcript.length > 0 && !burnCaptions) {
      console.log('Transcript available but caption burning disabled by user');
    }

    // Calculate crop position: left=0, center=(iw-ow)/2, right=iw-ow
    let cropX = '(iw-ow)/2'; // center (default)
    if (cropPosition === 'left') {
      cropX = '0';
    } else if (cropPosition === 'right') {
      cropX = 'iw-ow';
    }

    // Build video filter with captions if available
    let videoFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:${cropX}:(oh-ih)/2`;
    if (hasCaptions) {
      // FFmpeg subtitles filter with libass support - burn captions into video
      videoFilter += `,subtitles=${srtPath}:force_style='FontSize=${captionFontSize},PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'`;
      console.log('Adding subtitles to filter:', { srtPath, captionFontSize });
    }

    // Extract and scale to 1080x1920 (9:16 vertical)
    // Use spawnSync with array args to avoid shell escaping issues
    const args = [
      '-ss', startSeconds.toString(),
      '-i', videoPath,
      '-t', durationSeconds.toString(),
      '-vf', videoFilter,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-n', clipPath
    ];

    console.log('Extracting clip:', { clipId, headline, cropPosition, hasTranscript: !!transcript, burnCaptions, hasCaptions, videoFilterLength: videoFilter.length });
    console.log('FFmpeg args:', args);

    try {
      const result = spawnSync('ffmpeg', args, {
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8'
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        console.error('FFmpeg error:', result.stderr);
        throw new Error(`FFmpeg failed: ${result.stderr}`);
      }

      console.log('Clip extracted:', clipPath);
    } catch (execError: any) {
      console.error('FFmpeg error:', execError.message);
      console.error('FFmpeg stderr:', execError.stderr?.toString?.() || execError.message);
      throw execError;
    }

    // Clean up SRT file after encoding
    if (fs.existsSync(srtPath)) {
      fs.unlinkSync(srtPath);
      console.log('SRT file cleaned up');
    }

    // In production: upload to Blob storage
    if (isProduction) {
      try {
        const blobKey = getBlobKey('clip', `${clipId}_${sanitizedHeadline}`);
        const blobUrl = await uploadFile(clipPath, blobKey);
        console.log('Clip uploaded to Blob:', { blobKey, blobUrl });
        // Clean up temporary file after upload
        if (fs.existsSync(clipPath)) {
          fs.unlinkSync(clipPath);
        }
        return blobUrl;
      } catch (uploadError) {
        console.error('Failed to upload clip to Blob:', uploadError);
        // Fall back to local filename if upload fails
        return filename;
      }
    }

    // In development: return filename for local serving
    return filename;
  } catch (error) {
    console.error('Clip extraction error:', error);
    throw error;
  }
}
