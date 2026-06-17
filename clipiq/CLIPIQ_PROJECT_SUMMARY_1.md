# ClipIQ - YouTube Clip Suggester for Pure Ishvari

## Project Goal

Auto-analyze YouTube video transcripts to identify and suggest short-form clip opportunities for TikTok/Instagram Reels.

---

## Inputs

### AssemblyAI JSON Transcript
- Source: Existing Next.js app that calls AssemblyAI API
- Format: Full JSON response with `paragraphs` array
- Structure:
  ```json
  {
    "paragraphs": [
      {
        "text": "Full paragraph text here",
        "start": 340,
        "end": 8750,
        "confidence": 0.92
      }
    ]
  }
  ```
- Speaker: Single speaker (just Aparna)
- Quality: Fully punctuated, properly formatted paragraphs

### Website Keywords
Scraped from `pureishvari.com` to identify content themes:
- Product names (face oils, ghee, sacred jewelry, etc.)
- Ayurveda concepts (Vata, Pitta, Kapha, dosha, etc.)
- Service offerings (Vedic counseling, channeling, satsangam)
- Brand-specific terminology

---

## Process Flow

1. **Parse AssemblyAI JSON**
   - Extract paragraphs array
   - Convert millisecond timestamps to readable format (MM:SS)

2. **Scrape Keywords**
   - Fetch pureishvari.com
   - Extract product names, concepts, and offerings
   - Build keyword/concept list for prioritization

3. **Analyze with Claude**
   - Send transcript + timestamps + keywords to Claude API
   - Claude identifies moments that are:
     - Actionable (tips, practices, advice)
     - Quotable (wisdom, affirmations, spiritual messages)
     - Product-focused (demonstrations, benefits)
     - High-energy (emotional hooks)
     - Self-contained (15-60 sec clips)

4. **Generate Clip Suggestions**
   - Return structured list of clip opportunities
   - Include rationale, hooks, and metadata

---

## Outputs

### Clip Suggestion Structure

```json
{
  "clips": [
    {
      "id": 1,
      "start_ms": 3450,
      "end_ms": 4120,
      "duration_seconds": 27,
      "type": "Product Tip",
      "headline": "Rose Oil Morning Ritual",
      "why_clip_worthy": "Clear step-by-step, actionable, visual",
      "hook": "The first thing I do every morning is...",
      "suggested_platforms": ["TikTok", "Instagram Reels"],
      "confidence": 0.92
    },
    {
      "id": 2,
      "start_ms": 8200,
      "end_ms": 9050,
      "duration_seconds": 45,
      "type": "Dosha Advice",
      "headline": "Vata Energy Management",
      "why_clip_worthy": "Direct advice, relatable problem, solution",
      "hook": "If you're feeling scattered...",
      "suggested_platforms": ["TikTok", "Instagram Reels", "YouTube Shorts"],
      "confidence": 0.88
    }
  ]
}
```

### Clip Types to Identify
- **Product Tip** - Demonstrations, benefits, how-to
- **Dosha Advice** - Personalized wellness guidance (Vata/Pitta/Kapha)
- **Wisdom/Affirmation** - Spiritual quotes, life advice
- **Practice/Tutorial** - Step-by-step rituals, meditations
- **Q&A** - Direct question-and-answer moments
- **Behind-the-Scenes** - Product making, personal moments

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React / Next.js |
| AI Engine | Anthropic Claude API (claude-sonnet-4-6) |
| Web Scraping | Fetch API + HTML parsing |
| Input Method | JSON textarea paste |
| Output Format | Interactive table / JSON export |

---

## User Workflow

1. Run AssemblyAI transcription on video via existing Next.js app
2. Copy the JSON response
3. Paste into ClipIQ tool
4. Tool fetches website keywords and analyzes transcript
5. Review clip suggestions (timestamp, type, hook, platforms)
6. Copy timestamps → paste into CapCut for extraction
7. Extract and edit clips using CapCut

---

## Success Metrics

| Metric | Target | Value |
|--------|--------|-------|
| Time Saved Per Video | 45 min → 10 min | ~80% reduction |
| Clips Identified Per Video | 3-5 quality clips | Consistent |
| Upload Frequency | Weekly | Sustainable |
| Platforms Covered | TikTok + IG Reels | Both |

---

## Implementation Notes

### AssemblyAI Timestamps
- Provided in milliseconds (ms)
- Convert to MM:SS for user readability
- Use exact values for downstream tools (CapCut API if needed)

### Claude API Integration
- Model: `claude-sonnet-4-6`
- Max tokens: 1000 (summarized output)
- System prompt should emphasize:
  - Spiritual/wellness content analysis
  - Short-form platform suitability
  - Engagement potential
  - Hook/opening lines for social media

### Website Scraping
- Fetch `pureishvari.com` and key pages
- Parse product names, dosha references, service offerings
- Cache results (update weekly)
- Graceful fallback if scrape fails

---

## Future Enhancements

- Direct CapCut API integration (auto-create cuts)
- Batch processing (multiple videos at once)
- Performance metrics (track which clip types perform best)
- Scheduling integration (post clips automatically)
- Custom keyword profiles per creator
- A/B testing suggestions (different hooks for same clip)

---

## Project Status

**Phase:** Development  
**Owner:** Noel (fusionSpan)  
**Client:** Aparna Khanolkar / Pure Ishvari  
**Video Upload Frequency:** 1 per week
