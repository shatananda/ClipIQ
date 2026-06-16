# ClipIQ Architecture

## System Overview

ClipIQ is a full-stack Next.js application that processes YouTube videos through a multi-stage pipeline to suggest and extract short-form video clips.

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────────────────────┐
│   Next.js 15 App Router     │
│  (SSR + API Routes)         │
├─────────────────────────────┤
│ Pages:                      │
│  - /          (Home)        │
│  - /review    (Review)      │
│  - /summary   (Summary)     │
├─────────────────────────────┤
│ API Routes:                 │
│  - /api/download            │
│  - /api/transcribe          │
│  - /api/analyze             │
│  - /api/extract             │
│  - /api/keywords            │
└──────┬──────────────────────┘
       │
       │ Spawns processes
       ▼
┌──────────────────────────────────┐
│   Local System Processes         │
├──────────────────────────────────┤
│ yt-dlp     → Download video      │
│ ffmpeg     → Extract audio/clips │
│ AssemblyAI → Transcribe audio    │
│ Claude API → Analyze transcript  │
└──────────────────────────────────┘
       │
       │ Generates files
       ▼
┌──────────────────────────────────┐
│   ./storage/ Directory           │
├──────────────────────────────────┤
│ videos/      → Downloaded MP4    │
│ audio/       → Extracted WAV     │
│ clips/       → Output MP4        │
│ keywords.json → Cached keywords  │
└──────────────────────────────────┘
```

## Data Flow: Complete Pipeline

### Step 1: User Input
```
User enters YouTube URL
        ↓
[VideoInput Component]
        ↓
