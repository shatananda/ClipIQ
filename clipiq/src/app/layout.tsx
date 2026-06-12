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
        <div className="container py-8">
          <div className="mb-12">
            <img src="/logo/pure-ishvari.png" alt="Pure Ishvari" className="h-12 mb-4" />
            <h1 className="text-3xl font-bold text-primary mb-2">ClipIQ</h1>
            <p className="text-gray-600">Find short-form video opportunities in your YouTube uploads</p>
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
