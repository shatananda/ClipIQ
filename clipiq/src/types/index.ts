export interface Paragraph {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ClipSuggestion {
  id: number;
  start_ms: number;
  end_ms: number;
  duration_seconds: number;
  type: string;
  headline: string;
  why_clip_worthy: string;
  hook: string;
  suggested_platforms: string[];
  confidence: number;
}

export interface ClipIQState {
  clips: ClipSuggestion[];
  videoPath: string;
  videoId: string;
  title: string;
}

export interface KeywordState {
  keywords: string[];
  excluded: string[];
  custom: string[];
}

export type CropPosition = 'left' | 'center' | 'right';

export interface ApprovedClip extends ClipSuggestion {
  cropPosition: CropPosition;
}
