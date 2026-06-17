'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();
        if (data.isLoggedIn) {
          router.push('/videos');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = () => {
    window.location.href = '/api/auth/youtube';
  };

  return (
    <main
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          ClipIQ
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            color: 'var(--text-secondary)',
            maxWidth: '400px',
          }}
        >
          Find and create short-form clips from your YouTube videos for TikTok, Instagram Reels, and YouTube Shorts.
        </p>
        <div
          style={{
            backgroundColor: 'var(--bg-light)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '400px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            textAlign: 'left',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: 500, color: 'var(--text)' }}>
            How it works:
          </p>
          <ol style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Login with your YouTube account</li>
            <li>Select a video to analyze</li>
            <li>Configure clip settings (captions, crop, font size)</li>
            <li>Our AI finds the best clip moments</li>
            <li>Adjust timing and download ready-to-post clips</li>
          </ol>
        </div>

        <button
          onClick={handleLogin}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 600,
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary-dark)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
          }}
        >
          Login with YouTube
        </button>
      </div>
    </main>
  );
}
