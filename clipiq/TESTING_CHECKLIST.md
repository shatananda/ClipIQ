# Phase 1 Testing Checklist

## Local Testing (Before Vercel Deployment)

### 1. Auth Flow ✓
- [ ] Visit `http://localhost:3001` 
- [ ] See "Login with YouTube" button (centered, large)
- [ ] Click button → redirected to Google consent screen
- [ ] Authorize ClipIQ
- [ ] Redirected back to `/videos` with YOUR channel videos loaded

### 2. Video List ✓
- [ ] Videos display in grid (thumbnail, title, date, duration)
- [ ] Can change page size (10 → 25 → 50)
- [ ] Page count updates correctly
- [ ] Pagination navigation works (◀ page numbers ▶)
- [ ] Status badges appear ("Analyzed"/"Clipped") if any videos have been processed

### 3. Video Selection ✓
- [ ] Click video thumbnail → modal opens with full details (description, views, duration)
- [ ] Modal shows YouTube embed (can play video preview)
- [ ] Click "Select this video" in modal → navigate to `/configure?videoId=...`

### 4. Configure Page ✓
- [ ] Shows correct video title from URL params
- [ ] YouTube embed displays video
- [ ] Caption toggle, font size slider, crop buttons all work
- [ ] "Start Analysis" button triggers pipeline
- [ ] See progress: "Downloading Video" → "Transcribing Audio" → "Analyzing with AI"

### 5. Review & Time Adjustment ✓
- [ ] Clips load on `/review` page
- [ ] "Adjust times" link expands for each clip
- [ ] Time adjuster shows sliders + text inputs (M:SS.s format)
- [ ] Adjust start/end times → duration updates
- [ ] Slider and text input stay in sync
- [ ] Approve clip → "Approved" badge appears

### 6. Download & Status ✓
- [ ] Approve 1-2 clips → "Go to Download (X clips)" button enabled
- [ ] Click → navigate to `/download` page
- [ ] Download clips (should extract with adjusted times)
- [ ] Return to `/videos` → clips show "Clipped" badge
- [ ] Refresh page → badge persists (localStorage)

### 7. Logout ✓
- [ ] Click "Logout" button (top right)
- [ ] Redirected to `/`
- [ ] Click "Login with YouTube" again → Google consent screen (not auto-logged in)

### 8. Token Refresh ✓
- [ ] Let token sit for 5+ minutes
- [ ] Perform an action that requires auth (navigate to `/videos`)
- [ ] Should auto-refresh without user noticing
- [ ] No 401 errors in console

---

## Common Issues to Watch For

| Issue | Solution |
|-------|----------|
| "Port already in use" | Kill process on port 3000: `lsof -i :3000` then `kill <PID>` |
| OAuth error "redirect_uri_mismatch" | Verify `.env.local` has `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/youtube/callback` (note: 3001 if port changed) |
| Videos don't load | Check `dev.log` for API errors; verify YouTube API enabled in Google Cloud |
| Time adjuster doesn't sync | Check browser console for JS errors; verify `videoDurationSeconds` is passed correctly |
| Status badges not showing | Check localStorage: `localStorage.getItem('clipiq_status_<videoId>')` in console |

---

## Once Local Testing Passes

1. Commit any fixes: `git add -A && git commit -m "..."`
2. Run `npm run build` to verify no TypeScript errors
3. Notify for Vercel deployment
4. Set up env vars on Vercel dashboard:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI=https://clipiq-phi.vercel.app/api/auth/youtube/callback`
   - `SESSION_SECRET`
   - Keep existing: `ANTHROPIC_API_KEY`, `ASSEMBLYAI_API_KEY`, `VERCEL_BLOB_READ_WRITE_TOKEN`

5. Deploy: `vercel --prod`
6. Test live at https://clipiq-phi.vercel.app

