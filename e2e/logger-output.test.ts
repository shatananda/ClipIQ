/**
 * Logger output format tests
 * Validates that logger produces correctly formatted output
 */

describe('Logger Output Format', () => {
  const originalEnv = process.env.DEBUG_MODE;
  const originalLog = console.log;
  const originalError = console.error;

  let mockLog: jest.Mock;
  let mockError: jest.Mock;

  beforeEach(() => {
    mockLog = jest.fn();
    mockError = jest.fn();
    console.log = mockLog;
    console.error = mockError;
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    process.env.DEBUG_MODE = originalEnv;
    jest.resetModules();
  });

  describe('Format compliance', () => {
    it('should prefix debug logs with [DEBUG]', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.debug('test message');

      expect(mockLog).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    it('should prefix info logs with [INFO]', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.info('test message');

      expect(mockLog).toHaveBeenCalledWith('[INFO]', 'test message');
    });

    it('should prefix error logs with [ERROR]', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.error('test message');

      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'test message');
    });

    it('should handle emoji in log messages', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.info('📥 Starting download');
      logger.info('✓ Download complete');
      logger.error('❌ Download failed');

      expect(mockLog).toHaveBeenCalledWith('[INFO]', '📥 Starting download');
      expect(mockLog).toHaveBeenCalledWith('[INFO]', '✓ Download complete');
      expect(mockError).toHaveBeenCalledWith('[ERROR]', '❌ Download failed');
    });

    it('should pass all arguments after the message', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      const obj = { foo: 'bar' };
      logger.info('message', obj, 'extra');

      expect(mockLog).toHaveBeenCalledWith('[INFO]', 'message', obj, 'extra');
    });
  });

  describe('Gating behavior', () => {
    it('should not call console.log for debug when DEBUG_MODE is false', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.debug('should not appear');

      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should call console.log for debug when DEBUG_MODE is true', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.debug('should appear');

      expect(mockLog).toHaveBeenCalled();
    });

    it('should always call console.log for info', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.info('always appears');

      expect(mockLog).toHaveBeenCalledWith('[INFO]', 'always appears');
    });

    it('should always call console.error for errors', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.error('always appears');

      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'always appears');
    });
  });

  describe('Real-world log patterns', () => {
    it('should handle OAuth flow logging', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.debug('🔐 OAuth route - GOOGLE_OAUTH_REDIRECT_URI:', process.env.GOOGLE_OAUTH_REDIRECT_URI);
      logger.info('✓ Code exchanged for tokens');

      expect(mockLog).toHaveBeenCalledWith('[DEBUG]', '🔐 OAuth route - GOOGLE_OAUTH_REDIRECT_URI:', expect.anything());
      expect(mockLog).toHaveBeenCalledWith('[INFO]', '✓ Code exchanged for tokens');
    });

    it('should handle video processing logging', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.info('📥 Downloading video with yt-dlp:', { url: 'https://youtube.com/watch?v=123', videoId: '123' });
      logger.info('✓ Video downloaded successfully:', '/tmp/videos/123.mp4');
      logger.error('Download error:', new Error('Network timeout'));

      expect(mockLog).toHaveBeenCalledWith('[INFO]', '📥 Downloading video with yt-dlp:', expect.any(Object));
      expect(mockLog).toHaveBeenCalledWith('[INFO]', '✓ Video downloaded successfully:', expect.any(String));
      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'Download error:', expect.any(Error));
    });

    it('should handle API error responses', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.error('OAuth callback error:', new Error('Invalid state parameter'));
      logger.error('Session check error:', 'Token expired');

      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'OAuth callback error:', expect.any(Error));
      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'Session check error:', 'Token expired');
    });
  });

  describe('Debug mode toggle', () => {
    it('should respect environment variable at module load time', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger: logger1 } = require('../logger');

      logger1.debug('should not log');
      expect(mockLog).not.toHaveBeenCalled();

      jest.resetModules();
      mockLog.mockClear();

      process.env.DEBUG_MODE = 'true';
      const { logger: logger2 } = require('../logger');

      logger2.debug('should log');
      expect(mockLog).toHaveBeenCalled();
    });

    it('should handle missing DEBUG_MODE environment variable', () => {
      delete process.env.DEBUG_MODE;
      jest.resetModules();
      const { logger } = require('../logger');

      logger.debug('should not log');
      logger.info('should log');

      expect(mockLog).toHaveBeenCalledTimes(1); // Only info
      expect(mockLog).toHaveBeenCalledWith('[INFO]', 'should log');
    });
  });

  describe('Type safety', () => {
    it('should accept variadic arguments of any type', () => {
      process.env.DEBUG_MODE = 'true';
      jest.resetModules();
      const { logger } = require('../logger');

      logger.info('test', 'string', 123, { obj: true }, ['array'], null, undefined);

      expect(mockLog).toHaveBeenCalledWith(
        '[INFO]',
        'test',
        'string',
        123,
        { obj: true },
        ['array'],
        null,
        undefined
      );
    });

    it('should handle Error objects correctly', () => {
      process.env.DEBUG_MODE = 'false';
      jest.resetModules();
      const { logger } = require('../logger');

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      logger.error('Failed with error:', error);

      expect(mockError).toHaveBeenCalledWith('[ERROR]', 'Failed with error:', error);
      expect(mockError.mock.calls[0][2] instanceof Error).toBe(true);
      expect(mockError.mock.calls[0][2].message).toBe('Test error');
    });
  });
});
