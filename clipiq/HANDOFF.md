# ClipIQ Project Handoff — Session 2026-06-16

## 🎯 Executive Summary

**ClipIQ** is a Next.js 15 web application that analyzes YouTube videos to identify short-form clip opportunities (TikTok, Instagram Reels, YouTube Shorts). It uses Claude Sonnet for AI analysis, FFmpeg for video processing, and AssemblyAI for transcription.

**Current Status:** ✅ **Fully functional locally and on Railway/Vercel**. OAuth authentication working, video analysis pipeline complete, clip capture UI functional.

**Session Focus:** Fixed critical OAuth/session issues, restored lost UI features (Mark Start/End buttons), implemented custom session management for Railway deployment.

---

## ✅ What's Working

### Authentication & Session Management
- ✅ **Google OAuth 2.0** - Complete implementation with token refresh
- ✅ **Custom encrypted session management** - AES-256 encrypted cookies for Next.js 15 compatibility
- ✅ **Token persistence** - Refresh tokens stored securely, automatic refresh on expiry
- ✅ **Session recovery** - Graceful error handling and re-authentication flow
- ✅ **Client-side auth checks** - Proper credential passing in all fetch calls

### Core Video Processing Pipeline
- ✅ **Video download** - yt-dlp CLI (Railway) + FFmpeg integration
- ✅ **Video transcription** - AssemblyAI integration with confidence scoring
- ✅ **AI clip analysis** - Claude Sonnet 4.6 with structured JSON output
- ✅ **Clip extraction** - FFmpeg video cutting with frame-accurate timing
- ✅ **Caption management** - Re-transcription for adjusted clips, SRT generation, caption burning with configurable font size

### UI/UX Features
- ✅ **Mark Start/End buttons** - Capture clip timing directly from video playback
- ✅ **Current time display** - Real-time playback position tracking
- ✅ **Fine-tune timing** - Adjustable sliders for start/end with millisecond precision
- ✅ **Jump buttons** - Quick seek to suggested clip times
- ✅ **Confidence ratings** - AI confidence scores for each clip suggestion
- ✅ **Platform recommendations** - Best platforms for each clip type
- ✅ **Crop positioning** - Left/center/right positioning for vertical video
- ✅ **Caption font size** - Default 14px, adjustable 12-28px range

### Deployment & Infrastructure
- ✅ **Railway deployment** - Full Docker containerization with system dependencies
- ✅ **Local filesystem storage** - Video/clip persistence with proper cleanup
- ✅ **Environment configuration** - .env.local with all required API keys
- ✅ **API error logging** - Detailed logging for debugging and monitoring

---

## 🔧 Recent Fixes (This Session)

### 1. OAuth Token Persistence
**Issue:** Users logged in but session wasn't persisting between pages
**Root Cause:** Google wasn't returning refresh token in OAuth response
**Fix:** Added `prompt: 'consent'` to OAuth URL to force consent screen and include refresh token

### 2. Custom Session Management
**Issue:** iron-session wasn't compatible with Next.js 15 app router
**Root Cause:** Library had timing issues with environment variable loading
**Fix:** Implemented custom AES-256 encrypted cookie-based session management
- Encrypts session data before storing in cookie
- Decrypts on retrieval with error handling
- No external session storage needed

### 3. Session Cookie Transmission
**Issue:** Client-side fetch calls weren't sending cookies to server
**Root Cause:** Missing `credentials: 'include'` option in fetch calls
**Fix:** Added to all auth session checks:
- Home page auth check
- Videos page auth check
- LogoutButton auth check
- All client-side API calls

### 4. Restored UI Features
**Issue:** Mark Start/End buttons for clip capture were missing
**Fix:** Re-implemented with YouTube IFrame API integration
- Captures current video playback position
- Real-time time display while watching
- Updates clip timing instantly

### 5. Configuration & Defaults
**Changes:**
- Default caption font size: 18px → 14px
- Claude max_tokens: 2048 → 4096 (better analysis)
- Added comprehensive logging to debug endpoints

---

## 🏗️ Architecture

### Authentication Flow
```
User Login
    ↓
Google OAuth (with prompt='consent')
    ↓
Exchange code for tokens
    ↓
Store in encrypted session cookie
    ↓
Redirect to /videos
    ↓
Client fetch with credentials: 'include'
    ↓
Session retrieved from cookie
    ↓
YouTube API calls with access token
```

### Video Processing Pipeline
```
User selects video
    ↓
Configure settings (font size, crop, captions)
    ↓
Download video (yt-dlp with OAuth token)
    ↓
Transcribe audio (AssemblyAI)
    ↓
Analyze with Claude (AI suggestions)
    ↓
User reviews clips, adjusts timing
    ↓
Extract clips with FFmpeg
    ↓
Burn captions if enabled (optional re-transcribe)
    ↓
Download clips
```

