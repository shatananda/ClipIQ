import path from 'path';
import fs from 'fs';
import { Writable } from 'stream';
import ytdl from 'ytdl-core';
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
      const info = await ytdl.getInfo(url);
      return {
        videoId,
        videoPath: absoluteVideoPath,
        title: info.videoDetails.title,
        durationSeconds: parseInt(info.videoDetails.lengthSeconds),
      };
    }

    console.log('Downloading video:', { url, videoId, videoPath: absoluteVideoPath });

    // Get video info first
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const durationSeconds = parseInt(info.videoDetails.lengthSeconds);

    // Download best quality MP4
    const videoStream = ytdl(url, {
      quality: 'highest',
      filter: (format) => format.container === 'mp4',
    });

    // Write to file
    const writeStream = fs.createWriteStream(absoluteVideoPath);

    return new Promise((resolve, reject) => {
      videoStream.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log('Video downloaded successfully:', absoluteVideoPath);
        resolve({
          videoId,
          videoPath: absoluteVideoPath,
          title,
          durationSeconds,
        });
      });

      writeStream.on('error', (err) => {
        console.error('Write error:', err);
        reject(err);
      });

      videoStream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
