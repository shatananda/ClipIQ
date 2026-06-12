import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipIQ - YouTube Clip Suggester',
  description: 'Auto-analyze YouTube videos to find short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container py-3 flex items-center gap-3">
            <img src="/logo/pure-ishvari.png" alt="Pure Ishvari" className="h-8" />
            <h1 className="text-xl font-bold text-gray-900">ClipIQ</h1>
          </div>
        </header>

        <main className="container py-8">
          {children}
        </main>

        <footer className="text-center text-gray-500 text-xs py-6 mt-12">
          <p>ClipIQ © 2026</p>
        </footer>
      </body>
    </html>
  );
}
