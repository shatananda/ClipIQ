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
- yt-dlp (`brew install yt-dlp`)
- ffmpeg (`brew install ffmpeg`)
- API Keys:
  - Anthropic (Claude API)
  - AssemblyAI

### Setup

```bash
# Install dependencies
npm install

# Create .env.local with your API keys
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local
echo "ASSEMBLYAI_API_KEY=your_key_here" >> .env.local

# Start dev server
npm run dev
```

Visit http://localhost:3000

### Using ClipIQ

1. Paste a YouTube URL
2. Click "Analyze"
3. Wait for pipeline to complete (~40 seconds)
4. Review generated clips
5. Accept clips you want to extract
6. Download as MP4 files

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
- **Video**: yt-dlp (download), FFmpeg (processing)
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

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Connect repo to Vercel
# Set environment variables in Vercel dashboard
# Deploy automatically on push
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Local Production

```bash
npm run build
npm run start
```

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
