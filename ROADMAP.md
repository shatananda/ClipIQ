# ClipIQ Roadmap: Future Enhancements

**Status:** Phase 1 (OAuth + Video Browser + Time Adjustment) in progress. This document captures Phase 2-5 for future implementation.

---

## Phase 1: Core Platform ✅ IN PROGRESS
**Status:** Development complete, testing locally, preparing for Vercel deployment

### Features
- YouTube OAuth authentication
- Video browser with pagination (10/25/50 per page)
- Video detail modal with metadata
- Configure page for clip settings (captions, font size, crop)
- Clip time adjustment with sliders + text inputs
- Status tracking (Analyzed / Clipped badges)
- Logout button

### Acceptance Criteria
- [ ] OAuth login flow works end-to-end (Google → redirect → /videos)
- [ ] Video list loads and paginates correctly
- [ ] Time adjustment UI works (sliders + text inputs sync)
- [ ] Clips extract with adjusted times
- [ ] Status badges persist across sessions
- [ ] Deployed to Vercel without errors
- [ ] All E2E tests pass

### Timeline
- Local testing: **THIS WEEK**
- Vercel deployment: **ASAP after local validation**
- Production sign-off: **After Apu tests 2-3 videos live**

---

## Phase 1.5: Private Video Download Support
**Effort:** Low | **Estimated Time:** 1-2 hours | **Priority:** High (workflow enabler)

### Problem
Apu needs to test ClipIQ on private videos before publishing. This enables a safer workflow: create video → leave private → analyze with ClipIQ → gather intelligence on optimization → then publish.

### Features
- Pass OAuth `accessToken` to `play-dl` library for authenticated downloads
- Enable private video stream access (user must own/have permission to view)
- Maintain full Phase 1 functionality for private videos (time adjustment, status tracking, etc.)

### Implementation Steps
1. Modify `src/lib/ytdlp.ts`:
   - Accept optional `accessToken` parameter in `downloadVideo(url, accessToken?)`
   - Pass token to `play-dl` options if provided
   
2. Modify `src/app/api/download/route.ts`:
   - Extract `accessToken` from session
   - Pass to `downloadVideo()` call

3. Test:
   - Create private test video
   - Authenticate as owner
   - Download private video successfully
   - Verify clips extract correctly from private content

### Workflow
1. Apu creates video, leaves it **private**
2. Logs into ClipIQ with her YouTube account
3. Selects private video from her channel
4. Configures settings and analyzes
5. Reviews AI-suggested clips and adjusts timing
6. **During review phase**, gathers intelligence from Phase 2-5 features (metadata suggestions, engagement predictions, thumbnail guidance, playlist strategy)
7. Uses insights to optimize video
8. Publishes video publicly
9. Returns to ClipIQ to download final clips

### Acceptance Criteria
- [ ] Private videos appear in video browser (owned by authenticated user)
- [ ] Private video downloads work with OAuth token
- [ ] Clips extract correctly from private content
- [ ] No change to public video download behavior
- [ ] Session token properly passed through API layer

---

## Phase 2: Metadata Intelligence
**Effort:** Low | **Estimated Time:** 4-6 hours | **Priority:** High (quick ROI)

### Problem
Apu optimizes video titles/descriptions manually. We can suggest these automatically from transcript analysis.

### Features

#### 2.1 Title Optimization
- Analyze current title for keyword presence, clarity, CTR potential
- Suggest 3 alternative titles ranked by SEO strength
- Identify if primary keyword is front-loaded
- Score CTR likelihood (1-10 scale)
- Front-load strongest performing keywords

**Implementation:**
1. Add new Claude prompt in `src/lib/claude.ts` (or new file `src/lib/youtube-optimizer.ts`)
2. Call existing transcript data (no re-processing needed)
3. Output: `{ suggestions: [{title: string, ctrScore: number, reason: string}] }`
4. Add "Title Suggestions" card to `/review` page

**Acceptance Criteria:**
- [ ] Claude returns 3 title options with scores
- [ ] Suggestions differ meaningfully from current title
- [ ] UI shows suggestions on review page
- [ ] Apu can copy suggested title to clipboard

#### 2.2 Tag Recommendations
- Extract 8-10 relevant tags from transcript analysis
- Classify as high-volume vs. long-tail
- Rank by relevance to Pure Ishvari content

**Implementation:**
1. Extend Claude prompt to include tag extraction
2. Output: `{ tags: [{tag: string, volume: 'high'|'medium'|'low', confidence: number}] }`
3. Add "Recommended Tags" section to review

**Acceptance Criteria:**
- [ ] Tags are relevant to transcript content
- [ ] Mix of high-volume and long-tail keywords
- [ ] User can copy tags to clipboard

