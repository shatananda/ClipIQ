# ClipIQ API Documentation

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://clipiq.vercel.app` (or your domain)

## Authentication
None required (public API). API keys stored in server environment variables.

## Content Type
All endpoints use `Content-Type: application/json`

---

## Video Processing Pipeline

### 1. POST /api/download
Download a YouTube video and extract metadata.

**Request**
```json
{
  "url": "https://youtu.be/VIDEO_ID"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "videoId": "xdFdQNq7vAw",
  "videoPath": "storage/videos/xdFdQNq7vAw.mp4",
  "title": "Relaxing Ayurvedic Face Massage Routine with Oil",
  "durationSeconds": 125
}
```

**Error Response (500 Internal Server Error)**
```json
{
  "error": "Invalid YouTube URL"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | YouTube video URL (youtube.com, youtu.be, or shorts formats) |

**Notes**
- Stores video in `storage/videos/{videoId}.mp4`
- Validates YouTube URL format
- Extracts video ID from URL
- Fetches metadata (title, duration) via yt-dlp
- Timeout: ~30 seconds depending on video size

**Errors**
- `Invalid YouTube URL` - URL doesn't match YouTube domains
- `Download failed` - yt-dlp process failed
- `SyntaxError` - Invalid JSON in request body

---

### 2. POST /api/transcribe
Extract audio and transcribe using AssemblyAI.

**Request**
```json
{
  "videoId": "xdFdQNq7vAw",
  "videoPath": "storage/videos/xdFdQNq7vAw.mp4"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "paragraphs": [
    {
      "text": "welcome to this ayurvedic face massage tutorial today we will...",
      "start": 0,
      "end": 15000,
      "confidence": 0.93
    },
    {
      "text": "first apply some warm sesame oil to your fingertips very gently...",
      "start": 15000,
      "end": 30000,
      "confidence": 0.91
    }
  ]
}
```

**Error Response (500 Internal Server Error)**
```json
{
  "error": "Failed to extract audio: audio extraction failed"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| videoId | string | Yes | Video ID from download endpoint |
| videoPath | string | Yes | File path from download endpoint |

**Notes**
- Extracts audio to `storage/audio/{videoId}.wav`
- Groups words into ~15-word paragraphs for readability
- Aggregates timestamps (start of first word to end of last word)
- Calculates average confidence across paragraph words
- Timeout: ~60 seconds for 10-minute video
- AssemblyAI polling interval: 3 seconds

**Paragraph Structure**
```typescript
interface Paragraph {
  text: string          // 15-word average, lowercase
  start: number         // Milliseconds, timestamp of first word
  end: number           // Milliseconds, timestamp of last word
  confidence: number    // 0-1, average of all words in paragraph
}
```

**Errors**
- `Failed to extract audio: ...` - FFmpeg process failed
- `Transcription failed: ...` - AssemblyAI API error
- `audio_url should start with http` - Audio conversion issue

---

### 3. POST /api/analyze
Analyze transcript using Claude to suggest clips.

**Request**
```json
{
  "paragraphs": [
    {
      "text": "welcome to this ayurvedic...",
      "start": 0,
      "end": 15000,
      "confidence": 0.93
    }
  ],
  "keywords": ["ayurveda", "massage", "wellness"]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "clips": [
    {
      "id": 1,
      "start_ms": 0,
      "end_ms": 117000,
      "duration_seconds": 117,
      "type": "Practice/Tutorial",
      "headline": "Ayurvedic Face Massage Tutorial: The Ancient Technique for Glowing Skin",
      "why_clip_worthy": "The full tutorial is concise, visually demonstrative, and covers a complete step-by-step practice...",
      "hook": "This one ancient technique can restore your entire body — and it only takes a few minutes on your face.",
      "suggested_platforms": ["TikTok", "Instagram Reels"],
      "confidence": 88
    }
  ]
}
```

**Error Response (500 Internal Server Error)**
```json
{
  "error": "Error generating clip suggestions. Please try again."
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| paragraphs | Paragraph[] | Yes | Array of paragraphs from transcribe endpoint |
| keywords | string[] | Yes | Array of keywords to emphasize in analysis |

**Notes**
- Calls Claude Sonnet 4.6 with 2048 token limit
- Generates 3-7+ clips per video (Claude decides based on content)
- Timestamps in milliseconds
- Confidence is 0-100% integer
- Timeout: ~30 seconds for Claude API call
- Strips markdown code fences from response

**ClipSuggestion Structure**
```typescript
interface ClipSuggestion {
  id: number                    // Sequential 1, 2, 3, ...
  start_ms: number              // Start time in milliseconds
  end_ms: number                // End time in milliseconds
  duration_seconds: number      // Calculated: (end_ms - start_ms) / 1000
  type: string                  // "Product Tip", "Dosha Advice", "Wisdom/Affirmation", etc.
  headline: string              // Engaging title for the clip
  why_clip_worthy: string       // Explanation of why it's a good clip
  hook: string                  // Opening hook/first line to grab attention
  suggested_platforms: string[] // ["TikTok", "Instagram Reels", "YouTube Shorts"]
  confidence: number            // 0-100 integer, Claude's confidence
}
```

**Clip Type Options** (defined in claude.ts)
- Product Tip
- Dosha Advice
- Wisdom/Affirmation
- Practice/Tutorial
- Q&A
- Behind-the-Scenes

**Platform Constraints** (Claude considers these)
- TikTok: Up to 10 minutes (600 seconds)
- Instagram Reels: Up to 90 seconds
- YouTube Shorts: Up to 60 seconds

**Errors**
- `paragraphs and keywords required` - Missing parameters
- `Error generating clip suggestions...` - Claude API failure
- `Failed to add keyword` - JSON parsing error in request

---

## Clip Extraction

### 4. POST /api/extract
Extract a specific clip as 1080x1920 MP4 video.

**Request**
```json
{
  "videoPath": "storage/videos/xdFdQNq7vAw.mp4",
  "clip": {
    "id": 1,
    "start_ms": 0,
    "end_ms": 117000,
    "duration_seconds": 117,
    "type": "Practice/Tutorial",
    "headline": "Ayurvedic Face Massage Tutorial...",
    "confidence": 88,
    "hook": "...",
    "why_clip_worthy": "...",
    "suggested_platforms": ["TikTok"]
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "filename": "clip_1_Ayurvedic_Face_Massage_Tutorial.mp4"
}
```

**Error Response (500 Internal Server Error)**
```json
{
  "error": "Extraction failed: video codec not supported"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| videoPath | string | Yes | Path to source video file |
| clip | ClipSuggestion | Yes | Clip object with timestamps |

**Notes**
- Generates filename: `clip_{id}_{headline_sanitized}.mp4`
- Sanitizes headline (replaces non-alphanumeric with underscores)
- Extracts to `storage/clips/{filename}`
- Video format: 1080x1920 (9:16 vertical)
- Video codec: H.264 (libx264)
- Audio codec: AAC, 128 kbps
- FFmpeg preset: fast (balance of speed/quality)
- CRF: 23 (good quality)
- Timeout: ~10 seconds per clip

**FFmpeg Filter**
```
scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(ow-iw)/2:(oh-ih)/2
```
- Scales to fit 1080x1920
- Crops to exact 1080x1920 (centered)
- Preserves aspect ratio

**Errors**
- `videoPath and clip required` - Missing parameters
- `Extraction failed: ...` - FFmpeg error

---

## Keyword Management

### 5. GET /api/keywords
Get all available keywords.

**Response (200 OK)**
```json
{
  "keywords": [
    "ayurveda",
    "dosha",
    "vata",
    "pitta",
    "kapha",
    "wellness",
    "massage",
    ...
  ]
}
```

**Notes**
- Returns keywords from `storage/keywords.json`
- Pre-loaded with 50+ Pure Ishvari wellness keywords
- Case-sensitive
- No duplicate handling (API doesn't prevent duplicates)

---

### 6. POST /api/keywords/add
Add a custom keyword.

**Request**
```json
{
  "keyword": "chakra"
}
```

**Response (200 OK)**
```json
{
  "success": true
}
```

**Error Response (400 Bad Request)**
```json
{
  "error": "keyword required"
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| keyword | string | Yes | Keyword to add (case-sensitive) |

**Notes**
- Appends to `storage/keywords.json`
- No duplicate checking
- Case-sensitive (add same word in different case = duplicate)
- Empty string returns error 400

**Errors**
- `keyword required` - Missing or empty keyword parameter
- `Failed to add keyword` - File system error

---

### 7. GET /api/keywords/excluded
Get list of excluded keywords.

**Response (200 OK)**
```json
{
  "excluded": [
    "filler-keyword",
    "not-relevant"
  ]
}
```

**Notes**
- Returns keywords from `storage/keywords-excluded.json`
- Empty array if file doesn't exist
- These keywords are toggled off during analysis

---

### 8. POST /api/keywords/exclude
Toggle keyword exclusion state.

**Request**
```json
{
  "keyword": "ayurveda"
}
```

**Response (200 OK)**
```json
{
  "success": true
}
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| keyword | string | Yes | Keyword to toggle |

**Behavior**
- If keyword in excluded list: **Remove it** (un-exclude)
- If keyword not in excluded list: **Add it** (exclude)

**Notes**
- Updates `storage/keywords-excluded.json`
- Toggling same keyword twice returns to original state
- Excluded keywords still appear in UI but are greyed out
- Next analysis uses only non-excluded keywords

**Errors**
- `keyword required` - Missing keyword parameter
- `Failed to toggle...` - File system error

---

## File Serving

### 9. GET /api/serve-clip/[filename]
Download an extracted clip.

**URL Pattern**
```
/api/serve-clip/clip_1_Ayurvedic_Face_Massage_Tutorial.mp4
```

**Response (200 OK)**
```
[Binary MP4 data]
```

**Headers**
```
Content-Type: video/mp4
Content-Disposition: attachment; filename="clip_1_Ayurvedic_Face_Massage_Tutorial.mp4"
Content-Length: [file size in bytes]
```

**Error Response (404 Not Found)**
```
File not found
```

**Notes**
- File must exist in `storage/clips/`
- Browser downloads with original filename
- Streaming response (efficient for large files)
- No Content-Length if file doesn't exist

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error description"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing parameters) |
| 404 | File not found |
| 500 | Server error (API call failed, process crashed) |

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid YouTube URL` | URL format wrong | Check youtu.be/ or youtube.com/watch?v= |
| `Download failed` | yt-dlp issue | Check if video is downloadable, update yt-dlp |
| `Failed to extract audio` | FFmpeg issue | Check if ffmpeg installed, video codec supported |
| `Transcription failed` | AssemblyAI issue | Check API key, quota, network |
| `Error generating clip suggestions` | Claude API issue | Check API key, quota, network, token limit |
| `keyword required` | Missing parameter | Include keyword in request body |

---

## Rate Limiting
Currently **no rate limiting**. For production, implement:
- IP-based: 10 requests/minute per IP
- User-based: 100 requests/day per authenticated user
- API key based: Custom limits per subscription tier

---

## Performance Benchmarks

### Typical Response Times (10-minute video)
| Endpoint | Time | Variability |
|----------|------|-------------|
| /api/download | 10-15s | ±5s (network dependent) |
| /api/transcribe | 15-20s | ±10s (AssemblyAI queue) |
| /api/analyze | 5-10s | ±5s (Claude latency) |
| /api/extract | 3-5s | ±2s (FFmpeg/codec) |
| **Total Pipeline** | **30-50s** | ±22s |

### Concurrent Requests
- Single machine: ~1 concurrent full pipeline
- Bottleneck: FFmpeg (CPU-bound)
- Solution for scale: Job queue + multiple workers

---

## Code Examples

### JavaScript/TypeScript
```typescript
// Download
const downloadRes = await fetch('/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://youtu.be/VIDEO_ID' })
})
const { videoId, videoPath } = await downloadRes.json()

// Transcribe
const transcribeRes = await fetch('/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ videoId, videoPath })
})
const { paragraphs } = await transcribeRes.json()

// Analyze
const analyzeRes = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paragraphs,
    keywords: ['ayurveda', 'wellness']
  })
})
const { clips } = await analyzeRes.json()
```

### cURL
```bash
# Download
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/xdFdQNq7vAw"}'

# Transcribe
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"videoId":"xdFdQNq7vAw","videoPath":"storage/videos/xdFdQNq7vAw.mp4"}'

# Add keyword
curl -X POST http://localhost:3000/api/keywords/add \
  -H "Content-Type: application/json" \
  -d '{"keyword":"chakra"}'

# Download clip
curl -O -J http://localhost:3000/api/serve-clip/clip_1_Headline.mp4
```

---

## Webhooks (Future)
Planned for asynchronous processing:
```
POST /api/webhooks/clip-ready
{
  "videoId": "xdFdQNq7vAw",
  "clips": [...],
  "timestamp": "2026-06-12T10:30:00Z"
}
```

---

## API Versioning
Currently on **v0** (development). No versioning in URLs yet.

Future: `/api/v1/download`, `/api/v2/download`, etc.
