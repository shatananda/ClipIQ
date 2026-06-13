import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PATHS } from './storage';
import { Paragraph } from '@/types';

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

export function extractClip(
  videoPath: string,
  startMs: number,
  endMs: number,
  clipId: number,
  headline: string,
  cropPosition: 'left' | 'center' | 'right' = 'center',
  transcript?: Paragraph[]
): string {
  try {
    const startSeconds = startMs / 1000;
    const durationSeconds = (endMs - startMs) / 1000;

    const sanitizedHeadline = headline.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const filename = `clip_${clipId}_${sanitizedHeadline}.mp4`;
    const clipPath = path.join(PATHS.clips, filename);
    const srtPath = path.join(PATHS.clips, `clip_${clipId}.srt`);

    // Generate captions if transcript is provided
    if (transcript && transcript.length > 0) {
      generateSrtSubtitles(transcript, startMs, endMs, srtPath);
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
    if (transcript && transcript.length > 0 && fs.existsSync(srtPath)) {
      const escapedSrtPath = srtPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      videoFilter += `,subtitles='${escapedSrtPath}':force_style='FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'`;
    }

    // Extract and scale to 1080x1920 (9:16 vertical)
    const command = [
      'ffmpeg',
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
    ].map(arg => (arg.includes(' ') || arg.includes("'") ? `"${arg}"` : arg)).join(' ');

    console.log('Extracting clip:', { clipId, headline, cropPosition, hasTranscript: !!transcript });
    execSync(command, { stdio: 'ignore' });
    console.log('Clip extracted:', clipPath);

    // Clean up SRT file after encoding
    if (fs.existsSync(srtPath)) {
      fs.unlinkSync(srtPath);
    }

    return filename;
  } catch (error) {
    console.error('Clip extraction error:', error);
    throw error;
  }
}
