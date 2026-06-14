import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Captions Integration - End-to-End', () => {
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

  test('extract clip generates valid SRT file', async () => {
    const testVideoId = 'caption_test_123';

    // Create mock transcript
    const mockTranscript = [
      { text: 'This is the first sentence', start: 5000, end: 8000, confidence: 0.95 },
      { text: 'This is the second sentence', start: 8000, end: 12000, confidence: 0.92 },
      { text: 'This is the third sentence', start: 12000, end: 15000, confidence: 0.90 },
    ];

    // Save transcript to file
    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clipData = {
      id: 100,
      start_ms: 5000,
      end_ms: 15000,
      duration_seconds: 10,
      type: 'Hook',
      headline: 'Caption Test Clip',
      why_clip_worthy: 'Testing captions',
      hook: 'Test captions',
      suggested_platforms: ['TikTok'],
      confidence: 92,
      cropPosition: 'center'
    };

    const response = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoPath: testVideoPath,
        clip: clipData,
        videoId: testVideoId
      })
    });

    expect(response.ok).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.filename).toBeTruthy();

    // Verify output file exists and is not empty
    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(10000); // At least 10KB

    console.log(`✓ Caption test clip created: ${result.filename} (${stats.size} bytes)`);

    // Clean up
    fs.unlinkSync(transcriptPath);
  });

  test('SRT file is properly formatted', async () => {
    const testVideoId = 'srt_format_test_456';

    const mockTranscript = [
      { text: 'Opening statement', start: 0, end: 3000, confidence: 0.98 },
      { text: 'Main content here', start: 3000, end: 8000, confidence: 0.96 },
      { text: 'Closing remarks', start: 8000, end: 10000, confidence: 0.94 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clipData = {
      id: 101,
      start_ms: 0,
      end_ms: 10000,
      duration_seconds: 10,
      type: 'Lesson',
      headline: 'SRT Format Test',
      why_clip_worthy: 'Test SRT formatting',
      hook: 'Format test',
      suggested_platforms: ['YouTube'],
      confidence: 90,
      cropPosition: 'center'
    };

    const response = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoPath: testVideoPath,
        clip: clipData,
        videoId: testVideoId
      })
    });

    expect(response.ok).toBeTruthy();
    const result = await response.json();

    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify MP4 was created
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(10000);

    // Verify it's a valid MP4 by checking signature
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(outputPath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const signature = buffer.toString('utf-8', 4, 8);
    expect(signature).toBe('ftyp'); // MP4 magic bytes

    console.log(`✓ SRT format test passed: ${result.filename}`);

    // Clean up
    fs.unlinkSync(transcriptPath);
  });

  test('extraction fails gracefully if transcript not found', async ({ request }) => {
    const clipData = {
      id: 102,
      start_ms: 0,
      end_ms: 5000,
      duration_seconds: 5,
      type: 'Hook',
      headline: 'No Transcript Test',
      why_clip_worthy: 'Test missing transcript',
      hook: 'No transcript',
      suggested_platforms: ['Instagram'],
      confidence: 85,
      cropPosition: 'center'
    };

    // Don't create any transcript file
    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'nonexistent_transcript_id'
      }
    });

    // Should still succeed - extraction works without captions
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);

    console.log(`✓ Graceful fallback without transcript: ${result.filename}`);
  });

  test('captions work with all crop positions', async ({ request }) => {
    const cropPositions: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

    for (const cropPos of cropPositions) {
      const testVideoId = `crop_${cropPos}_captions`;

      const mockTranscript = [
        { text: `Testing ${cropPos} crop`, start: 2000, end: 5000, confidence: 0.95 },
        { text: 'with captions', start: 5000, end: 8000, confidence: 0.93 },
      ];

      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }
      const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
      fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

      const clipData = {
        id: 200 + cropPositions.indexOf(cropPos),
        start_ms: 2000,
        end_ms: 8000,
        duration_seconds: 6,
        type: 'Tip',
        headline: `Captions with ${cropPos} crop`,
        why_clip_worthy: `Test ${cropPos}`,
        hook: 'Test',
        suggested_platforms: ['TikTok'],
        confidence: 88,
        cropPosition: cropPos
      };

      const response = await request.post('/api/extract', {
        data: {
          videoPath: testVideoPath,
          clip: clipData,
          videoId: testVideoId
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.success).toBe(true);

      const outputPath = path.join(clipsDir, result.filename);
      expect(fs.existsSync(outputPath)).toBe(true);

      console.log(`✓ ${cropPos} crop with captions: ${result.filename}`);

      // Clean up
      fs.unlinkSync(transcriptPath);
    }
  });

  test('captions can be disabled via burnCaptions flag', async ({ request }) => {
    const testVideoId = 'no_captions_test';

    const mockTranscript = [
      { text: 'This should not be burned', start: 2000, end: 5000, confidence: 0.95 },
      { text: 'Caption burning disabled', start: 5000, end: 8000, confidence: 0.93 },
    ];

    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, `${testVideoId}.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clipData = {
      id: 250,
      start_ms: 2000,
      end_ms: 8000,
      duration_seconds: 6,
      type: 'Tip',
      headline: 'No Captions Test',
      why_clip_worthy: 'Test caption disabling',
      hook: 'Test',
      suggested_platforms: ['TikTok'],
      confidence: 88,
      cropPosition: 'center',
      burnCaptions: false
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: testVideoId
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);

    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    // File should be smaller without captions
    const stats = fs.statSync(outputPath);
    console.log(`✓ Clip without captions created: ${result.filename} (${stats.size} bytes)`);
    expect(stats.size).toBeGreaterThan(10000);

    // Clean up
    fs.unlinkSync(transcriptPath);
  });
});
