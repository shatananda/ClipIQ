import { AssemblyAI } from 'assemblyai';
import { Paragraph } from '../types';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export async function transcribeAudio(audioPath: string): Promise<Paragraph[]> {
  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: audioPath.startsWith('http') ? audioPath : `file://${audioPath}`,
    });

    const paragraphs = (transcript as any).paragraphs;
    if (!paragraphs || !Array.isArray(paragraphs)) {
      throw new Error('No paragraphs returned from AssemblyAI');
    }

    return paragraphs.map((p: any) => ({
      text: p.text || '',
      start: p.start || 0,
      end: p.end || 0,
      confidence: p.confidence || 0,
    }));
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw error;
  }
}
