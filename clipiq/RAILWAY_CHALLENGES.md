# Railway Deployment Challenges & Known Issues

This document outlines challenges and open issues specific to Railway deployment that need to be handled in the next session.

---

## 🚨 Critical Issues (Blocking Deployment)

### 1. **Railway Deployment Not Yet Tested**
**Status:** ⚠️ Code ready, but actual Railway deployment untested

**What needs to happen:**
- [ ] Push code to Railway (`railway up`)
- [ ] Verify server starts without errors
- [ ] Test OAuth flow end-to-end on Railway
- [ ] Confirm video download works with OAuth
- [ ] Verify video processing pipeline completes

**Why it matters:** All local testing is done, but we haven't confirmed it works in the actual Railway environment.

**Expected blockers:**
- Environment variables not set on Railway dashboard
- OAuth redirect URI doesn't match Railway domain
- yt-dlp/FFmpeg not properly installed in Docker container
- File permissions on /storage directory
- Memory/CPU limits during video processing

**Testing steps:**
```bash
# 1. Deploy to Railway
railway up

# 2. Check deployment logs
railway logs --tail

# 3. Verify OAuth works
# Visit https://your-railway-url
# Click "Login with YouTube"
# Authenticate and select a video

# 4. Test analysis pipeline
# Submit video for analysis
# Watch for errors in logs
```

---

### 2. **OAuth Redirect URI Configuration**
**Status:** ⚠️ Not tested on actual Railway domain

**Issue:** The `GOOGLE_OAUTH_REDIRECT_URI` environment variable must match exactly what's configured in Google Cloud Console.

**Current setting in code:**
```
http://localhost:3000/api/auth/youtube/callback
```

**Railway URL:** Unknown - depends on Railway's domain assignment

