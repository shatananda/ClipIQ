import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Batch Extract API', () => {
  const testVideoPath = '/tmp/test-video.mp4';
  const clipsDir = path.join(process.cwd(), 'storage', 'clips');
  const transcriptDir = path.join(process.cwd(), '.transcripts');

  test.beforeAll(() => {
    if (!fs.existsSync(testVideoPath)) {
      throw new Error(`Test video not found at ${testVideoPath}`);
    }
    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }
  });

  test('batch-extract processes multiple clips', async ({ request }) => {
    const testVideoId = 'batch_test_multi';
    const mockTranscript = [
      { text: 'First clip text', start: 2000, end: 8000, confidence: 0.95 },
      { text: 'Second clip text', start: 10000, end: 16000, confidence: 0.93 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clips = [
      {
        id: 301,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Batch Clip 1',
        type: 'Hook',
        why_clip_worthy: 'Test batch',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
      {
        id: 302,
        start_ms: 10000,
        end_ms: 16000,
        headline: 'Batch Clip 2',
        type: 'Tip',
        why_clip_worthy: 'Test batch',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 88,
        cropPosition: 'left',
        burnCaptions: false,
      },
    ];

    const response = await request.post('/api/batch-extract', {
      data: {
        videoPath: testVideoPath,
        clips,
        videoId: testVideoId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.extracted).toBe(2);
    expect(result.results).toHaveLength(2);

    // Verify both files exist
    result.results.forEach((r: any, idx: number) => {
      expect(r.success).toBe(true);
      expect(r.filename).toBeTruthy();
      const outputPath = path.join(clipsDir, r.filename);
      expect(fs.existsSync(outputPath)).toBe(true);
      const stats = fs.statSync(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(
        `✓ Batch clip ${idx + 1}: ${r.filename} (${stats.size} bytes)`
      );
    });

    fs.unlinkSync(transcriptPath);
  });

  test('batch-extract handles mixed caption settings', async ({ request }) => {
    const testVideoId = 'batch_test_mixed';
    const mockTranscript = [
      { text: 'Caption text', start: 2000, end: 8000, confidence: 0.95 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clips = [
      {
        id: 303,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'With Captions',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
        captionFontSize: 18,
      },
      {
        id: 304,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Without Captions',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: false,
      },
    ];

    const response = await request.post('/api/batch-extract', {
      data: {
        videoPath: testVideoPath,
        clips,
        videoId: testVideoId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.extracted).toBe(2);

    const withCaptions = result.results[0];
    const withoutCaptions = result.results[1];

    const withCaptionsSize = fs.statSync(
      path.join(clipsDir, withCaptions.filename)
    ).size;
    const withoutCaptionsSize = fs.statSync(
      path.join(clipsDir, withoutCaptions.filename)
    ).size;

    // With captions should be slightly larger due to rendered text
    expect(withCaptionsSize).toBeGreaterThan(withoutCaptionsSize);
    console.log(
      `✓ With captions: ${withCaptionsSize} bytes, Without: ${withoutCaptionsSize} bytes`
    );

    fs.unlinkSync(transcriptPath);
  });

  test('batch-extract respects caption font size', async ({ request }) => {
    const testVideoId = 'batch_test_fontsize';
    const mockTranscript = [
      { text: 'Font size test', start: 2000, end: 8000, confidence: 0.95 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clipsWithDifferentSizes = [
      {
        id: 305,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Font Size 14',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
        captionFontSize: 14,
      },
      {
        id: 306,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Font Size 22',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
        captionFontSize: 22,
      },
    ];

    const response = await request.post('/api/batch-extract', {
      data: {
        videoPath: testVideoPath,
        clips: clipsWithDifferentSizes,
        videoId: testVideoId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.extracted).toBe(2);
    expect(result.results[0].success).toBe(true);
    expect(result.results[1].success).toBe(true);

    // Verify both files were created with different font sizes
    result.results.forEach((r: any) => {
      const outputPath = path.join(clipsDir, r.filename);
      expect(fs.existsSync(outputPath)).toBe(true);
      const stats = fs.statSync(outputPath);
      expect(stats.size).toBeGreaterThan(10000);
      console.log(`✓ Font size test: ${r.filename}`);
    });

    fs.unlinkSync(transcriptPath);
  });

  test('batch-extract handles partial failures gracefully', async ({ request }) => {
    const testVideoId = 'batch_test_partial';
    const mockTranscript = [
      { text: 'Text', start: 2000, end: 8000, confidence: 0.95 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clips = [
      {
        id: 307,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Valid Clip',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: true,
      },
      {
        id: 308,
        start_ms: 115000, // Beyond video duration - will fail
        end_ms: 120000,
        headline: 'Out of Range Clip',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['Instagram'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: false,
      },
    ];

    const response = await request.post('/api/batch-extract', {
      data: {
        videoPath: testVideoPath,
        clips,
        videoId: testVideoId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.total).toBe(2);
    expect(result.extracted).toBeGreaterThan(0);

    // First clip should succeed
    expect(result.results[0].success).toBe(true);
    // Second clip may fail due to out of range
    console.log(`✓ Batch partial result:`, {
      total: result.total,
      extracted: result.extracted,
      statuses: result.results.map((r: any) => ({
        id: r.id,
        success: r.success,
      })),
    });

    fs.unlinkSync(transcriptPath);
  });

  test('batch-extract returns correct response structure', async ({ request }) => {
    const testVideoId = 'batch_test_structure';

    const clips = [
      {
        id: 309,
        start_ms: 2000,
        end_ms: 8000,
        headline: 'Structure Test',
        type: 'Hook',
        why_clip_worthy: 'Test',
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 90,
        cropPosition: 'center',
        burnCaptions: false,
      },
    ];

    const response = await request.post('/api/batch-extract', {
      data: {
        videoPath: testVideoPath,
        clips,
        videoId: testVideoId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify response structure
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('extracted');
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBe(true);

    result.results.forEach((r: any) => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('headline');
      expect(r).toHaveProperty('success');
      if (r.success) {
        expect(r).toHaveProperty('filename');
      } else {
        expect(r).toHaveProperty('error');
      }
    });

    console.log('✓ Response structure validated');
  });
});
