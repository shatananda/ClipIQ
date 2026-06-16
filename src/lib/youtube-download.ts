import { getOAuthClient } from './youtube-oauth';
import { logger } from './logger';
import { google } from 'googleapis';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function downloadVideoWithOAuth(
  videoId: string,
  accessToken: string
): Promise<{ videoPath: string; title: string; durationSeconds: number }> {
  logger.info(`📥 Downloading YouTube video: ${videoId}`);

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube('v3');

    logger.debug(`Getting video metadata for ${videoId}`);
    const response = await youtube.videos.list({
      auth: oauth2Client,
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) throw new Error(`Video ${videoId} not found`);

    const title = video.snippet?.title || 'Unknown';
    const duration = video.contentDetails?.duration;
    const durationSeconds = duration ? parseDuration(duration) : 0;

    logger.info(`✓ Video metadata retrieved: "${title}" (${durationSeconds}s)`);

    // Create storage directory
    const storageDir = './storage/videos';
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const videoPath = path.join(storageDir, `${videoId}.mp4`);

    // Check if already downloaded
    if (fs.existsSync(videoPath)) {
      logger.info(`✓ Video already downloaded: ${videoPath}`);
      return { videoPath, title, durationSeconds };
    }

    // Use yt-dlp with OAuth cookie
    logger.debug(`Downloading video file to ${videoPath}`);
    const downloadCmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${videoPath}" "https://www.youtube.com/watch?v=${videoId}"`;
    logger.debug(`Executing: ${downloadCmd}`);

    execSync(downloadCmd, { stdio: 'pipe' });

    logger.info(`✓ Video downloaded successfully: ${videoPath}`);

    return {
      videoPath,
      title,
      durationSeconds,
    };
  } catch (error) {
    logger.error(`Failed to download video ${videoId}:`, error);
    throw error;
  }
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT1H23M45S)
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  let seconds = 0;
  if (match?.[1]) seconds += parseInt(match[1]) * 3600;
  if (match?.[2]) seconds += parseInt(match[2]) * 60;
  if (match?.[3]) seconds += parseInt(match[3]);
  return seconds;
}
