import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PATHS } from './storage';

export interface VideoInfo {
  videoId: string;
  videoPath: string;
  title: string;
  durationSeconds: number;
}

export function downloadVideo(url: string): VideoInfo {
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

    const videoPath = path.join(PATHS.videos, `${videoId}.mp4`);
    const absoluteVideoPath = path.resolve(videoPath);

    // Download using yt-dlp
    const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${absoluteVideoPath}" "${url}"`;
    const output = execSync(command, { encoding: 'utf-8' });
    console.log('Video downloaded:', output);

    // Get video info
    const infoCommand = `yt-dlp --dump-json "${url}"`;
    const infoJson = execSync(infoCommand, { encoding: 'utf-8' });
    const info = JSON.parse(infoJson);

    return {
      videoId,
      videoPath: absoluteVideoPath,
      title: info.title || videoId,
      durationSeconds: info.duration || 0,
    };
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