#### 2.3 Description Template
- Suggest structure: Hook → Summary → Keywords → Links → CTAs
- Generate a template with placeholders Apu can fill
- Recommend where to add timestamps/chapters

**Implementation:**
1. Claude returns description template with sections
2. Show on `/review` page with copy-to-clipboard
3. Include chapter timestamps from transcript analysis

**Acceptance Criteria:**
- [ ] Template structure matches YouTube best practices
- [ ] Chapter timestamps are accurate (pull from transcript)
- [ ] Template is ready to paste into YouTube

---

## Phase 3: Engagement & Retention Analysis
**Effort:** Medium | **Estimated Time:** 8-10 hours | **Priority:** Medium (high value, moderate effort)

### Problem
We know where clips are, but not where viewers might drop off or where engagement moments are.

### Features

#### 3.1 Content Structure Feedback
- Identify "hook windows" in first 30 seconds
- Flag dense blocks (retention risk)
- Suggest natural chapter/breakpoint positions
- Identify Q&A sections, stories, high-engagement moments

**Implementation:**
1. Analyze transcript pacing (word density per segment)
2. Claude identifies pacing issues and strong moments
3. Output: `{ hooks: [], riskAreas: [], strongMoments: [], suggestedChapters: [] }`
4. Show on `/review` page with timeline visualization

**Acceptance Criteria:**
- [ ] Hook identification happens in first 30 seconds
- [ ] Risk areas flagged with reasons
- [ ] Chapter suggestions are natural breakpoints
- [ ] UI shows timeline with visual markers

#### 3.2 CTA Opportunities
- Recommend where to add "like/comment/subscribe" CTAs
- Suggest what questions to ask to drive comments
- Flag moments perfect for "try this" CTAs

**Implementation:**
1. Claude identifies emotional/peak moments
2. Suggest CTA type + specific wording
3. Output: `{ ctas: [{timestamp: string, type: string, suggestion: string}] }`
4. Show as overlays on clip timeline

**Acceptance Criteria:**
- [ ] CTAs placed at high-engagement moments
- [ ] Suggestions are specific (not generic)
- [ ] Apu can preview CTA placement on timeline

---

## Phase 4: YouTube Analytics Integration
**Effort:** High | **Estimated Time:** 12-16 hours | **Priority:** High (unlocks real intelligence)

### Problem
Generic advice is useless. Channel-specific data (CTR, retention, traffic sources) transforms advice into intelligence.

### Features

#### 4.1 Channel Performance Dashboard
- Pull last 30 videos' CTR, average view duration, impressions
- Show trends: improving or declining?
- Identify best-performing content type/length

**Implementation:**
1. Add YouTube Analytics API v4 integration (`src/lib/youtube-analytics.ts`)
2. New endpoint: `/api/youtube/analytics/channel` (protected by OAuth)
3. Cache analytics for 24 hours
4. Show on new "Channel Dashboard" page

**Acceptance Criteria:**
- [ ] Analytics data loads without errors
- [ ] Trends visualized clearly
- [ ] Data updates fresh when user clicks "Refresh"

#### 4.2 Video-Specific Predictions
- Compare this video's structure to top performers
- Predict likely retention curve based on past videos
- Flag if this video is outlier (different length/style)

**Implementation:**
1. Fetch video-specific analytics (if published)
2. Compare transcript structure to historical videos
3. Output: `{ predictedRetention: number, riskFactors: [], opportunities: [] }`
4. Show on `/review` page with historical comparison

**Acceptance Criteria:**
- [ ] Predictions based on actual channel data (not generic)
- [ ] Compares to similar historical videos
- [ ] Confidence score on predictions

#### 4.3 Traffic Source Intelligence
- Show where most viewers come from (search, suggested, browse)
- Recommend if video should optimize for search vs. suggested
- Suggest playlist strategy based on traffic patterns

**Implementation:**
1. Pull traffic sources from Analytics API
2. Claude analyzes which clips matter most for traffic goal
3. Output: `{ trafficStrategy: string, priorityClips: number[] }`

**Acceptance Criteria:**
- [ ] Traffic source data is accurate
- [ ] Strategy recommendations match data
- [ ] Clips ranked by importance for traffic goal

---

## Phase 5: Advanced Optimization
**Effort:** Medium | **Estimated Time:** 6-8 hours | **Priority:** Low (nice-to-have)

### Features

#### 5.1 Thumbnail Guidance
- Identify 3 "iconic moments" from transcript
- Suggest visual themes (product? emotion? before/after?)
- Text overlay suggestions ("New", "Exposed", "3 Tips")

