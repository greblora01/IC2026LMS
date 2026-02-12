export interface Theme {
  primary: string;
  background: string;
  text: string;
  accent: string;
  cardBg: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'doc' | 'image' | 'other';
  url: string;
  size: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  enabled: boolean;
  questions: Question[];
}

export interface ModuleStats {
  views: number;
  completions: number;
  avgScore?: number;
}

export type SlideLayout = 'text-only' | 'media-left' | 'media-right' | 'full-media';

export interface SlideMedia {
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string; // HTML string for this slide
  layout: SlideLayout;
  media?: SlideMedia;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  certificateTitle?: string;
  certificateMessage?: string;
  slides: Slide[];
  files: AttachedFile[];
  quiz: Quiz;
  stats: ModuleStats;
  createdAt: number;
  lastUpdated: number;
}