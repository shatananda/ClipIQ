const isDebug = process.env.DEBUG_MODE === 'true';

export const logger = {
  debug: (...args: any[]) => {
    if (isDebug) console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
