# ClipIQ Handoff Guide

This document provides everything you need to take over ClipIQ development, operations, and deployment.

## Quick Orientation (First Day)

### 1. Understand the Project (30 min)
- Read [README.md](README.md) - Project overview
- Read [FEATURES.md](FEATURES.md) - What it does
- Read [ARCHITECTURE.md](ARCHITECTURE.md) - How it works

### 2. Set Up Local Environment (30 min)
```bash
# Clone repo
git clone https://github.com/shatananda/ClipIQ.git
cd ClipIQ

# Install dependencies
npm install

# Get API keys
# - Anthropic Claude: https://console.anthropic.com
# - AssemblyAI: https://www.assemblyai.com/dashboard

# Create .env.local
echo "ANTHROPIC_API_KEY=sk-..." > .env.local
echo "ASSEMBLYAI_API_KEY=..." >> .env.local

# Start dev server
npm run dev

# Visit http://localhost:3000
```

### 3. Run the Pipeline (30 min)
1. Open http://localhost:3000
2. Paste test URL: https://youtu.be/xdFdQNq7vAw
3. Click Analyze
4. Watch it complete (should take ~40 seconds)
5. Review suggested clips
6. Accept a clip and download it

### 4. Run Tests (15 min)
```bash
npm test                    # All 11 tests
npm test -- e2e/basic.spec.ts  # Just basics
```

## Project Context

### Why This Project Exists
ClipIQ automates finding short-form video clips in long YouTube videos using AI. Instead of manually watching and cutting clips, users get AI-suggested moments optimized for TikTok, Instagram, and YouTube Shorts.

### Key Design Decisions
1. **Next.js 15** - Server-side rendering, API routes, modern React
2. **Claude Sonnet 4.6** - Best balance of speed/accuracy for clip analysis
3. **AssemblyAI** - Fast, accurate transcription with timestamps
4. **yt-dlp** - Most reliable YouTube downloader
5. **FFmpeg** - Industry-standard video processing
6. **Inline Styles + CSS Variables** - No build tool complexity, easy customization
7. **sessionStorage** - Lightweight state management, no backend needed

### Critical Files to Know
```
src/lib/claude.ts          # How clips are suggested (AI prompt)
src/lib/assemblyai.ts      # How audio becomes words with timestamps
src/lib/ffmpeg.ts          # How vertical clips are extracted
src/app/page.tsx           # Main analysis flow
src/components/ClipCard.tsx # How clips are displayed
```

## Daily Operations

### Serving Locally
```bash
npm run dev
# Runs on http://localhost:3000
# Auto-reloads on code changes
# Dev logs in console
```

### Running Tests
```bash
npm test                       # All tests
npm test -- e2e/basic.spec.ts  # Quick validation
npm run test:ui                # Interactive dashboard
npm run test:debug             # Debug mode with inspector
```

### Building for Production
```bash
npm run build              # TypeScript check + Next.js build
npm run start              # Start production server
```

### Checking Logs
```bash
# Dev server logs
tail -f /tmp/dev.log

# Test results
# -> playwright-report/index.html (open in browser)
```

## Common Tasks

### Adding a Feature

**Example: Support for Twitch streams**

1. Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand data flow
2. Create new download lib: `src/lib/twitch.ts` (similar to `ytdlp.ts`)
3. Update download route: `src/app/api/download/route.ts`
4. Add tests in `e2e/pipeline.spec.ts`
5. Update README with new platform
6. Commit: `git commit -am "Add Twitch stream support"`
7. Push and create PR

### Customizing AI Behavior

**Example: Generate different clip types**

1. Edit `src/lib/claude.ts` (the prompt)
2. Change clip type classifications
3. Run: `npm test -- e2e/pipeline.spec.ts`
4. Verify output format matches `ClipSuggestion` type
5. Commit and push

### Changing Video Format

**Example: 9:16 → 16:9 format**

1. Edit `src/lib/ffmpeg.ts` - FFmpeg filter string
2. Update the scale/crop filter
3. Create test video to verify
4. Update [FEATURES.md](FEATURES.md) with new specs
5. Commit and push

### Adding Keywords

**Example: Add astrology keywords**

1. Edit `storage/keywords.json` (or programmatically)
2. Or use UI: Add keywords manually in app
3. Keywords automatically used in next analysis
4. No code changes needed

## Deployment

### To Vercel (Production)
```bash
# First time setup
# 1. Create Vercel account
# 2. Connect GitHub repo
# 3. Add environment variables in Vercel dashboard
# 4. Deploy

# Subsequent deployments
git push origin main
# Vercel auto-deploys on push
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### To AWS, GCP, etc.
```bash
# Build
npm run build

# Start
npm run start

