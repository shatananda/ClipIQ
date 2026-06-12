import fs from 'fs';
import path from 'path';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export const PATHS = {
  storage: STORAGE_PATH,
  videos: path.join(STORAGE_PATH, 'videos'),
  audio: path.join(STORAGE_PATH, 'audio'),
  clips: path.join(STORAGE_PATH, 'clips'),
  keywordsCache: path.join(STORAGE_PATH, 'keywords.json'),
  keywordsExcluded: path.join(STORAGE_PATH, 'keywords-excluded.json'),
};

export function ensureDirs() {
  Object.values(PATHS).forEach((dir) => {
    if (dir.endsWith('.json')) return;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureDirs();