POST /api/download
```

### Step 2: Download
```
POST /api/download
├─ Input: { url: string }
├─ Process:
│  ├─ ytdlp.downloadVideo(url)
│  ├─ execSync("yt-dlp -f bestvideo+bestaudio ...")
│  └─ Extract video ID, title, duration
├─ Output: { videoId, videoPath, title, duration }
└─ Store: storage/videos/{videoId}.mp4
```

### Step 3: Transcribe
```
POST /api/transcribe
├─ Input: { videoId, videoPath }
├─ Process:
│  ├─ ffmpeg.extractAudio(videoPath)
│  ├─ execSync("ffmpeg -i video.mp4 -q:a 9 audio.wav")
│  ├─ assemblyai.transcribeAudio(audioPath)
│  ├─ API Call to AssemblyAI with audio buffer
│  └─ assemblyai.groupIntoParagraphs(words)
│     ├─ Group words into 15-word paragraphs
│     ├─ Aggregate timestamps
│     └─ Calculate average confidence
├─ Output: Paragraph[]
│  [{
│    text: "15 words...",
│    start: 1000,      // ms
│    end: 2000,        // ms
│    confidence: 0.95
│  }]
└─ Store: storage/audio/{videoId}.wav
```

### Step 4: Analyze
```
POST /api/analyze
├─ Input: { paragraphs[], keywords[] }
├─ Process:
│  ├─ Construct prompt with paragraphs + keywords
│  ├─ Call claude.analyzeTranscript(paragraphs, keywords)
│  ├─ API Call to Claude with transcript
│  ├─ Parse JSON response
│  └─ Validate ClipSuggestion format
├─ Output: ClipSuggestion[]
│  [{
│    id: 1,
│    start_ms: 3450,
│    end_ms: 4120,
│    headline: "...",
│    type: "Practice/Tutorial",
│    confidence: 92,
│    suggested_platforms: ["TikTok", "Instagram"]
│  }]
└─ Store: sessionStorage (browser)
```

### Step 5: Review & Selection
```
/review page (SSR with sessionStorage)
├─ Load: ClipIQState from sessionStorage
├─ Display: ClipCard for each suggestion
├─ User: Accept/Decline/Extract buttons
├─ Store: accepted[] in component state
└─ Next: User clicks "Proceed to Summary"
```

### Step 6: Extract
```
POST /api/extract (Optional, for immediate preview)
├─ Input: { videoPath, clip: ClipSuggestion }
├─ Process:
│  ├─ ffmpeg.extractClip(videoPath, clip)
│  ├─ execSync(`ffmpeg -i video.mp4 -vf scale=1080:1920... -ss ${start} -t ${duration} clip.mp4`)
│  └─ Filter: Scale and center crop to 1080x1920
├─ Output: { success: true, filename: "clip_1_xyz.mp4" }
└─ Store: storage/clips/{filename}.mp4
```

### Step 7: Download
```
/summary page
├─ Load: accepted_clips[] from sessionStorage
├─ Display: ClipCard for each accepted clip
├─ User: Click "Download Clip" button
├─ Browser: GET /api/serve-clip/{filename}
│  └─ Returns MP4 with Content-Disposition: attachment
├─ Browser: Downloads file to user's device
└─ Done!
```

## Component Architecture

### Pages

#### Home (`src/app/page.tsx`)
- **Purpose**: Input and kick off analysis
- **Components**: VideoInput, KeywordDrawer, ProcessingProgress
- **State**: 
  - `stage`: idle | downloading | transcribing | analyzing | complete
  - `keywords`: string[]
  - `excluded`: string[]
  - `loading`: boolean
- **Flow**:
  1. User pastes URL
  2. Click Analyze
  3. Call /api/download → /api/transcribe → /api/analyze sequentially
  4. Save state to sessionStorage
  5. router.push('/review')

#### Review (`src/app/review/page.tsx`)
- **Purpose**: Review and accept clips
- **Components**: ClipCard (multiple)
- **State**:
  - `state`: ClipIQState (from sessionStorage)
  - `accepted`: ClipSuggestion[]
  - `extracting`: number | null (clip ID being extracted)
- **Flow**:
  1. Load state from sessionStorage or redirect to home
  2. Display each clip in ClipCard
  3. User clicks Accept/Decline/Extract
  4. On Extract, call /api/extract
  5. "Proceed to Summary" saves accepted to sessionStorage and redirects

#### Summary (`src/app/summary/page.tsx`)
- **Purpose**: Download extracted clips
- **Components**: ClipCard (accepted only)
- **State**:
  - `clips`: ClipSuggestion[] (from sessionStorage)
- **Flow**:
  1. Load accepted_clips from sessionStorage or redirect
  2. Display each clip
  3. User clicks "Download Clip"
  4. Browser navigates to /api/serve-clip/{filename}
  5. File downloads

### Components

#### VideoInput (`src/components/VideoInput.tsx`)
- Props: `onAnalyze: (url) => void`, `isLoading: boolean`
- Input field with Analyze button
- Button disabled when URL empty
- Handles URL validation (basic)

#### KeywordDrawer (`src/components/KeywordDrawer.tsx`)
- Props: `keywords[]`, `excluded[]`, callbacks
- Expandable drawer showing keywords
- Add custom keyword form
- Toggle exclude/include
- Delete keyword

#### ProcessingProgress (`src/components/ProcessingProgress.tsx`)
- Props: `stage: ProcessingStage`, `estimatedWait?: number`
- Shows current stage (Downloading, Transcribing, Analyzing)
- Progress bar with percentage
- Stage indicators (completed ✓, current, pending)
- Estimated time remaining

#### ClipCard (`src/components/ClipCard.tsx`)
- Props: `clip`, `onAccept`, `onDecline`, `onExtract`, `isExtracting`
- Dark header with type badge and duration
- Large headline
- Italicized hook/quote
- Why-it's-clip-worthy explanation
- Metadata grid: timestamp, confidence bar, best platforms
- Three action buttons: Accept (green), Decline (red), Extract (blue)

## API Routes

### POST /api/download
```typescript
Request: { url: string }
Response: { 
  success: boolean
  videoId: string
  videoPath: string
  title: string
  durationSeconds: number
}
Process:
  1. Validate YouTube URL
  2. Extract video ID
  3. Create storage/videos/ directory
  4. Run: yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4"
  5. Get metadata with yt-dlp --dump-json
  6. Return info
