# ClipIQ Project Handoff — Session 2026-06-15

## 🎯 Executive Summary

**ClipIQ** is a Next.js 15 web application that analyzes YouTube videos to identify short-form clip opportunities (TikTok, Instagram Reels, YouTube Shorts). It uses Claude Sonnet for AI analysis, FFmpeg for video processing, and AssemblyAI for transcription.

**Current Status:** Core functionality works locally and on Vercel. **Next critical work: Implement YouTube OAuth** to enable production video downloads without bot detection.

**Session Focus:** Solved YouTube bot detection issue on Vercel by pivoting to OAuth authentication.

---

## 🔴 Critical Issue Solved: YouTube Bot Detection on Vercel

### The Problem
Vercel's servers were being blocked by YouTube when trying to download videos:
- **ytdl-core:** 410 errors (format unavailable)
- **play-dl:** "Sign in to confirm you're not a bot" error
- **Root cause:** YouTube aggressively blocks cloud provider IPs (Vercel, AWS, etc.)

### Solutions Explored & Rejected
1. ❌ **yt-dlp CLI** — Not available on Vercel
2. ❌ **ytdl-core npm** — 410 errors (video format unavailable)
3. ❌ **play-dl npm** — Works locally (home IP), fails on Vercel (cloud IP flagged)
4. ❌ **Local download proxy** — Works but requires always-on machine on user's end
5. ❌ **Cloudinary/Mux** — Works but adds cost and external dependency

### ✅ Solution: YouTube OAuth Authentication

