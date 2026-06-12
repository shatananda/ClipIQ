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
        <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', padding: '16px 0' }}>
          <div className="container flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>ClipIQ</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>Find short-form clip opportunities</p>
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