```

### POST /api/transcribe
```typescript
Request: { videoId: string, videoPath: string }
Response: {
  success: boolean
  paragraphs: Paragraph[]
}
Process:
  1. Extract audio using ffmpeg
     ffmpeg -i video.mp4 -q:a 9 audio.wav
  2. Read audio file as buffer
  3. Call AssemblyAI API with audio buffer
  4. Wait for transcription (async polling)
  5. Get words with timestamps
  6. Group into 15-word paragraphs
  7. Aggregate timestamps and confidence
  8. Return paragraph array
```

### POST /api/analyze
```typescript
Request: { paragraphs: Paragraph[], keywords: string[] }
Response: {
  success: boolean
  clips: ClipSuggestion[]
}
Process:
  1. Format paragraphs into transcript text with timestamps
  2. Build Claude prompt with:
     - Instructions for clip identification
     - Transcript text
     - Keywords to emphasize
  3. Call Claude Sonnet 4.6 API
  4. Parse JSON response
  5. Validate against ClipSuggestion schema
  6. Return clips array
```

### POST /api/extract
```typescript
Request: { videoPath: string, clip: ClipSuggestion }
Response: {
  success: boolean
  filename: string
}
Process:
  1. Create storage/clips/ directory
  2. Generate filename from clip ID + headline
  3. Run ffmpeg to extract clip:
     ffmpeg -i video.mp4 \
       -ss {start_ms/1000} \
       -t {duration_seconds} \
       -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
       -c:v libx264 -preset fast -crf 23 \
       -c:a aac -b:a 128k \
       clip.mp4
  4. Return filename
```

### GET /api/keywords
```typescript
Response: { keywords: string[] }
Process:
  1. Read storage/keywords.json
  2. Parse JSON
  3. Return keywords array
```

### POST /api/keywords/add
```typescript
Request: { keyword: string }
Response: { success: boolean }
Process:
  1. Read current keywords from storage/keywords.json
  2. Check if keyword already exists
  3. Append keyword to array
  4. Write back to file
  5. Return success
```

### GET /api/keywords/excluded
```typescript
Response: { excluded: string[] }
Process:
  1. Read storage/keywords-excluded.json
  2. Parse JSON
  3. Return excluded keywords array
```

### POST /api/keywords/exclude
```typescript
Request: { keyword: string }
Response: { success: boolean }
Process:
  1. Read current excluded list
  2. If keyword in list: remove it (toggle off)
  3. If keyword not in list: add it (toggle on)
  4. Write back to file
  5. Return success
```

## State Management

### Browser State (sessionStorage)
```typescript
// Home to Review
clipiq_state: {
  clips: ClipSuggestion[]
  videoPath: string
  videoId: string
  title: string
}

// Review to Summary
accepted_clips: ClipSuggestion[]
```

**Why sessionStorage?**
- Persists across page navigation
- Automatically cleared on tab close
- No server-side storage needed
- Simple key-value API

### Component State
```typescript
// Home page
- keywords: string[]
- excluded: string[]
- stage: ProcessingStage
- loading: boolean

// Review page
- state: ClipIQState
- accepted: ClipSuggestion[]
- extracting: number | null

