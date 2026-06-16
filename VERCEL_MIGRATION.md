# Vercel Migration Plan

## Stage 1: Verify Local Works ✓
- [x] Fix absolute video paths
- [ ] Test full extraction flow with real video
- [ ] Confirm clips are created with captions

## Stage 2: Add Vercel Blob Storage

### Files to Update:
1. **src/lib/blob-storage.ts** (NEW)
   - Abstraction layer for blob operations
   - Use `@vercel/blob` in production
   - Fall back to local fs in development

2. **src/lib/ytdlp.ts**
   - Save downloaded video to Blob instead of disk
   - Return blob URL instead of file path

3. **src/lib/ffmpeg.ts**
   - Read video from Blob if in production
   - Save extracted clips to Blob
   - Handle temporary files (audio, SRT) in `/tmp`

4. **src/app/api/transcribe/route.ts**
   - Save transcripts to Blob instead of disk

5. **.env.local**
   - Add `VERCEL_BLOB_READ_WRITE_TOKEN` (auto-set by Vercel)

### Architecture:
```
Development: ./storage/* (local disk)
Production: Vercel Blob (persistent) + /tmp (temporary)
```

## Stage 3: Deploy to Vercel

### Setup:
1. Create Vercel project
2. Connect GitHub repo
3. Set environment variables
4. Deploy

### Vercel Config (vercel.json):
- Build command: `npm run build`
- Output directory: `.next`
- Max file size: 250MB (videos)

## Testing Checklist:
- [ ] Download video to Blob
- [ ] Extract clips from Blob video
- [ ] Generate captions
- [ ] Download clips via browser
- [ ] Metadata files working
- [ ] Keywords cache persisting
