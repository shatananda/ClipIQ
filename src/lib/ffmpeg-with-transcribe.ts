import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { extractClip } from './ffmpeg';
import { extractAudio } from './ffmpeg';
import { transcribeAudio } from './assemblyai';
import { PATHS } from './storage';
import { Paragraph } from '@/types';

function generateSrtSubtitles(transcript: Paragraph[], srtPath: string): void {
  if (transcript.length === 0) {
    fs.writeFileSync(srtPath, '');
    return;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const srtContent = transcript
    .map((p, idx) => {
      return `${idx + 1}\n${formatTime(p.start)} --> ${formatTime(p.end)}\n${p.text}\n`;
    })
    .join('\n');

  fs.writeFileSync(srtPath, srtContent);
}

export async function extractClipWithReTranscription(
  videoPath: string,
  startMs: number,
  endMs: number,
  clipId: number,
  headline: string,
  cropPosition: 'left' | 'center' | 'right' = 'center',
  burnCaptions: boolean = true,
  captionFontSize: number = 18
): Promise<string> {
  try {
    const startSeconds = startMs / 1000;
    const durationSeconds = (endMs - startMs) / 1000;

    const sanitizedHeadline = headline.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const filename = `clip_${clipId}_${sanitizedHeadline}.mp4`;

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const clipsDir = isProduction
      ? path.join(os.tmpdir(), 'clipiq-tmp')
      : path.resolve(PATHS.clips);

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    const tmpDir = path.join(os.tmpdir(), 'clipiq-tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const clipPath = path.resolve(path.join(clipsDir, filename));
    const srtPath = path.resolve(path.join(tmpDir, `clip_${clipId}.srt`));
    const audioPath = path.resolve(path.join(tmpDir, `clip_${clipId}_audio.m4a`));

    // Step 1: Extract clip WITHOUT captions first
    console.log('Step 1: Extracting clip without captions...');
    let cropX = '(iw-ow)/2';
    if (cropPosition === 'left') {
      cropX = '0';
    } else if (cropPosition === 'right') {
      cropX = 'iw-ow';
    }

    const videoFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:${cropX}:(oh-ih)/2`;
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

    const result = spawnSync('ffmpeg', args, {
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8'
    });

    if (result.status !== 0) {
      throw new Error(`FFmpeg failed: ${result.stderr}`);
    }

    if (!fs.existsSync(clipPath)) {
      throw new Error(`Clip file was not created at ${clipPath}`);
    }

    console.log('Clip extracted:', clipPath);

    // If captions not needed, return early
    if (!burnCaptions) {
      console.log('Caption burning disabled, returning clip without captions');
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return filename;
    }

    // Step 2: Extract audio from the clip
    console.log('Step 2: Extracting audio from clip...');
    const audioCmd = `ffmpeg -i "${clipPath}" -q:a 9 -n "${audioPath}"`;
    const audioResult = spawnSync('sh', ['-c', audioCmd], {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    if (audioResult.status !== 0 || !fs.existsSync(audioPath)) {
      console.warn('Failed to extract audio, skipping caption burning');
      if (isProduction && fs.existsSync(clipPath)) {
        const { uploadFile, getBlobKey } = await import('./blob-storage');
        const blobKey = getBlobKey('clip', `${clipId}_${sanitizedHeadline}`);
        const blobUrl = await uploadFile(clipPath, blobKey);
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
        return blobUrl;
      }
      return filename;
    }

    // Step 3: Transcribe the audio
    console.log('Step 3: Transcribing audio...');
    const paragraphs = await transcribeAudio(audioPath);
    console.log(`Transcribed ${paragraphs.length} paragraphs`);

    // Step 4: Generate SRT from transcription
    console.log('Step 4: Generating SRT from transcription...');
    generateSrtSubtitles(paragraphs, srtPath);

    if (!fs.existsSync(srtPath) || fs.statSync(srtPath).size === 0) {
      console.warn('No captions to burn, returning clip without captions');
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (isProduction && fs.existsSync(clipPath)) {
        const { uploadFile, getBlobKey } = await import('./blob-storage');
        const blobKey = getBlobKey('clip', `${clipId}_${sanitizedHeadline}`);
        const blobUrl = await uploadFile(clipPath, blobKey);
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
        return blobUrl;
      }
      return filename;
    }

    // Step 5: Re-encode clip WITH captions
    console.log('Step 5: Re-encoding clip with captions...');
    const captionFilter = `subtitles=${srtPath}:force_style='FontSize=${captionFontSize},PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'`;
    const captionedVideoFilter = `${videoFilter},${captionFilter}`;

    const captionArgs = [
      '-i', clipPath,
      '-vf', captionedVideoFilter,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-n', clipPath + '.captioned.mp4'
    ];

    const captionResult = spawnSync('ffmpeg', captionArgs, {
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8'
    });

    if (captionResult.status !== 0) {
      console.warn('Failed to burn captions, returning clip without captions');
      if (isProduction && fs.existsSync(clipPath)) {
        const { uploadFile, getBlobKey } = await import('./blob-storage');
        const blobKey = getBlobKey('clip', `${clipId}_${sanitizedHeadline}`);
        const blobUrl = await uploadFile(clipPath, blobKey);
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
        return blobUrl;
      }
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
      return filename;
    }

    // Replace original with captioned version
    fs.renameSync(clipPath + '.captioned.mp4', clipPath);
    console.log('Clip with captions created:', clipPath);

    // Cleanup
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);

    // Upload if production
    if (isProduction) {
      try {
        const { uploadFile, getBlobKey } = await import('./blob-storage');
        const blobKey = getBlobKey('clip', `${clipId}_${sanitizedHeadline}`);
        const blobUrl = await uploadFile(clipPath, blobKey);
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
        return blobUrl;
      } catch (uploadError) {
        console.error('Failed to upload clip to Blob:', uploadError);
        return filename;
      }
    }

    return filename;
  } catch (error) {
    console.error('Clip extraction with re-transcription error:', error);
    throw error;
  }
}
