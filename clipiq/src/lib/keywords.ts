import fs from 'fs';
import { PATHS } from './storage';

export interface KeywordsData {
  keywords: string[];
  lastScraped: string;
}

export function readKeywords(): string[] {
  try {
    if (fs.existsSync(PATHS.keywordsCache)) {
      const data = JSON.parse(fs.readFileSync(PATHS.keywordsCache, 'utf-8')) as KeywordsData;
      return data.keywords || [];
    }
  } catch (e) {
    console.error('Error reading keywords cache:', e);
  }
  return [];
}

export function readExcluded(): string[] {
  try {
    if (fs.existsSync(PATHS.keywordsExcluded)) {
      return JSON.parse(fs.readFileSync(PATHS.keywordsExcluded, 'utf-8')) as string[];
    }
  } catch (e) {
    console.error('Error reading excluded keywords:', e);
  }
  return [];
}

export function writeKeywords(keywords: string[], lastScraped?: string) {
  const data: KeywordsData = {
    keywords,
    lastScraped: lastScraped || new Date().toISOString(),
  };
  fs.writeFileSync(PATHS.keywordsCache, JSON.stringify(data, null, 2));
}

export function writeExcluded(excluded: string[]) {
  fs.writeFileSync(PATHS.keywordsExcluded, JSON.stringify(excluded, null, 2));
}

export function toggleExcluded(keyword: string): boolean {
  const excluded = readExcluded();
  const index = excluded.indexOf(keyword);
  if (index > -1) {
    excluded.splice(index, 1);
  } else {
    excluded.push(keyword);
  }
  writeExcluded(excluded);
  return index === -1;
}

export function addCustomKeyword(keyword: string) {
  const keywords = readKeywords();
  if (!keywords.includes(keyword)) {
    keywords.push(keyword);
    writeKeywords(keywords);
  }
}

export function getNonExcludedKeywords(): string[] {
  const keywords = readKeywords();
  const excluded = readExcluded();
  return keywords.filter((k) => !excluded.includes(k));
}

export async function scrapeKeywords(): Promise<string[]> {
  try {
    const response = await fetch('https://www.pureishvari.com');
    const html = await response.text();

    const keywords = new Set<string>();

    // Extract keywords from product names, dosha references, etc.
    const patterns = [
      /(?:rose|ghee|oil|jewelry|sacred|vedic|counseling|channeling|satsangam|vata|pitta|kapha|dosha)/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach((match) => keywords.add(match.toLowerCase()));
      }
    });

    const keywordArray = Array.from(keywords);
    writeKeywords(keywordArray);
    return keywordArray;
  } catch (e) {
    console.error('Error scraping keywords:', e);
    return readKeywords();
  }
}
