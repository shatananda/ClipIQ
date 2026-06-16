# ClipIQ — Project-Specific Guidelines

This file provides guidance to Claude Code when working with ClipIQ.

---

## Project Overview

**ClipIQ** analyzes YouTube videos to identify and extract short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts using AI-powered analysis.

**Stack:** Next.js 15 (TypeScript), Claude Sonnet 4.6, AssemblyAI, yt-dlp, FFmpeg

**Status:** ✅ Production-ready. OAuth authentication and session management fully implemented.

---

## Critical Architecture Decisions

### 1. Session Management
- **Current:** Custom AES-256 encrypted cookie-based sessions (NOT iron-session)
- **Why:** iron-session has timing issues with Next.js 15 app router and environment variable loading
- **How:** 
  - Session data encrypted/decrypted in `src/lib/session.ts`
  - Cookies stored with `credentials: 'include'` in all client fetch calls
  - 32+ character `SESSION_SECRET` required in .env.local
- **Important:** If you need to change session storage, verify OAuth token persistence works across page navigations

### 2. OAuth Authentication
- **Provider:** Google OAuth 2.0 (for YouTube API access)
- **Critical:** Must request `prompt: 'consent'` to ensure refresh token is returned
- **Token Refresh:** Automatic on `/api/auth/session` if token expiring soon
- **Storage:** Encrypted in session cookie (never in localStorage)
- **Redirect:** After OAuth callback, session cookie set BEFORE redirect to /videos

### 3. Video Processing Pipeline
- **Download:** yt-dlp CLI (not npm packages like play-dl or ytdl-core)
  - Reason: npm packages get blocked by YouTube bot detection; CLI with OAuth works reliably
  - Railway has yt-dlp in Dockerfile; ensure it's installed in any new deployment
- **Transcription:** AssemblyAI API (assembly AI SDK)
  - Returns Paragraph array with start/end timestamps in milliseconds
  - Confidence scores included for quality assessment
- **Analysis:** Claude Sonnet 4.6 with structured JSON output
  - Max tokens: 4096 (was 2048, increased for better analysis)
  - Always return clips with id, start_ms, end_ms, confidence, type, headline, platforms
- **Extraction:** FFmpeg with libass caption support
  - Input: Video file + start/end times (ms)
  - Output: 1080x1920 vertical MP4
  - Captions optional; if enabled, may re-transcribe clip audio for accuracy

### 4. Client-Side OAuth Flow
- **MUST:** Include `credentials: 'include'` in ALL fetch calls to `/api/auth/session`
- **Why:** Browser won't send cookies without this flag
- **Files to check:** page.tsx (home), videos/page.tsx, LogoutButton.tsx
- **Pattern:** `fetch('/api/auth/session', { credentials: 'include' })`

---

## Common Development Tasks

### Adding a New API Endpoint
1. Create file in `src/app/api/[path]/route.ts`
2. Check session with `await getSession()` and `isLoggedIn(session)`
3. Add logging: `console.log('🔍 Descriptive message')`
4. Return `Response.json()` not `NextResponse.json()` for better compatibility
5. Include error handling with try-catch
6. Test locally with `curl -X POST http://localhost:3000/api/your-endpoint`

### Debugging Session Issues
1. Check `.env.local` has `SESSION_SECRET` (32+ characters)
2. Verify `GOOGLE_OAUTH_CLIENT_ID` and `CLIENT_SECRET` are correct
3. Test session encryption: `POST /api/test/session` with `{"accessToken":"test","refreshToken":"test"}`
4. Check browser cookies: DevTools → Application → Cookies → look for `clipiq_session`
5. Check server logs for "Session saved" and "Session retrieved" messages

### Testing OAuth Flow
1. Clear browser cookies
2. Click "Login with YouTube"
3. Authenticate with Google
4. Check server logs for "✓ Code exchanged for tokens"
5. Verify refresh token is present: "refreshToken: true" should show in logs
6. Confirm redirect to /videos succeeds

### Adding UI Features
- Use **CSS-in-JS inline styles** (project uses this pattern, not CSS modules)
- Store any state needed during video processing in **sessionStorage** (survives refresh)
- Use React hooks: `useState`, `useEffect`, `useRef` (no class components)
- For video player actions, use YouTube IFrame API with `enablejsapi=1` parameter

---

## Code Patterns & Conventions

### File Organization
```
src/
├── app/                          # Next.js pages & API routes
│   ├── page.tsx                  # Home page (public, no auth)
│   ├── [page]/page.tsx           # Other pages (check auth in useEffect)
│   ├── api/[endpoint]/route.ts   # API endpoints (check auth immediately)
│   └── layout.tsx                # Root layout with navigation
├── components/                   # Reusable React components
│   └── Component.tsx             # One component per file
├── lib/                          # Utilities & business logic
│   ├── youtube-oauth.ts          # OAuth client and token functions
│   ├── session.ts                # Session encryption/decryption
│   ├── claude.ts                 # Claude API wrapper
│   └── [service].ts              # Other service integrations
└── types/                        # TypeScript definitions
    └── index.ts                  # All types in one file
```

