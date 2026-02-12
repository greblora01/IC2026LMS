import { Theme, Module } from './types';

export const DEFAULT_THEME: Theme = {
  primary: '#4A90E2',
  background: '#F5F7FA',
  text: '#333333',
  accent: '#4CAF50',
  cardBg: '#FFFFFF',
};

export const DARK_THEME: Theme = {
  primary: '#60A5FA',
  background: '#1F2937',
  text: '#F9FAFB',
  accent: '#34D399',
  cardBg: '#374151',
};

// Helpers for converting JSON content to HTML
const createText = (text: string) => `<p class="mb-4 text-lg leading-relaxed">${text}</p>`;
const createList = (items: string[]) => `<ul class="list-disc pl-5 mb-6 space-y-2 text-lg">${items.map(i => `<li class="pl-1">${i}</li>`).join('')}</ul>`;
const createTip = (summary: string, details: string) => `<div class="bg-blue-50 p-6 rounded-xl border-l-4 border-[var(--primary)] my-8 shadow-sm"><strong class="block text-[var(--primary)] text-lg mb-2 flex items-center gap-2">💡 ${summary}</strong><div class="text-gray-700">${details}</div></div>`;
const createVideo = (url: string) => {
  const embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/').replace('watch?v=', 'embed/');
  return `<div class="aspect-video w-full mb-8 rounded-xl overflow-hidden shadow-lg border border-gray-100"><iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
};
const createDownload = (url: string, text: string) => `<div class="mt-8 p-4 bg-gray-100 rounded-lg flex items-center justify-between border border-gray-200"><span class="font-medium text-gray-700">${text}</span><a href="${url}" download="${text.replace(/\s+/g, '_')}" class="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-bold hover:opacity-90 no-underline inline-block">Download Resource</a></div>`;

export const MOCK_MODULES: Module[] = [
  {
    id: 'tour-guiding',
    title: 'Fundamentals of Tour Guiding',
    description: 'Learn the essential skills to become a knowledgeable and charismatic tour guide.',
    thumbnail: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Fundamentals of Tour Guiding',
    certificateMessage: 'Thank you for dedicating your time to learn the fundamentals of Tour Guiding.',
    slides: [
      {
        id: 'm1l1',
        title: '1.1: What is a Tour Guide?',
        layout: 'text-only',
        content: `
          ${createText("A tour guide is a professional who leads individuals or groups through a place of interest, such as a historical site, museum, city, or natural landscape. More than just a navigator, a guide is an educator, an entertainer, and a cultural ambassador.")}
          ${createList([
            "<b>Passion:</b> Genuine enthusiasm for the subject matter.",
            "<b>Knowledge:</b> In-depth understanding of the history, culture, and facts.",
            "<b>Charisma:</b> An engaging personality that connects with people.",
            "<b>Professionalism:</b> Punctuality, preparedness, and a respectful demeanor."
          ])}
        `
      },
      {
        id: 'm1l2',
        title: '1.2: Roles & Responsibilities',
        layout: 'text-only',
        content: `
          ${createText("A tour guide's job is multi-faceted. Core responsibilities include:")}
          ${createList([
            "<b>Interpretation:</b> Explaining the significance of sights and translating complex information into understandable and engaging stories.",
            "<b>Safety and Logistics:</b> Ensuring the well-being of the group, managing time, and coordinating with drivers, venues, and other services.",
            "<b>Customer Service:</b> Answering questions, addressing concerns, and ensuring a positive experience for every guest.",
            "<b>Representation:</b> Acting as a representative of your city, region, or country. Your actions reflect on the local tourism industry."
          ])}
        `
      },
      {
        id: 'm2l1',
        title: '2.1: The Art of Storytelling',
        layout: 'text-only',
        content: `
          ${createText("Facts tell, but stories sell. The most memorable tours are compelling narratives. Watch the video below for an introduction to the art of storytelling.")}
          ${createVideo('https://youtu.be/sAdYFRhlSg4')}
        `
      },
      {
        id: 'm2l2',
        title: '2.2: Effective Group Management',
        layout: 'text-only',
        content: `
          ${createText("Keeping a group of diverse individuals engaged and on schedule is a challenge. Establish clear expectations at the beginning of the tour (e.g., meeting times, safety rules). Use a clear voice, make eye contact, and learn to \"read the room\" to adjust your pace or tone as needed.")}
        `
      },
      {
        id: 'm3l1',
        title: '3.1: Research & Preparation',
        layout: 'text-only',
        content: `
          ${createText("Let's use the [Manila Tourist Destination] as an example. Your research should uncover the human stories behind the landmark. A great guide prepares a checklist of key points to cover.")}
          ${createDownload('#', 'Tour_Guiding_Checklist.pdf')}
        `
      },
      {
        id: 'm3l2',
        title: '3.2: Building Your Narrative',
        layout: 'text-only',
        content: `
          ${createText("A tour is a journey. Structure it with a clear beginning, middle, and end. Start with a hook, build your story, and conclude with a memorable summary.")}
          ${createTip("Pro Tip: The 'Hook, Line, and Sinker' Method", 
            "<p class='mb-2'><strong>Hook:</strong> Start with a surprising fact or an intriguing question. 'Did you know this building is older than your Grandma?'</p><p class='mb-2'><strong>Line:</strong> This is the main body of your story, connecting facts thematically.</p><p><strong>Sinker:</strong> End with a powerful statement that makes the story memorable and 'sinks in.'</p>"
          )}
        `
      },
      {
        id: 'reflection',
        title: 'Final Reflection',
        layout: 'text-only',
        content: `
          <h3 class="text-xl font-bold mb-4">Exercise</h3>
          ${createText("In 2-3 sentences, how would you welcome a group of tourists to Hagonoy, making them feel excited about their visit?")}
          ${createTip("Suggested Answer", "'Good morning and a warm welcome to Hagonoy, the vibrant heart of Bulacan's coastal life! We're about to explore a town where faith, history, and craftsmanship flow as richly as our waters. Get ready to discover the stories hidden within our historic church and the warmth of our local community.'")}
        `
      }
    ],
    files: [
       { id: 'f1', name: 'Tour_Guiding_Checklist.pdf', type: 'pdf', url: '#', size: '1.2 MB' }
    ],
    quiz: {
      enabled: true,
      questions: [
        {
          id: 'q1',
          text: 'What is the primary goal of a tour guide beyond simply stating facts?',
          options: [
            'Managing the schedule perfectly',
            'Acting as a storyteller to create a memorable experience',
            'Selling merchandise'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q2',
          text: 'When crafting a tour\'s narrative, what is most effective?',
          options: [
            'Listing as many dates as possible',
            'Focusing on the building\'s technical specifications',
            'Weaving human stories and the "why" into your tour'
          ],
          correctOptionIndex: 2
        }
      ]
    },
    stats: { views: 104, completions: 87 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  },
  {
    id: 'bus-captain',
    title: 'Bus Captain',
    description: 'Master passenger management, safety protocols, and route navigation.',
    thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Bus Captain Training',
    certificateMessage: 'Congratulations on completing Bus Captain training. Your dedication to passenger safety is commendable.',
    slides: [
      {
        id: 'm1l1',
        title: '1.1: Role and Responsibilities',
        layout: 'text-only',
        content: `
          ${createText("A Bus Captain is responsible for passenger safety, route navigation, and providing excellent customer service.")}
          ${createList([
            "Passenger safety and comfort",
            "Route adherence and timing",
            "Vehicle inspection and reporting",
            "Emergency procedures"
          ])}
        `
      },
      {
        id: 'm1l2',
        title: '1.2: Safety Protocols',
        layout: 'text-only',
        content: `
          ${createText("Safety is the top priority for every Bus Captain. Understanding and implementing safety protocols is essential.")}
        `
      }
    ],
    files: [],
    quiz: {
      enabled: true,
      questions: [
        {
          id: 'q1',
          text: 'What is the primary responsibility of a Bus Captain?',
          options: [
            'Driving as fast as possible',
            'Ensuring passenger safety and comfort',
            'Collecting maximum fares'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q2',
          text: 'When should a Bus Captain perform vehicle inspection?',
          options: [
            'Only when problems occur',
            'At the beginning of each shift',
            'Once a week'
          ],
          correctOptionIndex: 1
        }
      ]
    },
    stats: { views: 45, completions: 32 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  },
  {
    id: 'hotel-help-desk',
    title: 'Hotel Help Desk',
    description: 'Develop expertise in hotel front desk operations and guest services.',
    thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Hotel Help Desk Operations',
    certificateMessage: 'Well done on mastering hotel front desk operations and customer service excellence.',
    slides: [
      {
        id: 'm1l1',
        title: '1.1: Guest Service Standards',
        layout: 'text-only',
        content: `
          ${createText("Hotel front desk staff are the first point of contact for guests and set the tone for their entire stay.")}
          ${createList([
            "Warm welcome and greeting",
            "Efficient check-in process",
            "Knowledge of hotel amenities",
            "Problem resolution skills"
          ])}
        `
      }
    ],
    files: [],
    quiz: {
      enabled: true,
      questions: [
        {
          id: 'q1',
          text: 'What is the most important quality for hotel front desk staff?',
          options: [
            'Exceptional customer service skills',
            'Knowledge of accounting',
            'Culinary expertise'
          ],
          correctOptionIndex: 0
        }
      ]
    },
    stats: { views: 67, completions: 50 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  },
  {
    id: 'instructional-design',
    title: 'Instructional Design',
    description: 'Learn to design effective and engaging training modules for convention volunteers using proven frameworks.',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Instructional Design',
    certificateMessage: 'Congratulations on mastering instructional design principles for effective volunteer training!',
    slides: [
      {
        id: 'm1l1',
        title: 'Purpose of This Training',
        layout: 'text-only',
        content: `
          ${createText("This module will help equip participants to design effective and engaging training modules for convention volunteers by giving them a standard framework to follow.")}
        `
      },
      {
        id: 'm1l2',
        title: 'Learning Objectives',
        layout: 'text-only',
        content: `
          ${createText("By the end of the session, participants will be able to:")}
          ${createList([
            "<strong>Apply</strong> core principles of adult learning to enhance volunteer training design.",
            "<strong>Use</strong> the ABCD model to write clear, measurable, and learner-centered objectives.",
            "<strong>Use</strong> a simple instructional design process to organize effective training modules.",
            "<strong>Develop</strong> engaging and purposeful volunteer training modules aligned with learning goals."
          ])}
        `
      },
      {
        id: 'm1l3',
        title: 'Training Agenda',
        layout: 'text-only',
        content: `
          ${createText("Why Instructional Design Matters")}
          ${createList([
            "<strong>Unit 1:</strong> Adult Learning Principles",
            "<strong>Unit 2:</strong> Writing Learning Objectives", 
            "<strong>Unit 3:</strong> Simplified Instructional Design Model"
          ])}
        `
      },
      {
        id: 'm2l1',
        title: 'MS Teams Training - Part 1',
        layout: 'text-only',
        content: `
          ${createText("Watch this video demonstration of MS Teams training:")}
          ${createVideo('https://www.youtube.com/embed/sAdYFRhlSg4')}
          ${createTip("Video Learning Tip", "As you watch this MS Teams training video, pay attention to how the instructor structures the content and engages the learners. This demonstrates effective instructional design in action.")}
        `
      },
      {
        id: 'm2l2',
        title: 'Practice Exercise: LFF Publication Analysis',
        layout: 'text-only',
        content: `
          ${createText("Refer to the LFF publication and answer the following questions:")}
          ${createList([
            "Where can you find the WIIFM (What's In It For Me)?",
            "Provide some examples of <strong>Demonstrate</strong>",
            "Provide some examples of <strong>Apply</strong>", 
            "Provide examples of <strong>Knowledge Check</strong>",
            "Why can we say that this lesson uses a <strong>Blended Approach</strong>?",
            "What are some examples of <strong>Asynchronous Activities</strong>?"
          ])}
          ${createDownload('#', 'LFF Publication (Sample)')}
        `
      },
      {
        id: 'essay_reflection',
        title: 'Essay Reflection',
        layout: 'text-only',
        content: `
          <h3 class="text-xl font-bold mb-4">Reflection Question</h3>
          ${createText("In your own words, explain why instructional design matters for volunteer training and provide one example of how you would apply these principles.")}
          ${createTip("Model Answer", "Instructional design matters because it provides a structured framework that ensures training is effective, engaging, and meets learning objectives. For volunteer training, this means creating modules that are easy to follow, relevant to volunteers' roles, and help them quickly acquire needed skills. Example: Using the ABCD model to create clear objectives like 'After this training, volunteers will be able to demonstrate proper greeting techniques for convention attendees.'")}
        `
      }
    ],
    files: [],
    quiz: {
      enabled: true,
      questions: [
        {
          id: 'q1',
          text: 'What is the main purpose of this instructional design training?',
          options: [
            'To learn advanced computer programming',
            'To design effective training modules for convention volunteers',
            'To improve public speaking skills'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q2',
          text: 'Which of these is NOT a learning objective from this course?',
          options: [
            'Apply core principles of adult learning',
            'Use the ABCD model for writing objectives',
            'Create complex software applications'
          ],
          correctOptionIndex: 2
        }
      ]
    },
    stats: { views: 12, completions: 3 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  }
];