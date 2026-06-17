# ClipIQ Features

## Core Features

### 1. YouTube Video Analysis
- ✅ Download videos from YouTube links
- ✅ Support for playlist items and channel videos (via yt-dlp)
- ✅ Automatic video metadata extraction (title, duration)
- ✅ Video validation before processing
- ✅ Support for videos up to 30 minutes

### 2. Audio Transcription
- ✅ Automatic audio extraction using FFmpeg
- ✅ High-accuracy transcription via AssemblyAI
- ✅ Timestamp-accurate paragraphing (15-word chunks)
- ✅ Confidence scoring for each word/paragraph
- ✅ Support for multiple languages (configurable)

### 3. AI-Powered Clip Analysis
- ✅ Claude Sonnet 4.6 for intelligent clip suggestions
- ✅ 3-7+ clip suggestions per video (unlimited)
- ✅ Clip type classification:
  - Product Tip
  - Dosha Advice
  - Wisdom/Affirmation
  - Practice/Tutorial
  - Q&A
  - Behind-the-Scenes
- ✅ Engagement hook generation for each clip
- ✅ Platform-specific optimization (TikTok, Instagram Reels, YouTube Shorts)
- ✅ Confidence scoring (0-100%)
- ✅ Why-it's-clip-worthy explanations

### 4. Clip Extraction
- ✅ Extract clips as 1080x1920 MP4 videos
- ✅ Vertical format optimization for mobile
- ✅ Automatic aspect ratio correction
- ✅ Multiple codec options (H.264, AAC)
- ✅ Fast encoding (preset: fast)
- ✅ Per-clip extraction on demand

### 5. Keyword Management
- ✅ Pre-loaded keyword list (Pure Ishvari: 50+ wellness keywords)
- ✅ Add custom keywords
- ✅ Delete keywords
- ✅ Toggle keyword inclusion/exclusion
- ✅ Keyword-based clip filtering (Claude considers keywords)
- ✅ Persistent keyword cache in JSON
- ✅ Keyword drawer UI for easy management

### 6. Review & Selection Interface
- ✅ Browse all suggested clips
- ✅ Accept clips for extraction
- ✅ Decline unwanted clips
- ✅ Real-time clip status tracking
- ✅ Accept count badge
- ✅ Analyze another video option

### 7. Download & Export
- ✅ Download extracted clips as MP4
- ✅ Auto-generated filenames with clip ID and headline
- ✅ Batch download capability
- ✅ Direct browser download
- ✅ Video file streaming

## User Interface

### Home Page
- ✅ YouTube URL input field
- ✅ Disabled/enabled Analyze button (based on URL)
- ✅ Keyword drawer with expandable list
- ✅ Processing progress indicator
- ✅ Real-time stage updates (Downloading → Transcribing → Analyzing)

### Review Page
- ✅ Video title and metadata display
- ✅ Clip card layout with:
  - Dark header with type badge
  - Headline (prominent, large)
  - Hook/quote (italicized)
  - Why-clip-worthy explanation
  - Metadata grid: timestamp, confidence bar, best platforms
  - Accept/Decline/Extract buttons
- ✅ Proceed to Summary button
- ✅ Analyze Another Video button
- ✅ Clip count indicator

### Summary Page
- ✅ List of accepted clips
- ✅ Download buttons for each clip
- ✅ Clip metadata display
- ✅ Analyze Another Video option
- ✅ Clear session state on navigation

## Design System

