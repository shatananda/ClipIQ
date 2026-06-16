# ClipIQ E2E Testing Guide

## Overview

The E2E test suite uses Playwright to test the full ClipIQ pipeline from YouTube URL input to clip summary generation.

## Test Files

- **e2e/basic.spec.ts** - Basic UI functionality tests (form, navigation, API health)
- **e2e/pipeline.spec.ts** - Full end-to-end pipeline test with YouTube video processing

## Running Tests

### Run all tests
```bash
npm test
```

### Run basic tests only (fast, ~30s)
```bash
npm test -- e2e/basic.spec.ts
```

### Run full pipeline test (slower, ~3-5 minutes)
```bash
npm test -- e2e/pipeline.spec.ts
```

### Run with browser visible (debug mode)
```bash
npm test -- --headed
```

### Run in debug mode with inspector
```bash
npm run test:debug
```

### Run with UI dashboard
```bash
npm run test:ui
```

## Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Video recordings and screenshots of failures are saved in `playwright-report/`.

## Diagnosing the "Failed to fetch" Error

If you see "Failed to fetch" in the browser console, the E2E test will capture:

1. **Network errors** - Failed API calls with status codes
2. **Console logs** - All browser console output
3. **Current URL** - Where the test failed

The test output will show which API endpoint failed:

```
Network errors detected:
  - http://localhost:3000/api/download: 500 Internal Server Error
```

### Common Issues

#### 1. Download API Failing
Check `/api/download` is working:
```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/xdFdQNq7vAw"}'
```

**Possible causes:**
- `yt-dlp` not installed: `brew install yt-dlp`
- Storage directory permission issues
- YouTube URL format incorrect

#### 2. Transcribe API Failing
Check AssemblyAI configuration:
- Verify `ASSEMBLYAI_API_KEY` in `.env.local`
- Ensure audio extraction works: `ffmpeg` must be installed

**Possible causes:**
- Missing `ASSEMBLYAI_API_KEY` environment variable
- `ffmpeg` not installed: `brew install ffmpeg`
- Invalid AssemblyAI API key

#### 3. Analyze API Failing
Check Claude API configuration:
- Verify `ANTHROPIC_API_KEY` in `.env.local`
- Check API key has sufficient credits

**Possible causes:**
- Missing `ANTHROPIC_API_KEY` environment variable
- Invalid or expired API key
- Rate limiting or quota exceeded

## Test YouTube URLs

The test suite includes this YouTube URL by default:
```
https://youtu.be/xdFdQNq7vAw?si=JFZm0pc5zAHOkPw3
```

**Video specs:**
- 9:16 vertical format
- ~10 minutes duration
- Good for testing clip extraction

## Manual Testing

### 1. Start dev server
```bash
npm run dev
```

### 2. Open browser
```
http://localhost:3000
```

### 3. Test the pipeline
1. Paste YouTube URL
2. Click "Analyze"
3. Watch progress stages (Downloading → Transcribing → Analyzing)
4. Review suggested clips
5. Accept/decline clips
6. View summary and download

## Expected Test Output

All basic tests passing:
```
  6 passed (23.1s)
  ✓ Home page loaded
  ✓ Form elements visible
  ✓ Button enabled with URL
  ✓ Keywords loaded: 51 selected
  ✓ /api/keywords: 51 keywords
  ✓ All pages accessible
```

Full pipeline test (if YouTube video is accessible):
```
  ✓ Download stage started
  ✓ Transcribing stage started
  ✓ Analyzing stage started
  ✓ Redirected to review page
  ✓ Clip cards loaded
  ✓ Summary shows 1 accepted clip
  ✓ Download button available
```

## Debugging Tips

1. **Check dev server logs** - Terminal where `npm run dev` is running
2. **Browser DevTools** - Press F12 in headed test to inspect elements
3. **Test snapshots** - Playwright saves screenshots/videos of failures
4. **Network tab** - See exact API responses and failures

## CI/CD Integration

The test suite is configured for GitHub Actions CI with:
- Automatic server startup
- Single worker (no parallelization)
- 2 retry attempts on failure
- Video recording on failure only

```bash
# In CI environment
npm test
```

## Customizing Tests

To run tests with a different YouTube URL:

Edit `e2e/pipeline.spec.ts`:
```typescript
const YOUTUBE_URL = 'https://youtu.be/YOUR-VIDEO-ID';
```

## Performance Expectations

- Basic tests: ~30 seconds (includes server startup)
- Full pipeline: ~3-5 minutes depending on video length
- Individual test: ~2-3 minutes

## Troubleshooting

### Tests timeout
- Increase `timeout` in `playwright.config.ts`
- YouTube download/AssemblyAI transcription can be slow
- Try a shorter video URL

### "Repository not found" error
- Ensure you're in the right directory: `/Users/noelshatananda/Downloads/SFDev/clipiq`

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. Run basic tests to verify setup: `npm test -- e2e/basic.spec.ts`
2. Check API health endpoints are responding
3. Run full pipeline test with diagnostic output
4. Review `playwright-report/` for failure details