// Summary page
- clips: ClipSuggestion[]
```

## Error Handling

### API Layer
```typescript
try {
  // API call
} catch (error) {
  console.error('Error:', error)
  return Response.json({
    error: error.message || 'Failed'
  }, { status: 500 })
}
```

### React Layer
```typescript
try {
  const res = await fetch('/api/...')
  const data = await res.json()
  if (!data.success) throw new Error(data.error)
  // Process data
} catch (error) {
  console.error('Error:', error)
  alert(error.message)
}
```

## File System Layout

```
./storage/
├── videos/
│   ├── xdFdQNq7vAw.mp4       (Downloaded from YouTube)
│   └── ...
├── audio/
│   ├── xdFdQNq7vAw.wav       (Extracted from video)
│   └── ...
├── clips/
│   ├── clip_1_headline.mp4   (Extracted clip)
│   ├── clip_2_headline.mp4
│   └── ...
├── keywords.json              (Cached keyword list)
└── keywords-excluded.json     (User's excluded keywords)
```

**Why local file system?**
- Simple, no database needed
- Fast I/O for video/audio
- Easy debugging
- Scales to ~100 videos per machine
- Cloud storage as future enhancement

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-...        # Required: Claude API
ASSEMBLYAI_API_KEY=...          # Required: Audio transcription
STORAGE_PATH=./storage          # Optional: Custom storage location
NODE_ENV=development|production # Auto-set by Next.js
```

## Type Definitions

```typescript
// Transcription paragraph
interface Paragraph {
  text: string
  start: number      // milliseconds
  end: number        // milliseconds
  confidence: number // 0-1
}

// Suggested clip
interface ClipSuggestion {
  id: number
  start_ms: number
  end_ms: number
  duration_seconds: number
  type: string
  headline: string
  why_clip_worthy: string
  hook: string
  suggested_platforms: string[]
  confidence: number
}

// Full analysis state
interface ClipIQState {
  clips: ClipSuggestion[]
  videoPath: string
  videoId: string
  title: string
}
```

## Performance Characteristics

### Time Complexity
- Download: O(video_size) → network I/O bound
- Transcribe: O(video_length) → API call duration
- Analyze: O(transcript_length) → Claude API call
- Extract: O(number_of_clips * clip_duration) → FFmpeg I/O

### Space Complexity
- Storage: O(video_size + audio_size + clips_size)
- Memory: O(transcript_length) for Claude call

### Typical Timings (10-minute video)
- Download: 10-15 seconds
- Transcribe: 15-20 seconds
- Analyze: 5-10 seconds
- Extract: 2-5 seconds per clip
- **Total: 30-50 seconds**

## Scalability Considerations

### Current Limitations
- Single-machine processing (no job queue)
- Synchronous API calls (blocking)
- Local file storage (no cloud)
- Single user (no auth)

### Scaling Path
1. Add Bull/BullMQ for job queue
2. Async processing with Webhooks
3. S3/GCS for video storage
4. PostgreSQL for metadata
5. User authentication + database
6. Multi-worker deployment

## Security Model

### Current
- No authentication (public API)
- No rate limiting
- API keys in environment variables
- No CORS restrictions

### Recommended for Production
- User authentication (Auth0, Clerk)
- Rate limiting per user
- API key rotation
- CORS origin restrictions
- Content Security Policy headers
- Request validation + sanitization
- Sensitive data encryption

## Testing Strategy

### Unit Tests
- Individual functions (not implemented)

### Integration Tests
- API routes with mocked external calls (not implemented)

### E2E Tests
- Full pipeline with real YouTube video
- Form validation and navigation
- Keyword management
- 11 test cases in Playwright

### Test Coverage Goals
- Core pipeline: 100%
- UI components: 90%
- Error paths: 80%

## Deployment Architecture

### Development
```
Local Machine
├── npm run dev
├── localhost:3000
└── /storage/ on disk
```

### Production (Vercel)
```
Vercel Edge Network
├── Next.js App Router
├── API Routes (Serverless Functions)
├── Environment Variables (Encrypted)
└── /tmp/ Storage (Ephemeral)
```

**Limitation**: Vercel functions have 10 minute timeout and /tmp/ storage is ephemeral. For long videos or persistent storage, recommend AWS/GCP.

## Future Architecture

### Proposed: Job Queue Pattern
```
Browser → API → Job Queue (Redis/Bull)
              ├→ Worker 1: Download
              ├→ Worker 2: Transcribe
              ├→ Worker 3: Analyze
              └→ WebSocket → Browser (real-time updates)
                             Storage (S3)
```

### Proposed: Microservices
```
API Gateway
├→ Download Service (Node.js)
├→ Transcribe Service (Python + AssemblyAI)
├→ Analyze Service (Node.js + Claude)
├→ Extract Service (Node.js + FFmpeg)
└→ Storage Service (S3 SDK)
```

## Monitoring & Observability

### Recommended Stack
- **Error Tracking**: Sentry
- **Session Replay**: LogRocket
- **Analytics**: Mixpanel or custom
- **Performance**: Vercel Analytics
- **Logs**: Vercel/CloudWatch logs
- **APM**: New Relic or DataDog

### Key Metrics
- API latency per stage
- Success rate per stage
- Storage usage
- API quota usage
- Error rates and types
- User flow completion rates
