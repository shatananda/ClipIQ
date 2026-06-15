import { google } from 'googleapis';
import { getOAuthClient } from './youtube-oauth';
import { YouTubeVideo } from '@/types';

const youtube = google.youtube('v3');

export async function getChannelUploadsPlaylistId(accessToken: string): Promise<string> {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await youtube.channels.list({
    auth: oauth2Client,
    part: ['contentDetails'],
    mine: true,
  });

  const uploadPlaylistId = response.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadPlaylistId) {
    throw new Error('Could not find uploads playlist for authenticated user');
  }

  return uploadPlaylistId;
}

export async function listVideos(
  accessToken: string,
  playlistId: string,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken: string | null }> {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await youtube.playlistItems.list({
    auth: oauth2Client,
    part: ['snippet'],
    playlistId,
    maxResults: 50,
    pageToken,
  });

  const items = response.data.items || [];
  const videoIds = items
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  let videoDurations: Record<string, number> = {};
  if (videoIds.length > 0) {
    const videoResponse = await youtube.videos.list({
      auth: oauth2Client,
      part: ['contentDetails'],
      id: videoIds,
    });

    videoDurations = {};
    (videoResponse.data.items || []).forEach((video) => {
      const duration = video.contentDetails?.duration || 'PT0S';
      videoDurations[video.id!] = parseDuration(duration);
    });
  }

  const videos: YouTubeVideo[] = items.map((item) => {
    const snippet = item.snippet!;
    const videoId = snippet.resourceId?.videoId || '';
    const durationSeconds = videoDurations[videoId] || 0;
    const durationString = `PT${Math.floor(durationSeconds / 60)}M${durationSeconds % 60}S`;

    return {
      videoId,
      title: snippet.title || 'Untitled',
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      duration: durationString,
      durationSeconds,
      viewCount: 0,
      description: snippet.description || '',
    };
  });

  return {
    videos,
    nextPageToken: response.data.nextPageToken || null,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
