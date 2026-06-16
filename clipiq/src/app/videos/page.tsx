'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { YouTubeVideo, VideoStatus } from '@/types';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailModal } from '@/components/VideoDetailModal';
import { Pagination } from '@/components/Pagination';

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [videoStatuses, setVideoStatuses] = useState<Record<string, VideoStatus>>({});

  useEffect(() => {
    checkAuthAndFetchVideos();
  }, []);

  const checkAuthAndFetchVideos = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json();

      if (!sessionData.isLoggedIn) {
        router.push('/');
        return;
      }

      const cached = sessionStorage.getItem('clipiq_video_list');
      if (cached) {
        const { videos } = JSON.parse(cached);
        setVideos(videos);
        loadStatusBadges(videos);
        setLoading(false);
        return;
      }

      let allVideos: YouTubeVideo[] = [];
      let pageToken: string | null = null;

      do {
        const res: Response = await fetch(pageToken ? `/api/youtube/videos?pageToken=${pageToken}` : '/api/youtube/videos');

        if (!res.ok) {
          if (res.status === 401) {
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch videos');
        }

        const data = await res.json();
        allVideos = [...allVideos, ...data.videos];
        pageToken = data.nextPageToken;
      } while (pageToken);

      sessionStorage.setItem('clipiq_video_list', JSON.stringify({ videos: allVideos, fetchedAt: Date.now() }));
      setVideos(allVideos);
      loadStatusBadges(allVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const loadStatusBadges = (videos: YouTubeVideo[]) => {
    const statuses: Record<string, VideoStatus> = {};
    videos.forEach((video) => {
      const status = localStorage.getItem(`clipiq_status_${video.videoId}`);
      statuses[video.videoId] = (status as VideoStatus) || 'none';
    });
    setVideoStatuses(statuses);
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    router.push(`/configure?videoId=${video.videoId}&title=${encodeURIComponent(video.title)}`);
  };

  const paginatedVideos = videos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', fontSize: '16px', color: 'var(--text-secondary)' }}>
          Loading your videos...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', fontSize: '16px', color: '#ef4444' }}>
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ margin: '0 0 32px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>
        Your Videos
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {paginatedVideos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            status={videoStatuses[video.videoId] || 'none'}
            onSelect={() => handleSelectVideo(video)}
            onShowDetail={() => setSelectedVideo(video)}
          />
        ))}
      </div>

      {videos.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: '16px', color: 'var(--text-secondary)', padding: '40px' }}>
          No videos found. Check your YouTube channel.
        </div>
      )}

      {videos.length > 0 && (
        <Pagination
          totalItems={videos.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={() => {
            handleSelectVideo(selectedVideo);
            setSelectedVideo(null);
          }}
        />
      )}
    </main>
  );
}
