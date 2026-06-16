import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PATHS } from './storage';
import { logger } from './logger';

export interface VideoInfo {
  videoId: string;
  videoPath: string;
  title: string;
  durationSeconds: number;
}

export async function downloadVideo(url: string): Promise<VideoInfo> {
  try {
    // Validate YouTube URL
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname.includes('youtube.com')) {
      videoId = new URLSearchParams(urlObj.search).get('v') || '';
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1).split('?')[0];
    }

    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Ensure videos directory exists
    if (!fs.existsSync(PATHS.videos)) {
      fs.mkdirSync(PATHS.videos, { recursive: true });
    }

    const videoPath = path.join(PATHS.videos, `${videoId}.mp4`);
    const absoluteVideoPath = path.resolve(videoPath);

    // Check if already downloaded
    if (fs.existsSync(absoluteVideoPath)) {
      logger.info('✓ Video already downloaded:', absoluteVideoPath);
      // Get info using yt-dlp
      const infoJson = execSync(`yt-dlp -j "${url}"`, { encoding: 'utf-8' });
      const info = JSON.parse(infoJson);
      return {
        videoId,
        videoPath: absoluteVideoPath,
        title: info.title || videoId,
        durationSeconds: info.duration || 0,
      };
    }

    logger.info('📥 Downloading video with yt-dlp:', { url, videoId });

    // Get video info using yt-dlp -j (JSON output)
    const infoJson = execSync(`yt-dlp -j "${url}"`, { encoding: 'utf-8' });
    const info = JSON.parse(infoJson);
    const title = info.title || videoId;
    const durationSeconds = info.duration || 0;

    logger.debug('Video info retrieved:', { title, durationSeconds });

    // Download video using yt-dlp (handles all YouTube quirks automatically)
    const downloadCmd = `yt-dlp -f "best[height<=1080]" -o "${absoluteVideoPath}" "${url}"`;
    logger.debug('Running download command:', downloadCmd);

    const result = spawnSync('sh', ['-c', downloadCmd], {
      stdio: 'pipe',
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.status !== 0) {
      throw new Error(`yt-dlp failed: ${result.stderr || result.stdout}`);
    }

    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`Video file was not created at ${absoluteVideoPath}`);
    }

    logger.info('✓ Video downloaded successfully:', absoluteVideoPath);

    return {
      videoId,
      videoPath: absoluteVideoPath,
      title,
      durationSeconds,
    };
  } catch (error) {
    logger.error('Download error:', error);
    throw error;
  }
}
