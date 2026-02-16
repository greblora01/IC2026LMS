
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

export type SlideLayout = 'text-only' | 'media-left' | 'media-right' | 'full-media' | 'canvas';

export interface SlideMedia {
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export type BlockType = 'text' | 'image' | 'video' | 'youtube' | 'shape' | 'plain-text' | 'svg';

export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number; // px
  opacity?: number; // 0-1
  padding?: number; // px
  color?: string; // Text color
  shadow?: boolean;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fontFamily?: string;
  // Added textAlign property to fix missing property errors in ModuleEditor
  textAlign?: string;
}

export interface SlideBlock {
  id: string;
  type: BlockType;
  content: string; // HTML for text, raw string for plain-text/svg, URL for media
  
  // Positioning (Percentages 0-100)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number; // degrees
  zIndex?: number;
  
  // Styling
  style?: ElementStyle;
  
  // Legacy support
  align?: 'left' | 'center' | 'right';
}

export interface Slide {
  id: string;
  title: string;
  content: string; // HTML string for this slide (Legacy)
  layout: SlideLayout; 
  media?: SlideMedia; // (Legacy)
  blocks?: SlideBlock[]; // New block-based structure
  icon?: string;
  
  // Canvas Background
  backgroundColor?: string;
  backgroundImage?: string;
}

export type ModuleCategory = 'GVM' | 'CCVM' | 'HCVM' | 'UNCATEGORIZED';

export interface Module {
  id: string;
  title: string;
  description: string;
  category: ModuleCategory;
  thumbnail?: string;
  thumbnailSlideId?: string; // ID of the slide used for the card preview
  certificateTitle?: string;
  certificateMessage?: string;
  footerTextLeft?: string;
  footerTextRight?: string;
  slides: Slide[];
  files: AttachedFile[];
  quiz: Quiz;
  stats: ModuleStats;
  createdAt: number;
  lastUpdated: number;
}

export type UserRole = 'admin' | 'student';

export interface AccessCode {
  id: string;
  code: string;
  role: UserRole;
  label: string; // e.g. "Hospitality Team", "Super Admin"
  createdAt: number;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  role: UserRole | null;
  label: string | null;
}
