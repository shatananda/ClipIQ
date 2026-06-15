import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PATHS } from './storage';

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
      console.log('Video already downloaded:', absoluteVideoPath);
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

    console.log('Downloading video with yt-dlp:', { url, videoId, videoPath: absoluteVideoPath });

    // Get video info using yt-dlp -j (JSON output)
    const infoJson = execSync(`yt-dlp -j "${url}"`, { encoding: 'utf-8' });
    const info = JSON.parse(infoJson);
    const title = info.title || videoId;
    const durationSeconds = info.duration || 0;

    console.log('Video info retrieved:', { title, durationSeconds });

    // Download video using yt-dlp (handles all YouTube quirks automatically)
    const downloadCmd = `yt-dlp -f "best[height<=1080]" -o "${absoluteVideoPath}" "${url}"`;
    console.log('Running download command:', downloadCmd);

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

    console.log('Video downloaded successfully:', absoluteVideoPath);

    return {
      videoId,
      videoPath: absoluteVideoPath,
      title,
      durationSeconds,
    };
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
