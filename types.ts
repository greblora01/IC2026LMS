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

export type SlideLayout = 'freeform' | 'text-only' | 'media-left' | 'media-right' | 'full-media';

export interface SlideMedia {
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export type BlockType = 'text' | 'image' | 'video' | 'youtube' | 'shape';

export interface BlockStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  zIndex?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

export interface SlideBlock {
  id: string;
  type: BlockType;
  content: string; 
  // Position and Size (percentage based or fixed canvas units)
  x: number;
  y: number;
  width: number;
  height: number;
  style?: BlockStyle;
}

export interface Slide {
  id: string;
  title: string;
  content: string; // Legacy
  layout: SlideLayout;
  media?: SlideMedia; // Legacy
  blocks?: SlideBlock[]; 
  background?: string; // Hex color or Image URL
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