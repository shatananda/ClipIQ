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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo/pure-ishvari.png" alt="Pure Ishvari" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-primary">ClipIQ</h1>
                <p className="text-xs text-text-light">by Pure Ishvari</p>
              </div>
            </div>
            <nav className="hidden sm:flex gap-6">
              <a href="/" className="text-sm font-medium text-dark hover:text-primary">Home</a>
              <a href="#" className="text-sm font-medium text-text-light hover:text-primary">Docs</a>
            </nav>
          </div>
        </header>

        <div className="container">
          {children}
        </div>

        <footer className="bg-gray-50 border-t border-gray-200 mt-20 py-8">
          <div className="container text-center text-text-light text-sm">
            <p>ClipIQ © 2026. Powered by Claude & AssemblyAI</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