### Technology Stack
- **Framework:** Next.js 15 (app router)
- **Language:** TypeScript
- **Auth:** Google OAuth 2.0 + Custom session
- **AI:** Claude Sonnet 4.6 (clip analysis)
- **Transcription:** AssemblyAI
- **Video Processing:** FFmpeg, yt-dlp
- **Storage:** Local filesystem (Railway) / Vercel Blob (Vercel)
- **Styling:** CSS-in-JS (inline styles)
- **Deployment:** Railway (primary), Vercel (secondary)

---

## 📦 Environment Variables Required

```bash
# OAuth
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud Console>
GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback

# Session
SESSION_SECRET=<32+ character random string>

# AI & APIs
ANTHROPIC_API_KEY=<from Anthropic dashboard>
ASSEMBLYAI_API_KEY=<from AssemblyAI dashboard>

# Node
NODE_ENV=development
```

---

## 🚀 Deployment Status

### Railway (Primary)
- ✅ Docker container with yt-dlp and FFmpeg
- ✅ Environment variables configured
- ✅ Session management working
- ✅ OAuth callback endpoint accessible
- **Next:** Configure custom domain

### Vercel (Secondary - Legacy)
- ⚠️ Works but uses Vercel Blob storage (extra cost)
- ⚠️ OAuth still working but Railway is preferred
- **Note:** Vercel has strict 10-minute function timeout; Railway has no function limits

---

## 🧪 Testing Checklist

Before deploying new changes:
```
[ ] OAuth login flow works
[ ] Session persists across pages
[ ] Video download succeeds
[ ] Transcription completes without errors
[ ] AI analysis returns valid JSON
[ ] Mark Start/End buttons capture current time
[ ] Clip extraction produces correct file
[ ] Captions burn correctly
[ ] All API endpoints return proper error messages
[ ] Logout clears session
```

---

## 📝 Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `src/lib/youtube-oauth.ts` | OAuth client, token exchange, refresh logic |
| `src/lib/session.ts` | Encrypted session management with cookies |
| `src/app/api/auth/youtube/callback/route.ts` | OAuth callback handler |
| `src/app/api/auth/session/route.ts` | Session validation endpoint |
| `src/app/api/analyze/route.ts` | Claude analysis endpoint |
| `src/lib/claude.ts` | Claude Sonnet integration with structured prompts |
| `src/components/VideoPreviewModal.tsx` | Video player with Mark Start/End buttons |
| `src/lib/ffmpeg.ts` | FFmpeg CLI wrapper for video processing |
| `src/lib/ytdlp.ts` | yt-dlp CLI wrapper for YouTube downloads |

---

## 🔍 Debugging Guide

### "Failed to analyze video"
1. Check `ANTHROPIC_API_KEY` in .env.local
2. Check server logs for `❌ AI analysis error:`
3. Verify Claude model name is `claude-sonnet-4-6`
4. Check token limits (max_tokens: 4096)

### OAuth login loops back to home
1. Check `GOOGLE_OAUTH_CLIENT_ID` and `CLIENT_SECRET` are correct
2. Verify `GOOGLE_OAUTH_REDIRECT_URI` matches Google Console settings
3. Check `SESSION_SECRET` is at least 32 characters
4. Look for "Code exchanged for tokens" in server logs

### "Failed to download video"
1. Verify yt-dlp is installed (`which yt-dlp` on Railway)
2. Check YouTube video isn't private/age-restricted
3. Verify OAuth token is valid (check in session)
4. Check server logs for yt-dlp error messages

### Video transcription fails
1. Verify `ASSEMBLYAI_API_KEY` is valid
2. Check video codec is supported (H.264 best)
3. Check API rate limits haven't been exceeded
4. Verify audio is extractable from video

---

## 🎓 Next Developer Notes

### Continuing Development
1. **Always test OAuth flow** - Most bugs come from token issues
2. **Session debugging** - Use `/api/test/session` POST endpoint to test encryption
3. **Use detailed logging** - Add `console.log()` statements before deploying
4. **Test locally first** - Deploy to Railway only after local testing

### Scaling Considerations
- **Video storage:** Current local filesystem only; migrate to S3 for production
- **Database:** Consider adding database for clip history/user preferences
- **Rate limiting:** Add rate limits before public launch
- **Caching:** Cache transcriptions to avoid re-processing same videos

### Known Limitations
- YouTube private/age-restricted videos not supported
- Max video duration: 24 hours (AssemblyAI limit)
- No batch processing yet (single video at a time)
- No user accounts/persistence (session-based only)

---

## 📞 Support & Questions

For issues:
1. Check `.env.local` has all required keys
2. Run `/api/test/session` to verify encryption works
3. Check server logs with `tail -f /tmp/debug.log`
4. Verify OAuth credentials on Google Cloud Console
5. Test video URL directly on YouTube to confirm it's accessible

---

**Last Updated:** 2026-06-16  
**Commit:** 13ee91a - "Fix OAuth/session persistence and restore video clip capture UI"  
**Status:** ✅ Ready for production or further development
