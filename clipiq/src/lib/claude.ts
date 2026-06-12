import Anthropic from '@anthropic-ai/sdk';
import { Paragraph, ClipSuggestion } from '../types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeTranscript(paragraphs: Paragraph[], keywords: string[]): Promise<ClipSuggestion[]> {
  try {
    const transcriptText = paragraphs.map((p) => `[${formatTime(p.start)}-${formatTime(p.end)}] ${p.text}`).join('\n\n');

    const prompt = `You are an expert at identifying short-form video clip opportunities from transcripts for platforms like TikTok, Instagram Reels, and YouTube Shorts.

Analyze this transcript and suggest 3-7 clip opportunities. For each clip:
1. Identify the exact start and end timestamps (in milliseconds)
2. Classify the clip type (Product Tip, Dosha Advice, Wisdom/Affirmation, Practice/Tutorial, Q&A, Behind-the-Scenes)
3. Create an engaging headline
4. Explain why it's clip-worthy
5. Provide an opening hook/line
6. Suggest which platforms it suits (based on duration: TikTok ≤10min, IG Reels ≤90sec, YT Shorts ≤60sec)
7. Rate confidence 0-100%

Key themes to emphasize: ${keywords.join(', ')}

Return ONLY valid JSON, no markdown, no code fences:
{
  "clips": [
    {
      "id": 1,
      "start_ms": 3450,
      "end_ms": 4120,
      "duration_seconds": 27,
      "type": "Product Tip",
      "headline": "...",
      "why_clip_worthy": "...",
      "hook": "...",
      "suggested_platforms": ["TikTok", "Instagram Reels"],
      "confidence": 92
    }
  ]
}

Transcript:
${transcriptText}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip markdown code fences if present
    let cleanedText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    const parsed = JSON.parse(cleanedText);
    return parsed.clips || [];
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
