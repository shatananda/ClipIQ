import { analyzeTranscript } from '@/lib/claude';
import { Paragraph } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { paragraphs, keywords } = await req.json();

    if (!paragraphs || !keywords) {
      return Response.json({ error: 'paragraphs and keywords required' }, { status: 400 });
    }

    const clips = await analyzeTranscript(paragraphs as Paragraph[], keywords as string[]);
    return Response.json({ success: true, clips });
  } catch (error) {
    logger.error('Analyze error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
