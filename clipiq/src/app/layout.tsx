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
          <div className="container flex items-center justify-center" style={{ alignItems: 'center', gap: '16px' }}>
            {/* ClipIQ Logo */}
            <img src="/clipiq-icon.jpg" alt="ClipIQ" style={{ height: '52px', width: 'auto' }} />

            {/* For Text */}
            <span style={{ fontSize: '18px', fontWeight: '300', color: 'var(--text-light)', margin: '0 8px' }}>for</span>

            {/* Pure Ishvari Logo */}
            <img src="https://www.pureishvari.com/cdn/shop/files/logo_110x.png?v=1665464646" alt="Pure Ishvari" style={{ height: '40px', width: 'auto' }} />
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