### Colors
- Primary: Indigo (#5b6cf6)
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Background: White (#ffffff)
- Background Accent: Light Gray (#f7f9fc)
- Text: Dark Gray (#1a1f36)
- Text Light: Medium Gray (#6b7280)
- Border: Light Gray (#e5e7eb)

### Typography
- System font stack (SF Pro Display, Segoe UI, etc.)
- Font sizes: 11px (labels) to 32px (hero headline)
- Font weights: 400 (regular) to 700 (bold)

### Components
- Cards with 1px borders, soft shadows, 10px corners
- Buttons with hover effects, 8px corners
- Input fields with focus glow effect
- Grid layouts for metadata
- Smooth transitions (150ms)

## Advanced Features

### Session Management
- ✅ sessionStorage for clip state
- ✅ Persistent state across page navigation
- ✅ Auto-redirect if no state available
- ✅ Session clearing on new analysis

### Error Handling
- ✅ API error messages displayed to user
- ✅ Network error detection
- ✅ Graceful fallbacks
- ✅ Console logging for debugging
- ✅ User-friendly alert messages

### Performance Optimization
- ✅ Lazy loading of components
- ✅ Efficient state management
- ✅ Optimized video extraction (fast preset)
- ✅ Browser-side clip acceptance (no server round trip)
- ✅ Parallel API calls where possible

### Testing
- ✅ E2E tests with Playwright
- ✅ 11 test cases covering full pipeline
- ✅ Form validation tests
- ✅ API health checks
- ✅ Navigation tests
- ✅ Video processing tests

## Configuration & Customization

### Keyword Sources
- Current: keywords.json (Pure Ishvari wellness)
- Extensible: Can add more keywords dynamically
- Per-video filtering: Each analysis can use different keyword sets

### Claude Prompt
- Located: `src/lib/claude.ts`
- Configurable: Clip types, prompt structure, output format
- Extensible: Add custom clip classifications

### Video Processing
- Located: `src/lib/ffmpeg.ts`
- Configurable: Video codec, bitrate, quality
- Extensible: Add watermarking, effects, overlays

### Storage Location
- Default: `./storage/`
- Configurable: `STORAGE_PATH` environment variable
- Subdirectories: videos, audio, clips

## Data Formats

### Paragraph (Transcription)
```typescript
{
  text: string;           // 15-word paragraph
  start: number;          // Start timestamp in milliseconds
  end: number;            // End timestamp in milliseconds
  confidence: number;     // 0-1 confidence score
}
```

### ClipSuggestion (Analysis Output)
```typescript
{
  id: number;
  start_ms: number;
  end_ms: number;
  duration_seconds: number;
  type: string;
  headline: string;
  why_clip_worthy: string;
  hook: string;
  suggested_platforms: string[];
  confidence: number;
}
```

## Roadmap

### Planned Features
- [ ] Multiple language support (auto-detect language)
- [ ] Custom clip templates
- [ ] Clip editing UI (trim, effects)
- [ ] Bulk analysis (multiple videos)
- [ ] Clip analytics (view counts, engagement)
- [ ] Social media auto-publishing
- [ ] Custom watermarks
- [ ] Thumbnail generation
- [ ] Multi-platform scheduling

### Future Enhancements
- [ ] Support for TikTok, Instagram, Twitch uploads
- [ ] User authentication & accounts
- [ ] Cloud storage integration (S3, GCS)
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API for programmatic access
- [ ] Webhooks for CI/CD integration
- [ ] Real-time WebSocket updates

### Technical Debt
- [ ] Migrate to Tailwind CSS (currently inline styles)
- [ ] Add React hooks testing library
- [ ] Implement Redux for state management
- [ ] Add error boundary components
- [ ] Improve type safety with stricter tsconfig
- [ ] Add storybook for component documentation

## Limitations & Constraints

### Current Limitations
- YouTube only (extend to other platforms)
- English transcription only (add language param)
- Synchronous processing (add job queue for scale)
- Single-user (no authentication)
- Local storage only (add database)
- No clip editing capabilities
- Fixed vertical format (1080x1920)

### Performance Constraints
- ~40 seconds per video (depends on video length)
- Transcription accuracy depends on audio quality
- Clip quality depends on source video quality
- API rate limits (Claude, AssemblyAI)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Semantic HTML
- ARIA labels on buttons
- Keyboard navigation support
- Focus indicators
- Color contrast compliance (WCAG AA)

## Security

- Environment variables for API keys
- No password storage (stateless)
- CSRF protection via Next.js
- Content Security Policy ready
- XSS protection via React
- SQL injection not applicable (no database)

## Monitoring & Observability

### Current
- Console logging in browser and dev server
- Error alerts to user
- Test coverage with E2E tests

### Recommended
- Add Sentry for error tracking
- Add LogRocket for session replay
- Add Google Analytics for usage metrics
- Add health check endpoint
- Add APM for performance monitoring
