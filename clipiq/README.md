# ClipIQ - YouTube Clip Suggester

Automatically analyze YouTube videos to identify and extract short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts using AI-powered analysis.

## Overview

ClipIQ uses a pipeline of cutting-edge tools to:
1. **Download** YouTube videos with yt-dlp
2. **Transcribe** audio using AssemblyAI
3. **Analyze** transcripts with Claude API to identify clip opportunities
4. **Extract** clips as 1080x1920 vertical MP4 videos optimized for short-form platforms

## Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg (`brew install ffmpeg-full` on Mac - must support libass for captions)
- yt-dlp (`brew install yt-dlp` on Mac, or `apt-get install yt-dlp` on Linux)
- API Keys:
  - **Anthropic** (Claude API) - https://console.anthropic.com/
  - **AssemblyAI** - https://www.assemblyai.com/
  - **Google OAuth** (YouTube login) - https://console.cloud.google.com/

### Setup

```bash
# Install dependencies
npm install

# Create .env.local with your API keys
cat > .env.local << EOF
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
SESSION_SECRET=your-32-character-random-secret-key-here
ANTHROPIC_API_KEY=your_anthropic_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
NODE_ENV=development
EOF

# Start dev server
npm run dev
```

Visit http://localhost:3000

### Using ClipIQ

1. **Click "Login with YouTube"** → Authenticate with Google
2. **Select a video** from your YouTube channel
3. **Configure settings** (font size, crop, captions)
4. **Click "Start Analysis"** → Watch progress
5. **Review AI suggestions** → Adjust clip timing with Mark Start/End buttons
6. **Approve clips** and download ready-to-post MP4s

## Features

- ✅ YouTube video download and processing
- ✅ Automatic audio transcription with timestamps
- ✅ AI-powered clip suggestion (3-7+ clips per video)
- ✅ Keyword-based filtering and customization
- ✅ 1080x1920 vertical clip extraction
- ✅ Multi-platform optimization (TikTok, Instagram, YouTube)
- ✅ Confidence scoring for each clip
- ✅ Session-based state management
- ✅ E2E test coverage
- ✅ Production-ready deployment configuration

## Project Structure

```
src/
├── app/                    # Next.js 15 pages
│   ├── page.tsx           # Home - URL input & analysis
│   ├── review/page.tsx    # Review - clip selection
│   ├── summary/page.tsx   # Summary - download clips
│   ├── api/               # API routes for pipeline
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Design system
├── components/            # React components
│   ├── ClipCard.tsx       # Clip display & actions
│   ├── VideoInput.tsx     # YouTube URL input
│   ├── KeywordDrawer.tsx  # Keyword management
│   ├── ProcessingProgress.tsx # Pipeline status
│   └── Icons.tsx          # SVG icons
├── lib/                   # Utilities
│   ├── claude.ts          # Claude API wrapper
│   ├── assemblyai.ts      # AssemblyAI transcription
│   ├── ytdlp.ts           # YouTube download
│   ├── ffmpeg.ts          # Video processing
│   ├── keywords.ts        # Keyword management
│   └── storage.ts         # File system utilities
└── types/                 # TypeScript definitions
    └── index.ts           # Type definitions

storage/                   # Generated during runtime
├── videos/               # Downloaded videos
├── audio/                # Extracted audio
├── clips/                # Extracted clip videos
└── keywords.json         # Keyword cache
```

## Technology Stack

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: CSS variables, inline styles
- **AI**: Claude Sonnet 4.6 (clip analysis)
- **Audio**: AssemblyAI (transcription)
- **Video**: play-dl (download), FFmpeg (processing with libass caption support)
- **Storage**: Vercel Blob (production), Local filesystem (development)
- **Auth**: Google OAuth (YouTube authentication - in development)
- **Testing**: Playwright (E2E)
- **Hosting**: Vercel (recommended)

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-...      # Claude API key
ASSEMBLYAI_API_KEY=...        # AssemblyAI token
STORAGE_PATH=./storage        # Optional: custom storage directory
```

## API Endpoints

See [API.md](API.md) for detailed documentation.

- `POST /api/download` - Download YouTube video
- `POST /api/transcribe` - Extract & transcribe audio
- `POST /api/analyze` - Analyze transcript for clips
- `POST /api/extract` - Extract specific clip as MP4
- `GET/POST /api/keywords` - Manage keyword filters

## Deployment Status

### ✅ Local Development
Fully functional. Run `npm run dev` to start. Works on your home IP with full OAuth integration.

### ✅ Railway Production
Deployed and fully operational at https://clipiq-railway.onrender.com (or your Railway URL)
- Frontend: ✅ Working
- API endpoints: ✅ Working  
- Video downloads: ✅ Working with OAuth authentication
- Transcription & analysis: ✅ Working
- Clip extraction: ✅ Working
- Session management: ✅ Encrypted cookies with automatic token refresh

### ⚠️ Vercel (Legacy)
Previously deployed at https://clipiq-phi.vercel.app
- Still functional but Railway is preferred (no function timeout limits)
- OAuth working but uses Vercel Blob storage (extra cost)

### Deployment Requirements

#### Google OAuth Setup
1. Go to https://console.cloud.google.com/
2. Create/select project "ClipIQ"
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URIs:
   - `http://localhost:3000/api/auth/youtube/callback` (local)
   - `https://your-railway-url/api/auth/youtube/callback` (production)
6. Copy Client ID and Secret to .env.local

#### Environment Variables for Deployment
```bash
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud Console>
GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_OAUTH_REDIRECT_URI=https://your-railway-url/api/auth/youtube/callback
SESSION_SECRET=<32+ character random string>
ANTHROPIC_API_KEY=<from Anthropic>
ASSEMBLYAI_API_KEY=<from AssemblyAI>
NODE_ENV=production
```

#### Railway Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize and deploy
railway init
railway up
```

See [HANDOFF.md](HANDOFF.md) for complete deployment guide.

## Testing

```bash
npm test                    # Run all E2E tests
npm test -- e2e/basic.spec.ts  # Basic tests only
npm run test:ui            # Interactive test UI
npm run test:debug         # Debug mode
```

See [E2E_TESTING.md](E2E_TESTING.md) for detailed testing guide.

## Features & Capabilities

See [FEATURES.md](FEATURES.md) for complete feature list and roadmap.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design and data flow.

## Handoff Guide

See [HANDOFF.md](HANDOFF.md) if taking over this project.

## Performance

- Full pipeline: ~40 seconds per video
  - Download: ~10s
  - Transcribe: ~15s
  - Analyze: ~10s
  - Extract: ~5s per clip
- Supports videos up to 30 minutes
- Generates 3-7+ clip suggestions per video

## Limitations

- YouTube videos only (extend ytdlp.ts for other sources)
- English transcription only (change in assemblyai.ts)
- Requires external API keys
- Storage limited by disk space
- Video processing is CPU-intensive

## Support

For issues or questions:
1. Check [E2E_TESTING.md](E2E_TESTING.md) troubleshooting section
2. Review API response logs in browser console
3. Check dev server logs: `tail -f /tmp/dev.log`

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Claude API](https://www.anthropic.com/)
- [AssemblyAI](https://www.assemblyai.com/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/)