# Set environment variables in deployment platform
ANTHROPIC_API_KEY=...
ASSEMBLYAI_API_KEY=...
```

## Troubleshooting

### "Failed to fetch" Error
Check dev server logs:
```bash
tail -50 /tmp/dev.log | grep -i error
```

Most common causes:
1. Missing API keys in `.env.local`
2. yt-dlp not installed: `brew install yt-dlp`
3. ffmpeg not installed: `brew install ffmpeg`
4. API rate limits (wait a bit or upgrade API plan)

### Tests Timing Out
The full pipeline takes ~40 seconds. If tests timeout:
1. Check internet speed (downloads video from YouTube)
2. Check API key quotas
3. Increase timeout in `playwright.config.ts`

### Video Download Fails
```bash
# Check yt-dlp works
yt-dlp "https://youtu.be/VIDEO_ID"

# Update yt-dlp
brew upgrade yt-dlp
```

### Transcription is Slow/Failing
```bash
# Check AssemblyAI status
# Visit: https://www.assemblyai.com/dashboard

# Common issues:
# - Audio too long (AssemblyAI has limits)
# - API quota exceeded
# - Audio quality too poor
```

### Clip Extraction Produces Bad Videos
```bash
# Check FFmpeg
ffmpeg -version

# Common issues:
# - Source video quality too low
# - Unsupported codec
# - Disk space full (check storage/)
```

## Code Quality Standards

### Before Committing
```bash
npm run build              # Must pass TypeScript check
npm test                   # Must pass all tests
git diff                   # Review all changes
```

### Commit Messages
```bash
# Format: <type>: <description>
git commit -m "feat: add Twitch support"
git commit -m "fix: handle missing keywords gracefully"
git commit -m "docs: update deployment guide"

# Types: feat, fix, docs, style, refactor, test, chore
```

### Code Style
- Use TypeScript types (no `any`)
- Use const/let (no `var`)
- Use template literals for strings
- Use async/await (no callbacks)
- Keep functions small and focused
- Add comments only for "why", not "what"

### Testing Standards
- All new features need tests
- Tests should cover happy path + error cases
- Use descriptive test names
- Keep tests fast (< 5 minutes total)

## Git Workflow

### Branch Strategy
```bash
# Feature branch
git checkout -b feature/add-twitch-support
# ... make changes ...
git commit -am "feat: add Twitch support"
git push origin feature/add-twitch-support
# Create PR on GitHub

# Bugfix branch
git checkout -b fix/handle-missing-keywords
# ... make changes ...
git push origin fix/handle-missing-keywords
# Create PR

# Main branch always deployable
```

### Merging to Main
```bash
# Local
git checkout main
git pull origin main
git merge feature/add-twitch-support
git push origin main

# OR use GitHub PR interface (recommended)
# 1. Create PR
# 2. Get review
# 3. Merge to main
# 4. Delete branch
```

## Documentation

### Update When You Change:
- **README.md** - Features, setup instructions, quick start
- **FEATURES.md** - New features, removed features, roadmap
- **ARCHITECTURE.md** - Data flow, system design changes
- **API.md** - New endpoints, endpoint changes
- **E2E_TESTING.md** - New tests, test procedures

### Example Change
```markdown
# Before
### API Endpoints
- POST /api/download

# After
### API Endpoints
- POST /api/download - Download YouTube videos
- POST /api/download/twitch - Download Twitch streams (NEW)
```

## Key Contacts & Resources

### APIs & Services
- **Claude API**: https://console.anthropic.com
  - Docs: https://docs.anthropic.com
  - Pricing: Per-token billing
  
- **AssemblyAI**: https://www.assemblyai.com
  - Docs: https://www.assemblyai.com/docs
  - Free tier: 600 minutes/month
  
- **yt-dlp**: https://github.com/yt-dlp/yt-dlp
  - Issues: GitHub issues
  - Updates: Frequent

### Deployment
- **Vercel**: https://vercel.com
  - Docs: https://vercel.com/docs
  - Dashboard: https://vercel.com/dashboard

- **GitHub**: https://github.com/shatananda/ClipIQ
  - Main branch is production-ready
  - PRs for all changes

## Monitoring in Production

### Health Checks
```bash
# Test API is responding
curl https://clipiq.vercel.app
curl https://clipiq.vercel.app/api/keywords

# Check logs
vercel logs
```

### Common Production Issues
- API key expired → Update in Vercel dashboard
- Rate limits hit → Wait or upgrade API plans
- Disk space full → Clean storage/ directory
- Memory issues → May need larger instance

## Handing Off to Next Person

When you eventually hand this off:
1. Update this file with any new information
2. Update [ARCHITECTURE.md](ARCHITECTURE.md) with any changes
3. Ensure tests are passing: `npm test`
4. Push all changes to main
5. Provide new person with:
   - Link to GitHub repo
   - API key credentials (securely)
   - Vercel access
   - This handoff document
   - A 30-minute pairing session to walkthrough

## Questions?

If something isn't clear:
1. Check [README.md](README.md) for overview
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for how it works
3. Check source code comments
4. Check git history: `git log --oneline -20`
5. Check git blame: `git blame src/lib/claude.ts`

Good luck! 🚀
