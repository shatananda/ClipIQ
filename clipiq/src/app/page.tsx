'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
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
