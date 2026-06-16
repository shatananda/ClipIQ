import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import { Paragraph } from '../types';
import { logger } from './logger';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export async function transcribeAudio(audioPath: string): Promise<Paragraph[]> {
  try {
    const audioBuffer = fs.readFileSync(audioPath);

    const transcript = await client.transcripts.transcribe({
      audio: audioBuffer,
    });

    // AssemblyAI returns words, combine into meaningful chunks (sentences/paragraphs)
    const words = (transcript as any).words || [];
    if (!words || words.length === 0) {
      // Fallback: use full transcript as single paragraph
      return [{
        text: (transcript as any).text || '',
        start: 0,
        end: ((transcript as any).duration || 0) * 1000,
        confidence: 0.9,
      }];
    }

    // Group words into paragraphs (every ~10-15 words or when there's a natural pause)
    const paragraphs: Paragraph[] = [];
    let currentParagraph: typeof words = [];
    let currentStart = 0;

    for (const word of words) {
      if (currentParagraph.length === 0) {
        currentStart = word.start || 0;
      }
      currentParagraph.push(word);

      // Break into paragraphs every 15 words or so
      if (currentParagraph.length >= 15) {
        const text = currentParagraph.map((w: any) => w.text).join(' ');
        const end = currentParagraph[currentParagraph.length - 1]?.end || currentStart;
        const avgConfidence = currentParagraph.reduce((sum: number, w: any) => sum + (w.confidence || 0), 0) / currentParagraph.length;

        paragraphs.push({
          text,
          start: currentStart,
          end,
          confidence: avgConfidence,
        });

        currentParagraph = [];
      }
    }

    // Add remaining words as final paragraph
    if (currentParagraph.length > 0) {
      const text = currentParagraph.map((w: any) => w.text).join(' ');
      const end = currentParagraph[currentParagraph.length - 1]?.end || currentStart;
      const avgConfidence = currentParagraph.reduce((sum: number, w: any) => sum + (w.confidence || 0), 0) / currentParagraph.length;

      paragraphs.push({
        text,
        start: currentStart,
        end,
        confidence: avgConfidence,
      });
    }

    return paragraphs.length > 0 ? paragraphs : [{
      text: words.map((w: any) => w.text).join(' '),
      start: words[0]?.start || 0,
      end: words[words.length - 1]?.end || 0,
      confidence: 0.9,
    }];
  } catch (error) {
    logger.error('AssemblyAI transcription error:', error);
    throw error;
  }
}
