import { Theme, Module } from './types';

export const DEFAULT_THEME: Theme = {
  primary: '#f57f20',
  background: '#F4F4F4',
  text: '#333333',
  accent: '#1f497d',
  cardBg: '#FFFFFF',
};

export const DARK_THEME: Theme = {
  primary: '#f57f20', // Kept branding consistent
  background: '#1F2937',
  text: '#F9FAFB',
  accent: '#60A5FA',
  cardBg: '#374151',
};

// Helpers for converting JSON content to HTML
const createText = (text: string) => `<p class="text-lg">${text}</p>`;

// Slide Templates for the Editor (Canvas Ready)
export const SLIDE_TEMPLATES = [
  {
    label: 'Title Slide',
    description: 'Large title with a subtitle.',
    layout: 'canvas',
    blocks: [
      { 
        type: 'text', 
        content: '<h1 style="font-size: 48px; text-align: center;"><b>Presentation Title</b></h1>', 
        x: 10, y: 30, width: 80, height: 20, zIndex: 1 
      },
      { 
        type: 'text', 
        content: '<p style="text-align: center; font-size: 24px;">Subtitle goes here</p>', 
        x: 20, y: 55, width: 60, height: 10, zIndex: 1 
      }
    ]
  },
  {
    label: 'Image & Text',
    description: 'Image on left, text on right.',
    layout: 'canvas',
    blocks: [
      { 
        type: 'image', 
        content: '', 
        x: 5, y: 10, width: 40, height: 80, zIndex: 1 
      },
      { 
        type: 'text', 
        content: '<h2>Topic Header</h2><p>Click to edit this text and add your content here.</p>', 
        x: 50, y: 10, width: 45, height: 80, zIndex: 1 
      }
    ]
  },
  {
    label: 'Key Point / Quote',
    description: 'Centered text with a background shape.',
    layout: 'canvas',
    blocks: [
      {
        type: 'shape',
        content: '',
        x: 15, y: 20, width: 70, height: 60, zIndex: 0,
        style: { backgroundColor: '#FFF7ED', borderRadius: 20, shadow: true }
      },
      { 
        type: 'text', 
        content: '<h2 style="text-align: center; color: var(--primary);">"Key Quote or Stat"</h2><p style="text-align: center;">Supporting detail text.</p>', 
        x: 20, y: 35, width: 60, height: 30, zIndex: 1 
      }
    ]
  },
  {
    label: 'Video Layout',
    description: 'Video player with a caption.',
    layout: 'canvas',
    blocks: [
      { type: 'youtube', content: '', x: 10, y: 10, width: 80, height: 70, zIndex: 1 },
      { type: 'text', content: '<p style="text-align: center;">Video Caption</p>', x: 10, y: 85, width: 80, height: 10, zIndex: 1 }
    ]
  }
];

// Template for new modules based on Volunteer Training Module 2 Layout
export const NEW_MODULE_TEMPLATE_SLIDES = [
  {
    title: 'Module Title',
    layout: 'canvas',
    backgroundColor: '#ffffff',
    blocks: [
      {
        type: 'text',
        x: 10, y: 10, width: 80, height: 80,
        zIndex: 1,
        content: `
          <h2 class="text-2xl font-bold text-[var(--primary)] mb-2">Part 1</h2>
          <h1 class="text-4xl font-bold mb-8">Module Title Here</h1>
          <ul class="list-disc pl-5 mb-6 space-y-2 text-lg">
            <li class="pl-1"><strong>Presented by:</strong> HC3-VM Trainers Team</li>
            <li class="pl-1"><strong>Duration:</strong> 20–30 Minutes</li>
            <li class="pl-1"><strong>Event:</strong> Volunteer Training 2026 IC</li>
          </ul>
        `
      }
    ]
  },
  {
    title: 'Welcome & Introduction',
    layout: 'canvas',
    blocks: [
      {
        type: 'text',
        x: 10, y: 10, width: 80, height: 80,
        zIndex: 1,
        content: `
          <p class="mb-4 text-lg leading-relaxed">Welcome to this training module. Use this paragraph to introduce the topic with warmth and enthusiasm.</p>
          <div class="bg-gray-50 p-6 rounded-xl border-l-4 border-[var(--primary)] my-6 italic text-gray-700">
            "Insert a key scripture or guiding principle here."
            <div class="mt-2 font-bold text-[var(--primary)] not-italic">—Reference</div>
          </div>
          <p class="text-sm text-gray-500 mt-4">Reference: Source Material Name</p>
        `
      }
    ]
  }
];

export const MOCK_MODULES: Module[] = [
    {
    id: 'cultural-awareness',
    title: 'Volunteer Training Module 2: Cultural Awareness',
    description: 'Cultural Awareness & Proper Conduct in Assisting International Delegates.',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Cultural Awareness & Proper Conduct',
    certificateMessage: 'Thank you for completing the Volunteer Training Module 2. Your attention to cultural sensitivity will help make the 2026 IC a success.',
    footerTextLeft: 'VOLUNTEER TRAINING',
    footerTextRight: '2026 IC',
    slides: [
      {
        id: 's1',
        title: 'Volunteer Training Module 2',
        layout: 'text-only',
        content: `
          <h2 class="text-2xl font-bold text-[var(--primary)] mb-2">Part 1</h2>
          <h1 class="text-4xl font-bold mb-8">Cultural Awareness & Proper Conduct in Assisting International Delegates</h1>
          <ul class="list-disc pl-5 mb-6 space-y-2 text-lg">
             <li><strong>Presented by:</strong> HC3-VM Trainers Team</li>
             <li><strong>Duration:</strong> 20–30 Minutes</li>
             <li><strong>Event:</strong> Volunteer Training 2026 IC</li>
          </ul>
        `
      }
    ],
    files: [],
    quiz: { enabled: false, questions: [] },
    stats: { views: 0, completions: 0 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  }
];
