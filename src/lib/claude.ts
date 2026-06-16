import Anthropic from '@anthropic-ai/sdk';
import { Paragraph, ClipSuggestion } from '../types';
import { logger } from './logger';
import JSON5 from 'json5';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeTranscript(paragraphs: Paragraph[], keywords: string[]): Promise<ClipSuggestion[]> {
  try {
    const transcriptText = paragraphs.map((p) => `[${formatTime(p.start)}-${formatTime(p.end)}] ${p.text}`).join('\n\n');

    const prompt = `You are an expert at identifying short-form video clip opportunities from transcripts for platforms like TikTok, Instagram Reels, and YouTube Shorts.

Analyze this transcript and identify every good clip opportunity (no limit). For each clip:
1. Identify the exact start and end timestamps (in milliseconds)
2. Classify the clip type (Product Tip, Dosha Advice, Wisdom/Affirmation, Practice/Tutorial, Q&A, Behind-the-Scenes)
3. Create an engaging headline
4. Explain why it's clip-worthy
5. Provide an opening hook/line
6. Suggest which platforms it suits (based on duration: TikTok ≤10min, IG Reels ≤90sec, YT Shorts ≤60sec)
7. Rate confidence 0-100%

Key themes to emphasize: ${keywords.join(', ')}

CRITICAL: Return ONLY a valid JSON object (no markdown, no backticks, no extra text before or after).
All property names and string values must use DOUBLE QUOTES. No single quotes. No trailing commas.
Valid JSON structure only:
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

    logger.info('📊 Calling Claude API with', paragraphs.length, 'paragraphs');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    logger.debug('✓ Claude response received, length:', rawText.length);

    // Strip markdown code fences if present
    let cleanedText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    // Fix common JSON issues
    try {
      // Try to parse as-is first
      const parsed = JSON.parse(cleanedText);
      logger.info('✓ Parsed', parsed.clips?.length || 0, 'clips');
      return parsed.clips || [];
    } catch (parseError) {
      logger.debug('Initial JSON parse failed, attempting to fix formatting...');

      // Strategy 1: Fix single quotes to double quotes
      let fixedText = cleanedText.replace(/'/g, '"');
      try {
        const parsed = JSON.parse(fixedText);
        logger.info('✓ Parsed (after quote fix)', parsed.clips?.length || 0, 'clips');
        return parsed.clips || [];
      } catch (e2) {
        logger.debug('Quote fix failed, trying trailing comma removal...');

        // Strategy 2: Remove trailing commas
        fixedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
        try {
          const parsed = JSON.parse(fixedText);
          logger.info('✓ Parsed (after comma fix)', parsed.clips?.length || 0, 'clips');
          return parsed.clips || [];
        } catch (e3) {
          logger.debug('Comma fix failed, trying to fix unterminated strings...');

          // Strategy 3: Fix unterminated strings by closing them before comma/bracket
          fixedText = cleanedText.replace(/: "([^"]*?)(?=[,\}\]])/g, ': "$1"');
          try {
            const parsed = JSON.parse(fixedText);
            logger.info('✓ Parsed (after string termination fix)', parsed.clips?.length || 0, 'clips');
            return parsed.clips || [];
          } catch (e4) {
            logger.debug('String fix failed, extracting JSON object...');

            // Strategy 4: Try JSON5 parser (lenient)
            try {
              const parsed = JSON5.parse(cleanedText);
              logger.info('✓ Parsed (JSON5)', parsed.clips?.length || 0, 'clips');
              return parsed.clips || [];
            } catch (e5) {
              logger.debug('JSON5 parse failed, extracting JSON object...');

              // Strategy 5: Extract JSON object if wrapped in text
              const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON5.parse(jsonMatch[0]);
                  logger.info('✓ Parsed (extracted + JSON5)', parsed.clips?.length || 0, 'clips');
                  return parsed.clips || [];
                } catch (e6) {
                  logger.error('Failed to parse extracted JSON after all recovery attempts');
                  throw parseError;
                }
              }
              throw parseError;
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('❌ AI analysis error:', error);
    throw error;
  }
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
