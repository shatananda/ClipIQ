import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipIQ - YouTube Clip Suggester',
  description: 'Auto-analyze YouTube videos to find short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#fcf8ec' }}>
        <header className="border-b" style={{ borderColor: '#e8e0d0', backgroundColor: '#fcf8ec' }}>
          <div className="container py-6 flex items-center gap-4">
            <img src="/logo/pure-ishvari.png" alt="Pure Ishvari" className="h-10" />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>ClipIQ</h1>
              <p className="text-sm" style={{ color: '#666' }}>Find short-form clip opportunities</p>
            </div>
          </div>
        </header>

        <main className="container py-12">
          {children}
        </main>

        <footer className="text-center py-8 mt-12">
          <p className="text-sm" style={{ color: '#999' }}>© 2026 ClipIQ by Pure Ishvari</p>
        </footer>
      </body>
    </html>
  );
}
