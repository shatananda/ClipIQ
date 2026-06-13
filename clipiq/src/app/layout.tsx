import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipIQ - YouTube Clip Suggester',
  description: 'Auto-analyze YouTube videos to find short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', padding: '12px 0' }}>
          <div className="container flex items-center justify-between" style={{ alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="/clipiq-icon.jpg" alt="ClipIQ" style={{ height: '48px', width: 'auto' }} />
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>ClipIQ</h1>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Intelligent video clipping</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          {children}
        </main>

        <footer style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-light)', fontSize: '13px', borderTop: '1px solid var(--border)' }}>
          <p>© 2026 ClipIQ</p>
        </footer>
      </body>
    </html>
  );
}