**What needs to happen:**
1. Deploy to Railway and get the actual URL (e.g., https://clipiq-abc123.railway.app)
2. Add new redirect URI in Google Cloud Console
3. Update `GOOGLE_OAUTH_REDIRECT_URI` on Railway dashboard to match
4. Test OAuth flow again

**If this isn't fixed:** Users will get "redirect_uri_mismatch" error when trying to authenticate.

---

### 3. **Video Storage Path on Railway**
**Status:** ⚠️ Using local filesystem, no cleanup mechanism

**Issue:** Videos are stored in `storage/videos/` on local filesystem
- Railway containers are ephemeral (reset on redeploy)
- Videos won't persist between deployments
- Disk space could fill up

**Current code:**
```typescript
// src/lib/storage.ts
const PATHS = {
  videos: './storage/videos',
  clips: './storage/clips',
  // ...
};
```

**What needs to happen:**
- [ ] **Option 1:** Migrate to S3/cloud storage
  - Add AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID
  - Modify blob-storage.ts to use S3
  - Cost: ~$1/month for typical usage

- [ ] **Option 2:** Use Railway Volume
  - Create persistent volume in Railway dashboard
  - Mount to /storage directory
  - Survives redeploys but limited size
  - Cost: Included in Railway plan

- [ ] **Option 3:** Stream videos without storing (advanced)
  - Download video → transcribe → analyze → delete
  - Never store intermediate files
  - Lower memory usage but more complex

**Recommended:** Option 2 (Railway Volume) for simplicity

---

### 4. **File Permissions & Directory Creation**
**Status:** ⚠️ Not tested in Docker container

**Issue:** Code creates `storage/videos`, `storage/clips`, `storage/audio` directories on first run

**Potential problems:**
- Directory creation might fail in Docker
- Permissions might prevent writing
- No error handling for permission denied

**What needs to happen:**
- [ ] Test if directories auto-create in Railway
- [ ] Add explicit error handling in storage.ts
- [ ] Verify write permissions are correct
- [ ] Add fallback to /tmp if /storage fails

**Test code:**
```bash
# In Railway terminal
ls -la storage/
# Should show directories with write permissions
```

---

## ⚠️ Known Limitations (Not Blockers)

### 5. **No Cleanup of Old Files**
**Status:** 🟡 Works but accumulates files

**Issue:** Downloaded videos and extracted clips never get deleted

**What needs to happen:**
- [ ] Add cleanup job to delete files older than 24 hours
- [ ] Or add manual cleanup endpoint `/api/admin/cleanup`
- [ ] Or set up cron job on Railway

**Impact:** Disk space will eventually fill up on long-running instance

---

### 6. **No Database for Clip History**
**Status:** 🟡 Functional but no persistence

**Issue:** Clips are stored in sessionStorage only (cleared on browser close)

**What needs to happen:**
- [ ] Add PostgreSQL database to Railway (free tier available)
- [ ] Create table: clips, videos, users
- [ ] Modify /api/download, /api/extract to store records
- [ ] Add /api/history endpoint for previously analyzed videos

**Impact:** Users can't see clip history across sessions

---

### 7. **No User Accounts**
**Status:** 🟡 Works for single user (Apu)

**Issue:** Authentication only checks if user has valid YouTube token, no user accounts

**What needs to happen:**
- [ ] Decide: Single user or multi-user?
- [ ] If multi-user:
  - Add users table to database
  - Associate clips with user ID
  - Add user dashboard

**Impact:** Only works for whoever authenticates; no multi-user support

---

### 8. **Memory Usage During Processing**
**Status:** 🟡 Works locally, untested on Railway

**Issue:** Large videos (30+ min) consume lots of RAM during processing
- Video download: ~200-500MB
- Audio extraction: ~50MB
- Full video in memory: potential OOM

**Railway limits:** Free tier has 512MB RAM

**What needs to happen:**
- [ ] Test with 20+ minute video
- [ ] Monitor memory usage in Railway logs
- [ ] If OOM errors occur:
  - Upgrade to paid Railway plan
  - Or implement streaming/chunked processing
  - Or limit max video length to 10 minutes

**Test:**
```bash
# Upload 15-20 minute video and watch logs
railway logs --tail
# Look for memory errors or slowdowns
```

---

### 9. **CPU Usage During FFmpeg Processing**
**Status:** 🟡 Works locally, untested on Railway

**Issue:** FFmpeg is CPU-intensive, especially for caption burning

**Railway limits:** Free tier has 0.5 CPU core

**Typical timings:**
- Extract 10-second clip: 5-10 seconds
- With captions: 15-20 seconds
- With crop + captions: 20-30 seconds

**What needs to happen:**
- [ ] Test with 5+ clips extraction
- [ ] If timeouts occur:
  - Upgrade Railway plan
  - Or use queue system (Bull, RQ)
  - Or pre-process without captions

**Test:**
```bash
# Analyze video, approve 10+ clips, extract all
# Watch for timeouts in logs
```

---

## 📋 Pre-Deployment Checklist

### Environment Variables
- [ ] `GOOGLE_OAUTH_CLIENT_ID` set on Railway
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` set on Railway
- [ ] `GOOGLE_OAUTH_REDIRECT_URI` matches Railway URL
- [ ] `SESSION_SECRET` set to 32+ character string
- [ ] `ANTHROPIC_API_KEY` valid and has quota
- [ ] `ASSEMBLYAI_API_KEY` valid and has credits
- [ ] `NODE_ENV=production`

### Docker & Infrastructure
- [ ] Dockerfile builds successfully (`docker build .`)
- [ ] yt-dlp is available in container (`docker run ... yt-dlp --version`)
- [ ] FFmpeg is available in container (`docker run ... ffmpeg -version`)
- [ ] /storage directory is writable
- [ ] Consider: Add Railway Volume for persistence

### Testing on Railway
- [ ] Deploy with `railway up`
- [ ] Home page loads at https://your-url
- [ ] OAuth login works (no redirect_uri_mismatch error)
- [ ] Can select a YouTube video
- [ ] Video analysis completes
- [ ] Can extract at least 1 clip
- [ ] Downloaded clip plays correctly
- [ ] Check logs for errors: `railway logs --tail`

### Performance Verification
- [ ] Test with 15+ minute video (check memory)
- [ ] Test extracting 10+ clips (check CPU)
- [ ] Monitor memory/CPU usage in Railway dashboard
- [ ] Note max duration before hitting limits

---

## 🔧 Troubleshooting Guide

### "redirect_uri_mismatch" error during OAuth
```
Solution: 
1. Get actual Railway URL
2. Add to Google Cloud Console
3. Update GOOGLE_OAUTH_REDIRECT_URI environment variable
4. Restart Railway deployment
```

### "Permission denied" when creating directories
```
Solution:
1. Check /storage directory exists
2. Add Railway Volume if not persistent
3. Or modify code to use /tmp instead
```

### "Out of memory" during video processing
```
Solution:
1. Check Railway plan (may need upgrade)
2. Or implement chunked processing
3. Or limit max video length
```

### "Timeout" during clip extraction
```
Solution:
1. Check Railway plan resources
2. Increase timeout in API route
3. Or use background job queue (advanced)
```

### OAuth tokens not persisting across requests
```
Solution:
1. Verify SESSION_SECRET is 32+ characters
2. Check GOOGLE_OAUTH_REDIRECT_URI is correct
3. Verify browser cookies are enabled
4. Test /api/test/session endpoint
```

---

## 📊 Success Criteria for Next Session

The Railway deployment is ready when:

✅ Code deployed without errors  
✅ OAuth login works end-to-end  
✅ Can analyze a 10+ minute video  
✅ Can extract clips successfully  
✅ No OOM or timeout errors with typical usage  
✅ Memory usage < 80% of available  
✅ CPU usage reasonable (no constant maxing out)  
✅ Logs are clean (no concerning errors)  

---

## 📝 Next Steps

1. **Deploy to Railway**
   - Confirm environment variables are set
   - Run `railway up`
   - Get deployment URL

2. **Test OAuth Flow**
   - Visit deployment URL
   - Click "Login with YouTube"
   - Update Google redirect URI if needed
   - Retry until OAuth succeeds

3. **Test Video Analysis**
   - Select a 5-minute test video first
   - Run analysis
   - Extract a clip
   - Verify output file

4. **Load Test**
   - Try 20-minute video
   - Extract 10+ clips
   - Monitor memory/CPU

5. **Fix Issues Found**
   - Document in RAILWAY_CHALLENGES.md
   - Update code as needed
   - Re-deploy

6. **Document for Production**
   - Update deployment instructions
   - Create runbook for common issues
   - Set up monitoring/alerts

---

**Last Updated:** 2026-06-16  
**Status:** ⚠️ Deployment ready in code, but untested on actual Railway  
**Priority:** HIGH - This is blocking production readiness
