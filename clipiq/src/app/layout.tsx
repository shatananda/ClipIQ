import type { Metadata } from 'next';
import './globals.css';

import LogoutButton from './LogoutButton';

export const metadata: Metadata = {
  title: 'ClipIQ - YouTube Clip Suggester',
  description: 'Auto-analyze YouTube videos to find short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', padding: '10px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '20px', flexWrap: 'nowrap' }}>
              {/* ClipIQ Section with Logo and Text - Clickable */}
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, textDecoration: 'none', cursor: 'pointer' }}>
                <img src="/clipiq-icon.jpg" alt="ClipIQ" style={{ height: '48px', width: 'auto', flexShrink: 0 }} />
                <div style={{ whiteSpace: 'nowrap' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', margin: 0, lineHeight: '1' }}>ClipIQ</h1>
                  <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '1px 0 0 0', lineHeight: '1' }}>Intelligent clipping</p>
                </div>
              </a>

              {/* For Text */}
              <span style={{ fontSize: '18px', fontWeight: '300', color: 'var(--text-light)', flexShrink: 0 }}>for</span>

              {/* Pure Ishvari Logo - Clickable */}
              <a href="https://www.youtube.com/@AparnaKhanolkar/videos" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none', cursor: 'pointer' }}>
                <img src="https://www.pureishvari.com/cdn/shop/files/logo_110x.png?v=1665464646" alt="Pure Ishvari" style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
              </a>
            </div>

            {/* Logout Button */}
            <LogoutButton />
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