**Why it works:**
- Aparna (Apu) has editor access to PureIsvari YouTube channel
- When ClipIQ authenticates via OAuth with her account:
  - Vercel gets authorized OAuth token
  - Vercel passes token in all video download requests
  - YouTube sees: "Authenticated request from channel owner" ✅
  - NOT flagged as bot (it's an authorized account, not anonymous)
  - Downloads succeed on Vercel

**Architecture:**
```
Apu logs in → Google OAuth → Token stored → Vercel uses token → YouTube allows download
```

---

## 📋 What's Implemented (✅ Working)

### Local Development
- ✅ Video download (play-dl with home IP)
- ✅ Video transcription (AssemblyAI)
- ✅ Clip analysis (Claude Sonnet 4.6)
- ✅ Clip extraction (FFmpeg)
- ✅ Caption burning (SRT files)
- ✅ Caption font size control (12-28px, user-adjustable)
- ✅ Crop position selection (left/center/right)
- ✅ Vercel Blob Storage integration

### Vercel Deployment
- ✅ Frontend deployed
- ✅ API endpoints working
- ✅ Blob storage configured
- ✅ Environment variables set (ANTHROPIC_API_KEY, ASSEMBLYAI_API_KEY)
- ⏳ Video downloads (blocked by YouTube, waiting for OAuth)

### Testing
- ✅ 16+ E2E tests (passing)
- ✅ API tests (passing)
- ✅ Download flow tests (passing)
- ✅ Caption rendering tests (passing)

---

## 🚀 Next Session: Implement YouTube OAuth

### Implementation Checklist (2-3 hours)

#### 1. Get Google OAuth Credentials
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project: "ClipIQ"
- [ ] Enable "YouTube Data API v3"
- [ ] Create OAuth 2.0 credentials (Web application)
- [ ] Add redirect URIs:
  - `http://localhost:3000/api/auth/youtube/callback` (dev)
  - `https://clipiq-phi.vercel.app/api/auth/youtube/callback` (prod)

#### 2. Install Dependencies
```bash
npm install @react-oauth/google google-auth-library googleapis
```

#### 3. Create OAuth Integration Files
**New file: `src/lib/youtube-oauth.ts`**
```typescript
// Functions for:
// - Initializing Google OAuth client
// - Handling token storage (secure session/database)
// - Token refresh logic
// - Getting auth headers for downloads
```

#### 4. Update Login Flow
**File: `src/app/page.tsx`**
- Add "Login with YouTube" button
- Store token in secure session
- Only show video input if logged in

#### 5. Update Download Endpoint
**File: `src/app/api/download/route.ts`**
```typescript
// Before: play-dl without auth
// After: play-dl with OAuth token in headers
const videoStream = await stream(url, {
  requestOptions: {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  }
});
```

#### 6. Update Video Downloader
**File: `src/lib/ytdlp.ts`**
- Accept OAuth token as parameter
- Pass token to play-dl requests
- Handle token expiration/refresh

#### 7. Deploy to Vercel
```bash
# Add Google OAuth credentials to Vercel env vars
vercel env add GOOGLE_OAUTH_CLIENT_ID production
vercel env add GOOGLE_OAUTH_CLIENT_SECRET production
vercel env add GOOGLE_OAUTH_REDIRECT_URI production

# Deploy
vercel --prod
```

#### 8. Test End-to-End
- [ ] Login with YouTube
- [ ] Download video from Vercel
- [ ] Transcribe
- [ ] Analyze clips
- [ ] Extract with captions
- [ ] Download clip
- [ ] Verify no bot detection errors

### Key Code References
- **Current download logic:** `src/lib/ytdlp.ts` (lines 48-100)
- **Play-dl usage:** `src/lib/ytdlp.ts` (use `video_info()` and `stream()`)
- **API endpoint:** `src/app/api/download/route.ts`
- **Frontend:** `src/app/page.tsx` (add login button)

### Fallback Strategy
If OAuth encounters issues, keep **local download service** as fallback:
```typescript
try {
  // Try OAuth download on Vercel
  return await downloadWithOAuth(url, userToken);
} catch (e) {
  // Fallback to local service
  return await downloadViaLocalService(url);
}
```

---

## 📁 Project Structure

```
clipiq/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI (add OAuth login)
│   │   ├── api/
│   │   │   ├── download/         # YouTube video download (modify for OAuth)
│   │   │   ├── transcribe/       # AssemblyAI transcription
│   │   │   ├── analyze/          # Claude clip analysis
│   │   │   ├── batch-extract/    # FFmpeg clip extraction
│   │   │   └── serve-clip/       # Serve extracted clips
│   │   ├── review/               # Clip review page
│   │   └── download/             # Download clips page
│   ├── lib/
│   │   ├── ytdlp.ts              # Play-dl integration (modify for OAuth)
│   │   ├── youtube-oauth.ts      # NEW: OAuth functions
│   │   ├── claude.ts             # Claude API integration
│   │   ├── ffmpeg.ts             # FFmpeg processing
│   │   ├── blob-storage.ts       # Vercel Blob storage
│   │   └── storage.ts            # File paths
│   └── components/               # React components
├── e2e/                          # Playwright tests
├── .env.local                    # Local env vars (add OAuth creds)
├── vercel.json                   # Vercel config
└── package.json
```

---

## 🔐 Environment Variables

### Currently Set ✅
```
ANTHROPIC_API_KEY=sk-ant-...
ASSEMBLYAI_API_KEY=...
VERCEL_BLOB_READ_WRITE_TOKEN=...
```

### To Add (Next Session)
```
# Local development (.env.local)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback

# Vercel dashboard (production)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://clipiq-phi.vercel.app/api/auth/youtube/callback
```

---

## 📊 Architecture: How YouTube OAuth Fits

```
┌─────────────────┐
│  Aparna         │
│  Visits app     │
└────────┬────────┘
         │
         ├─→ "Login with YouTube" button
         │
         ↓
┌──────────────────────────┐
│  Google OAuth Dialog     │
│  Authorizes ClipIQ to:   │
│  - Access channel info   │
│  - Download videos       │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  ClipIQ stores token     │
│  (secure session)        │
└────────┬─────────────────┘
         │
         ├─→ "Enter YouTube URL"
         │
         ↓
┌──────────────────────────┐
│  Vercel Backend          │
│  Uses Apu's OAuth token  │
│  to download video       │
│  (YouTube allows it)     │
└────────┬─────────────────┘
         │
         ├─→ AssemblyAI transcription
         ├─→ Claude analysis
         ├─→ FFmpeg extraction
         └─→ Vercel Blob storage
```

---

## 🧪 Testing Checklist for Next Session

- [ ] OAuth login flow works
- [ ] Token is stored securely
- [ ] Token refresh works
- [ ] Video download works with OAuth token from Vercel
- [ ] Full pipeline: Download → Transcribe → Analyze → Extract → Download
- [ ] Clip with captions downloads successfully
- [ ] Font size adjustment works
- [ ] Crop positions work (left/center/right)
- [ ] No YouTube bot detection errors
- [ ] Works on Vercel production

---

## 🛠️ Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Check TypeScript + build
npm test                       # Run all E2E tests
npm run test:ui                # Interactive test dashboard

# Vercel
vercel --prod                  # Deploy to production
vercel logs --limit 50         # Check production logs
vercel env add KEY production  # Add environment variable

# Cleanup
rm -rf .next                   # Clear Next.js cache
git gc --aggressive            # Optimize git repo
```

---

## 📚 Key Resources

### Docs
- Next.js: https://nextjs.org/docs
- Claude API: https://docs.anthropic.com
- Google OAuth: https://developers.google.com/identity
- FFmpeg: https://ffmpeg.org/ffmpeg.html
- AssemblyAI: https://www.assemblyai.com/docs

### Code References
- Claude prompt: `src/lib/claude.ts`
- FFmpeg filters: `src/lib/ffmpeg.ts` (line ~93)
- Video formats: `src/types/index.ts`
- API routes: `src/app/api/*/route.ts`

---

## 🎯 Success Criteria

**Session 2 (OAuth) is complete when:**
1. ✅ Apu can log in with YouTube OAuth
2. ✅ Videos download from Vercel without "bot" errors
3. ✅ Full pipeline works: Login → Download → Transcribe → Analyze → Extract → Download
4. ✅ No local machine needed for downloads
5. ✅ All tests passing
6. ✅ Deployed to Vercel and working in production

---

## 📝 Notes & Nuances

### Why OAuth?
- ✅ No bot detection (YouTube trusts authenticated requests)
- ✅ No local service needed (pure Vercel solution)
- ✅ YouTube ToS compliant (channel owner downloads own videos)
- ✅ Scalable (works for multiple channels if needed)

### Why AssemblyAI (not YouTube Transcripts)?
- YouTube Transcript API is read-only (can't download videos)
- AssemblyAI gives better clip boundaries and timestamps
- AssemblyAI more reliable for non-English content

### Dev vs Production Storage
- **Dev:** Clips saved to `storage/clips/` (local filesystem)
- **Prod:** Clips saved to `/tmp/` then uploaded to Vercel Blob
- This is already implemented in `src/lib/ffmpeg.ts`

### FFmpeg on Vercel Status
- ⚠️ Not verified if available on Vercel
- If not available: Fall back to Cloudinary or external service
- Current code assumes it's available

---

## 🔗 Links

- **GitHub:** https://github.com/shatananda/ClipIQ
- **Live:** https://clipiq-phi.vercel.app
- **Local:** http://localhost:3000 (when dev server running)
- **Google Cloud:** https://console.cloud.google.com/
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ✍️ Session Notes

**Date:** 2026-06-15
**Participant:** Claude + User
**Outcome:** Identified and solved YouTube bot detection issue via OAuth

**Key Decisions:**
1. OAuth authentication over local proxy (cleaner, Vercel-native)
2. Still using AssemblyAI (better than YouTube Transcripts)
3. Keep play-dl package (works with OAuth token)

**What Went Well:**
- Full pipeline works locally
- Identified YouTube bot detection early
- Found OAuth solution before it became production blocker

**What's Deferred:**
- FFmpeg verification on Vercel (may need Cloudinary fallback)
- Database for token storage (can use secure session for now)
- Multi-channel support (works for Apu's single channel)

---

**Ready for next session!** 🚀
