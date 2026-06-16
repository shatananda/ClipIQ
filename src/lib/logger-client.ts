'use client';

const isDebug = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

export const clientLogger = {
  debug: (...args: any[]) => {
    if (isDebug) console.log('[DEBUG]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};