### Naming Conventions
- **Components:** PascalCase (VideoPreviewModal.tsx)
- **Functions:** camelCase (getSession, fetchVideos)
- **Constants:** UPPER_SNAKE_CASE (SESSION_SECRET, API_TIMEOUT)
- **Booleans:** is/has prefix (isLoggedIn, hasError)
- **Event handlers:** handle prefix (handleApprove, handleTimeChange)

### Logging Pattern
```typescript
// Use emoji + descriptive messages
console.log('📥 Downloading video:', videoId);
console.log('✓ Transcription complete:', paragraphs.length, 'paragraphs');
console.error('❌ Analysis failed:', error);
```

### Error Handling
- **API routes:** Always wrap in try-catch, return `Response.json({ error: message }, { status: 500 })`
- **Client-side:** Catch errors, set error state, display to user
- **Never:** Silently fail or return empty responses

### Type Safety
- Define interfaces in `src/types/index.ts`
- Use TypeScript strict mode (tsconfig.json)
- For API responses, define Request and Response types
- Example:
```typescript
interface ClipSuggestion {
  id: number;
  start_ms: number;
  end_ms: number;
  headline: string;
  confidence: number;
  // ... other fields
}
```

---

## Performance Considerations

### Video Processing
- Largest bottleneck: AssemblyAI transcription (~15 seconds for 10-minute video)
- Clips may have slow extraction if many captions to burn (FFmpeg CPU-intensive)
- Cache transcripts if reanalyzing same video

### API Calls
- Claude analysis: ~10 seconds for typical transcript
- Use structured prompts to ensure valid JSON output
- Increase max_tokens if clips missing or truncated

### Frontend
- sessionStorage for state (survives refresh, cleared on tab close)
- Avoid localStorage (persists indefinitely, risk of stale data)
- Update UI optimistically for better UX

---

## Testing Checklist Before Deploy

- [ ] OAuth login/logout works
- [ ] Session persists across pages (use credentials: 'include')
- [ ] Video download succeeds (check yt-dlp installed)
- [ ] Transcription completes (check AssemblyAI API key)
- [ ] Claude analysis returns valid JSON with all required fields
- [ ] Clip extraction produces correct duration
- [ ] Mark Start/End buttons capture correct time from video
- [ ] Captions burn correctly (if enabled)
- [ ] All API endpoints return proper error messages (no empty responses)
- [ ] LogoutButton clears session and redirects to home

---

## Deployment Checklist

### Railway
- [ ] `Dockerfile` includes yt-dlp and ffmpeg
- [ ] All `.env` variables set in Railway dashboard
- [ ] OAuth redirect URI matches Railway domain
- [ ] Test OAuth flow on Railway
- [ ] Monitor logs: `railway logs --tail`

### Environment Variables (Never in code)
```
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
SESSION_SECRET (32+ characters)
ANTHROPIC_API_KEY
ASSEMBLYAI_API_KEY
NODE_ENV=production
```

---

## Gotchas & Common Mistakes

1. **❌ Forgetting `credentials: 'include'` in fetch**
   - Cookies won't be sent to server
   - Session checks return `isLoggedIn: false`
   - Fix: Add it to EVERY fetch call that needs auth

2. **❌ Using `Response.redirect()` instead of `NextResponse.redirect()`**
   - Session cookies don't get set in response
   - User gets redirected but session lost
   - Fix: Always use `NextResponse` from 'next/server'

3. **❌ Storing tokens in localStorage**
   - Persists forever, can become stale
   - XSS vulnerability
   - Fix: Keep tokens in encrypted session cookies only

4. **❌ Missing `prompt: 'consent'` in OAuth URL**
   - Google won't return refresh token on second login
   - User gets stuck in login loop
   - Fix: Always include in `getAuthUrl()`

5. **❌ SESSION_SECRET less than 32 characters**
   - AES-256 requires 32-byte key
   - Error: "Key must be 32 bytes long"
   - Fix: Use random 32+ character string

6. **❌ Not checking session expiry**
   - Tokens expire after ~1 hour
   - API calls fail silently
   - Fix: Call `session.save()` after updating token

---

## Resources & References

- **Next.js 15 Docs:** https://nextjs.org/docs
- **Claude API:** https://docs.anthropic.com/
- **YouTube Data API:** https://developers.google.com/youtube/v3
- **AssemblyAI:** https://www.assemblyai.com/docs
- **FFmpeg:** https://ffmpeg.org/documentation.html
- **yt-dlp:** https://github.com/yt-dlp/yt-dlp

---

## Questions or Issues?

Refer to:
1. **[HANDOFF.md](HANDOFF.md)** — Complete project overview and debugging guide
2. **[API.md](API.md)** — Detailed API endpoint documentation
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design and data flow
4. **Server logs:** `tail -f /tmp/debug.log`
5. **Session test:** `POST /api/test/session` to verify encryption works

---

**Last Updated:** 2026-06-16  
**Status:** ✅ Production-ready
