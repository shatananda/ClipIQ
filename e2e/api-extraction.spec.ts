import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('API Extraction - End-to-End', () => {
  const testVideoPath = '/tmp/test-video.mp4';
  const clipsDir = path.join(process.cwd(), 'storage', 'clips');

  test.beforeAll(() => {
    // Ensure test video exists
    if (!fs.existsSync(testVideoPath)) {
      throw new Error(`Test video not found at ${testVideoPath}. Run: ffmpeg -f lavfi -i testsrc=size=1280x720:duration=120 -f lavfi -i sine=f=440:duration=120 -c:v libx264 -preset ultrafast -c:a aac -y ${testVideoPath}`);
    }

    // Ensure clips directory exists
    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
    }

    // Clean up old test clips
    const files = fs.readdirSync(clipsDir);
    files.forEach(file => {
      if (file.startsWith('test_clip_')) {
        fs.unlinkSync(path.join(clipsDir, file));
      }
    });
  });

  test('extract clip with center crop position', async ({ request }) => {
    const clipData = {
      id: 1,
      start_ms: 5000,
      end_ms: 15000,
      duration_seconds: 10,
      type: 'Hook',
      headline: 'Test Center Crop',
      why_clip_worthy: 'Testing extraction',
      hook: 'Test clip',
      suggested_platforms: ['TikTok'],
      confidence: 90,
      cropPosition: 'center'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'testVid123'
      }
    });

    if (!response.ok()) {
      const error = await response.text();
      console.error('API Error:', response.status(), error);
    }
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.filename).toBeTruthy();

    // Verify output file exists
    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify file size is reasonable (not empty, not huge)
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(10000); // At least 10KB
    expect(stats.size).toBeLessThan(100000000); // Less than 100MB

    console.log(`✓ Center crop clip created: ${result.filename} (${stats.size} bytes)`);
  });

  test('extract clip with left crop position', async ({ request }) => {
    const clipData = {
      id: 2,
      start_ms: 10000,
      end_ms: 20000,
      duration_seconds: 10,
      type: 'Hook',
      headline: 'Test Left Crop',
      why_clip_worthy: 'Testing extraction',
      hook: 'Test clip',
      suggested_platforms: ['Instagram'],
      confidence: 92,
      cropPosition: 'left'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'testVid123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.filename).toContain('Test_Left_Crop');

    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(100000);

    console.log(`✓ Left crop clip created: ${result.filename}`);
  });

  test('extract clip with right crop position', async ({ request }) => {
    const clipData = {
      id: 3,
      start_ms: 20000,
      end_ms: 30000,
      duration_seconds: 10,
      type: 'Lesson',
      headline: 'Test Right Crop',
      why_clip_worthy: 'Testing extraction',
      hook: 'Test clip',
      suggested_platforms: ['YouTube'],
      confidence: 88,
      cropPosition: 'right'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'testVid123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);

    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(100000);

    console.log(`✓ Right crop clip created: ${result.filename}`);
  });

  test('extract clip with transcript (captions)', async ({ request }) => {
    const mockTranscript = [
      { text: 'Welcome to the test', start: 5000, end: 8000, confidence: 0.95 },
      { text: 'This is a sample clip', start: 8000, end: 12000, confidence: 0.92 },
      { text: 'With captions', start: 12000, end: 15000, confidence: 0.90 },
    ];

    // Save transcript to file for the API to find
    const transcriptDir = path.join(process.cwd(), '.transcripts');
    if (!fs.existsSync(transcriptDir)) {
      fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const transcriptPath = path.join(transcriptDir, 'testVid456.json');
    fs.writeFileSync(transcriptPath, JSON.stringify(mockTranscript));

    const clipData = {
      id: 4,
      start_ms: 5000,
      end_ms: 15000,
      duration_seconds: 10,
      type: 'Hook',
      headline: 'Test With Captions',
      why_clip_worthy: 'Testing captions',
      hook: 'Test clip with captions',
      suggested_platforms: ['TikTok'],
      confidence: 91,
      cropPosition: 'center'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'testVid456'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);

    const outputPath = path.join(clipsDir, result.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(100000);

    // Clean up transcript file
    fs.unlinkSync(transcriptPath);

    console.log(`✓ Clip with captions created: ${result.filename}`);
  });

  test('handles missing video file gracefully', async ({ request }) => {
    const clipData = {
      id: 5,
      start_ms: 0,
      end_ms: 5000,
      duration_seconds: 5,
      type: 'Hook',
      headline: 'Test Missing Video',
      why_clip_worthy: 'Testing error handling',
      hook: 'Should fail',
      suggested_platforms: ['TikTok'],
      confidence: 50,
      cropPosition: 'center'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: '/nonexistent/video.mp4',
        clip: clipData,
        videoId: 'testVid789'
      }
    });

    // Should return 400 error for missing file
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBeTruthy();
    expect(result.error).toContain('not found');

    console.log(`✓ Missing file error handled correctly`);
  });

  test('extracted clips are valid MP4 files', async ({ request }) => {
    const clipData = {
      id: 6,
      start_ms: 15000,
      end_ms: 25000,
      duration_seconds: 10,
      type: 'Tip',
      headline: 'Test MP4 Validity',
      why_clip_worthy: 'Verify output format',
      hook: 'Valid MP4',
      suggested_platforms: ['Instagram'],
      confidence: 85,
      cropPosition: 'center'
    };

    const response = await request.post('/api/extract', {
      data: {
        videoPath: testVideoPath,
        clip: clipData,
        videoId: 'testVid999'
      }
    });

    const result = await response.json();
    const outputPath = path.join(clipsDir, result.filename);

    // Check file header for MP4 signature (ftyp)
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(outputPath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // MP4 files start with ftyp box at position 4
    const signature = buffer.toString('utf-8', 4, 8);
    expect(signature).toBe('ftyp');

    console.log(`✓ Output is valid MP4 file`);
  });
});