**Implementation:**
1. Claude suggests moments + themes
2. Output: `{ iconicMoments: [{timestamp, description, theme}] }`
3. Show on `/review` → user manually creates thumbnail

**Acceptance Criteria:**
- [ ] Moment suggestions are visually distinct
- [ ] Themes match video content
- [ ] Text overlay suggestions are compelling

#### 5.2 Playlist Strategy
- Group this video with similar past content
- Suggest series/playlists to increase session watch time
- Recommend best order for playlist

**Implementation:**
1. Analyze transcript against existing videos
2. Find thematic matches
3. Output: `{ suggestedPlaylists: [], newPlaylistIdea: string }`

**Acceptance Criteria:**
- [ ] Playlist grouping makes sense thematically
- [ ] Video order logical
- [ ] Session watch time optimization clear

#### 5.3 Cross-Promotion Checklist
- Which Reddit/Discord communities to share in
- LinkedIn angle (if applicable)
- Email newsletter angle
- TikTok/Instagram repurposing strategy

**Implementation:**
1. Analyze video topic
2. Claude suggests communities + angles
3. Output: `{ channels: [{platform: string, angle: string, example: string}] }`

**Acceptance Criteria:**
- [ ] Suggestions are specific to video topic
- [ ] Not generic (actual communities, not just "Reddit")
- [ ] Actionable for Apu to execute

---

## Execution Strategy

### Timeline
- **Phase 1:** NOW (local testing → Vercel deployment)
- **Phase 2:** 1-2 weeks after Phase 1 live (quick wins while Apu uses Phase 1)
- **Phase 3:** 3-4 weeks after Phase 1 (build on engagement data)
- **Phase 4:** Month 2 (requires stable Phase 1 + analytics API setup)
- **Phase 5:** Month 2-3 (lower priority, can parallelize with Phase 4)

### Claude Token Budget
- **Phase 1:** 1 call per video (~500 tokens for clips)
- **Phase 2:** +1 call (~800 tokens for metadata/tags/description)
- **Phase 3:** +0.5 call (reuse phase 2 output, extract engagement)
- **Phase 4:** +0 calls (YouTube API, not Claude)
- **Phase 5:** +1 call (~400 tokens for thumbnail/playlist/promotion)

**Total increase:** ~2000 tokens per video (from 500 to 2500) — acceptable.

### Database/Storage Needed
Add to `ClipIQState`:
```typescript
optimization?: {
  metadata?: {
    titleSuggestions: Array<{text: string, ctrScore: number}>;
    tagSuggestions: Array<{tag: string, volume: string}>;
    descriptionTemplate: string;
  };
  engagement?: {
    hooks: Array<{timestamp: string}>;
    riskAreas: Array<{timestamp: string, reason: string}>;
    ctas: Array<{timestamp: string, type: string}>;
  };
  analytics?: {
    predictedRetention: number;
    trafficStrategy: string;
  };
  advanced?: {
    iconicMoments: Array<{timestamp: string, theme: string}>;
    playlists: Array<{name: string, reason: string}>;
  };
};
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude token costs escalate | Monitor token usage; Phase 2-3 can share Claude calls |
| Analytics API quota limits | Cache aggressively; YouTube Analytics has generous limits |
| Overwhelming Apu with options | Progressive disclosure: show only top 3 suggestions per category |
| Metadata recommendations are off-brand | Review Phase 2 output manually before shipping; Apu provides brand guidelines |

---

## Success Metrics (Per Phase)

### Phase 1
- Zero auth errors in Vercel
- Video list loads in <2s
- Time adjustment prevents caption cutoff
- Apu successfully uploads 3 videos using new flow

### Phase 2
- Title suggestions match Apu's actual improvements
- Tag suggestions reduce manual tagging time by 50%
- Apu uses descriptions in 80%+ of videos

### Phase 3
- CTA suggestions placed at actual engagement peaks
- Apu reports feeling more confident about pacing
- Chapter suggestions reduce manual chapter creation

### Phase 4
- Predictions within 10% of actual retention
- Analytics data influences Apu's editing decisions
- Apu identifies new traffic opportunities

### Phase 5
- Thumbnail themes improve CTR (A/B test)
- Playlists increase session watch time (YouTube Analytics)
- Cross-promotion effort drops 30% via checklist

---

## Decision Gate: Phase 2 Kickoff
Before starting Phase 2, confirm:
- [ ] Phase 1 deployed and working in production
- [ ] Apu has used it for 2-3 videos without issues
- [ ] No critical bugs blocking Phase 2
- [ ] Token budget acceptable (monitor actual usage)
- [ ] Apu feedback indicates metadata recommendations are highest priority

