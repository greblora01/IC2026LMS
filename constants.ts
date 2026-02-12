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
const createScripture = (text: string, reference: string) => `<div class="bg-orange-50 p-6 rounded-xl border-l-4 border-orange-400 my-6 italic text-gray-700">"${text}"<div class="mt-2 font-bold text-orange-600 not-italic">—${reference}</div></div>`;

export const MOCK_MODULES: Module[] = [
  {
    id: 'cultural-awareness',
    title: 'Volunteer Training Module 2: Cultural Awareness',
    description: 'Cultural Awareness & Proper Conduct in Assisting International Delegates.',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    certificateTitle: 'Cultural Awareness & Proper Conduct',
    certificateMessage: 'Thank you for completing the Volunteer Training Module 2. Your attention to cultural sensitivity will help make the 2026 IC a success.',
    slides: [
      {
        id: 's1',
        title: 'Volunteer Training Module 2',
        layout: 'text-only',
        content: `
          <h2 class="text-2xl font-bold text-[var(--primary)] mb-2">Part 1</h2>
          <h1 class="text-4xl font-bold mb-8">Cultural Awareness & Proper Conduct in Assisting International Delegates</h1>
          ${createList([
            "<strong>Presented by:</strong> HC3-VM Trainers Team",
            "<strong>Duration:</strong> 20–30 Minutes",
            "<strong>Event:</strong> Volunteer Training 2026 IC"
          ])}
        `
      },
      {
        id: 's2',
        title: 'Welcome & Introduction',
        layout: 'text-only',
        content: `
          ${createText("We deeply cherish our dear brothers and sisters and are eager to extend heartfelt warmth and hospitality during the International Convention in Manila 2026.")}
          ${createText("To help everyone feel truly welcome and comfortable, we aim to be mindful of our behavior and interactions—especially those that may carry different cultural meanings.")}
          ${createScripture("Look out not only for your own interests, but also for the interests of others", "Philippians 2:4")}
          <p class="text-sm text-gray-500 mt-4">Reference: Local Cultures and Christian Principles — Are They Compatible? - Watchtower 1998 10/1 p.19</p>
        `
      },
      {
        id: 's3',
        title: 'Module 2 Overview',
        layout: 'text-only',
        content: `
          ${createText("This module is divided into Part 1 and Part 2 covering the following key areas:")}
          ${createList([
            "Purpose of This Training",
            "Learning Objectives",
            "Know Your Delegates",
            "Volunteer Conduct & Demeanor",
            "Assisting Delegates Respectfully",
            "Cultural Sensitivity Essentials",
            "Common Cross-Cultural Differences",
            "Things to Avoid",
            "Recognizing Signs of Discomfort",
            "Scenario-Based Clips and Simulations",
            "Group Reflection & Discussion"
          ])}
        `
      },
      {
        id: 's4',
        title: 'Purpose of This Training',
        layout: 'text-only',
        content: `
          ${createList([
            "To help all volunteers understand how to conduct themselves with <strong>dignity, respect, and warmth</strong> when assisting our international delegates.",
            "We aim to make every guest feel <strong>welcomed, respected, and cared for</strong> — reflecting the spirit of Christian love and unity."
          ])}
        `
      },
      {
        id: 's5',
        title: 'Learning Objectives',
        layout: 'text-only',
        content: `
          ${createText("After completing the module, volunteers will be able to:")}
          ${createList([
            "<strong>Apply</strong> proper conduct and culturally sensitive communication behaviors when assisting international delegates.",
            "<strong>Demonstrate</strong> appropriate ways of offering assistance—proactively but respectfully.",
            "<strong>Identify</strong> cross-cultural differences (e.g., humor, hand gestures, personal space, eye contact, punctuality, expressions of gratitude, etc).",
            "<strong>Recognize</strong> signs of discomfort or confusion from delegates and extend necessary help as needed."
          ])}
        `
      },
      {
        id: 's6',
        title: 'Why Volunteer Conduct Matters',
        layout: 'text-only',
        content: `
          ${createList([
            "Each volunteer represents not only the <strong>host branch</strong> but also the entire <strong>organization</strong>.",
            "The way we speak, act, and serve <strong>reflects the qualities Christians</strong> are known for—humility, kindness, and genuine hospitality.",
            "Through our conduct, we <strong>reflect Jehovah’s love</strong> and the dignity of His organization, becoming a <strong>powerful witness</strong> to all who observe us.",
            "Remember, the way you behave can leave a <strong>lasting impression</strong>—one that honors Jehovah and uplifts those around you."
          ])}
          ${createScripture("In no way are we giving any cause for stumbling, so that no fault may be found with our ministry.", "2 Corinthians 6:3")}
          ${createScripture("...so that they may see your fine works and give glory to your Father who is in the heavens.", "Matthew 5:16")}
        `
      },
      {
        id: 's7',
        title: 'Know Your Delegates',
        layout: 'text-only',
        content: `
          ${createText("Delegates will be arriving from all over the globe. Familiarize yourself with these regions:")}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">South & South-East Asia</strong>
                <p>Indonesia, Malaysia, Myanmar, Thailand & Sri Lanka.</p>
             </div>
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">East & Central Asia</strong>
                <p>Japan, Korea, Taiwan & Kyrgyzstan.</p>
             </div>
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">Europe</strong>
                <p>Scandinavia: Denmark, Norway, Sweden.</p>
             </div>
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">Americas</strong>
                <p>Ecuador, Haiti, Suriname, United States.</p>
             </div>
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">Africa</strong>
                <p>Angola, Burundi, East Africa, Ethiopia, Madagascar, Zambia.</p>
             </div>
             <div class="p-4 bg-white border rounded-lg shadow-sm">
                <strong class="text-orange-500">The Pacific / Oceania</strong>
                <p>Australasia, Fiji, Micronesia, Papua New Guinea, Solomon Islands, Tahiti.</p>
             </div>
          </div>
        `
      },
      {
        id: 's8',
        title: 'Assisting Delegates Respectfully',
        layout: 'text-only',
        content: `
          <h3 class="text-2xl font-bold text-orange-500 mb-4">Warm yet Dignified Attitude</h3>
          ${createList([
            "Be friendly, but maintain dignity.",
            "Smile, greet warmly, and show genuine concern—without being overly casual or familiar.",
            "<strong>Motto:</strong> \"Friendly, not overly familiar/flirty. Helpful, not hurried.\""
          ])}
        `
      },
      {
        id: 's9',
        title: 'Cultural Awareness Key',
        layout: 'text-only',
        content: `
          ${createList([
            "Delegates come from many nations, each with <strong>unique customs</strong> and <strong>communication styles</strong>.",
            "Understanding these differences helps us <strong>avoid misunderstandings</strong> and ensures a peaceful, joyful atmosphere during the convention."
          ])}
        `
      },
      {
        id: 's10',
        title: 'Hand Gestures',
        layout: 'text-only',
        content: `
          ${createList([
            "Avoid using hand <strong>gestures that may be misunderstood</strong> by the delegates from different countries.",
            "The meaning of hand <strong>gestures varies across cultures</strong>, thus it is safest to use clear verbal communication instead.",
            "<strong>Communicate well</strong> with the delegates what you mean to say rather than just doing hand gestures.",
            "Make sure the delegates <strong>understood</strong> what you want to tell them."
          ])}
        `
      },
      {
        id: 's11',
        title: 'Humor',
        layout: 'text-only',
        content: `
          ${createList([
            "Humor can be a powerful social tool, but its <strong>interpretation may vary dramatically</strong> across cultures.",
            "What’s funny in one culture might be confusing, inappropriate, or even offensive in another."
          ])}
          ${createScripture("...every sort of uncleanness or greediness not even be mentioned among you, just as is proper for holy people; neither shameful conduct nor foolish talking nor obscene jesting—things that are not befitting—but rather the giving of thanks.", "Ephesians 5:3,4")}
        `
      },
      {
        id: 's12',
        title: 'Personal Space',
        layout: 'text-only',
        content: `
          ${createText("Some cultures stand close; others prefer distance.")}
          ${createList([
            "<strong>Scenario:</strong> A delegate might feel uncomfortable when a volunteer stands too close.",
            "<strong>Aware approach:</strong> Maintain a <strong>Neutral Distance</strong>. Start with a social distance of about 1 to 1.5 meters (3 to 5 feet), which is generally safe across most cultures.",
            "Avoid leaning in or touching unless you’re sure the delegate is comfortable with that."
          ])}
        `
      },
      {
        id: 's13',
        title: 'Handshake',
        layout: 'text-only',
        content: `
          ${createList([
            "A <strong>firm handshake</strong> is standard in many Western cultures.",
            "However, in some cultures, an overly firm handshake with a woman might be inappropriate.",
            "In <strong>Japan</strong>, bowing is the traditional greeting, with the depth of the bow indicating the level of respect."
          ])}
        `
      },
      {
        id: 's14',
        title: 'Eye Contact',
        layout: 'text-only',
        content: `
          ${createText("In some countries, direct eye contact shows confidence; in others, it may seem rude.")}
          ${createTip("Best Practice", "Follow the delegate's lead. If they maintain eye contact, it is likely safe to do so. If they avert their eyes, respect their preference for less direct contact.")}
        `
      },
      {
        id: 's15',
        title: 'Understanding of Time',
        layout: 'text-only',
        content: `
          ${createText("<strong>Punctuality:</strong> Many value strict timing; others are <strong>more flexible</strong>.")}
          ${createList([
            "<strong>Scenario:</strong> \"A volunteer might get frustrated with a delegate who arrives late for a scheduled activity not understanding that the delegate doesn’t view time with the same rigidity.\"",
            "<strong>Aware approach:</strong> Volunteers must <strong>be kind and considerate</strong> if delegates come <strong>late</strong> for their scheduled events."
          ])}
          ${createScripture("On the other hand, the fruitage of the spirit is love, joy, peace, patience, kindness, goodness, faith, mildness, self-control. Against such things there is no law.", "Galatians 5:22, 23")}
        `
      },
      {
        id: 's16',
        title: 'Things to Avoid',
        layout: 'text-only',
        content: `
          <div class="space-y-4">
             <div class="flex items-start gap-3">
               <span class="text-red-500 font-bold text-xl">✗</span>
               <p>Avoid jokes that may not translate well.</p>
             </div>
             <div class="flex items-start gap-3">
               <span class="text-red-500 font-bold text-xl">✗</span>
               <p>Avoid using <strong>local slang</strong> or teasing.</p>
             </div>
             <div class="flex items-start gap-3">
               <span class="text-red-500 font-bold text-xl">✗</span>
               <p><strong>Never assume</strong> a delegate shares Filipino customs or humor.</p>
             </div>
             <div class="flex items-start gap-3">
               <span class="text-red-500 font-bold text-xl">✗</span>
               <p><strong>Avoid burping.</strong> Excuse yourself and burp in private.</p>
             </div>
          </div>
          ${createScripture("...neither shameful conduct nor foolish talking nor obscene jesting...", "Ephesians 5:3,4")}
        `
      },
      {
        id: 's17',
        title: 'Appearance & Judgment',
        layout: 'text-only',
        content: `
          <div class="flex items-start gap-3 mb-6">
             <span class="text-red-500 font-bold text-xl">✗</span>
             <p class="text-xl font-medium">Do not comment on appearance, clothing, or accent.</p>
          </div>
          ${createScripture("Avoid showing favoritism or class distinctions.", "James 2:1-4")}
          ${createScripture("Honor men of all sorts, have love for the whole association of brothers.", "1 Peter 2:17")}
        `
      },
      {
        id: 's18',
        title: 'Modesty in Speech & Body Language',
        layout: 'text-only',
        content: `
          ${createList([
            "Use polite, respectful words at all times.",
            "Avoid loud laughter, gossip, or excessive gestures.",
            "Maintain calm, professional posture and composure, even under pressure."
          ])}
          ${createScripture("Let your words always be gracious, seasoned with salt, so that you will know how you should answer each person.", "Colossians 4:6")}
          ${createScripture("Let a rotten word not come out of your mouth, but only what is good for building up as the need may be...", "Ephesians 4:29")}
        `
      },
      {
        id: 's19',
        title: 'How to Offer Help Proactively but Respectfully',
        layout: 'text-only',
        content: `
          ${createList([
            "Approach <strong>politely</strong> and offer assistance without being <strong>intrusive</strong>."
          ])}
          ${createTip("Examples", `
             <p class="mb-2">“Hello Brother/Sister, may I help you with your bag?”</p>
             <p>“Would you like some assistance finding your seat?”</p>
          `)}
        `
      },
      {
        id: 's20',
        title: 'Health Care Scenario',
        layout: 'text-only',
        content: `
          <h3 class="text-xl font-bold text-orange-500 mb-2">Scenario:</h3>
          <p class="mb-6">A delegate brought to the hotel clinic is having difficulty understanding medical instructions.</p>
          
          <h3 class="text-xl font-bold text-orange-500 mb-2">Aware Approach:</h3>
          <p>With the help of the volunteers, healthcare providers should ensure that the <strong>patient receives information in their native language</strong> if possible. May use online translation tools to convey information properly.</p>
        `
      },
      {
        id: 's21',
        title: 'Addressing Cultural Missteps',
        layout: 'text-only',
        content: `
          ${createText("It is equally important to know how to address cultural missteps should they occur. These <strong>scenarios</strong> should be approached with empathy and a willingness to understand the guest's perspective.")}
          ${createList([
            "<strong>Listen Actively:</strong> Pay full attention to the guest's concerns to comprehend the issue thoroughly.",
            "Use <strong>clear and simple</strong> language to avoid misinterpretations.",
            "<strong>Apologize and Learn:</strong> Offer a sincere apology and take the opportunity to learn from the experience to prevent future occurrences.",
            "<strong>Implement Changes:</strong> Make necessary adjustments in practice or policy to ensure alignment with cultural expectations."
          ])}
          ${createScripture("Everyone must be quick to listen, slow to speak, slow to anger, for man’s anger does not bring about God’s righteousness.", "James 1:19-20")}
        `
      },
      {
        id: 's22',
        title: 'Addressing Cultural Missteps (Illustration)',
        layout: 'text-only',
        content: `
           <h3 class="text-xl font-bold mb-4">Key Reminders</h3>
           ${createList([
             "<strong>Apologize and Learn:</strong> Offer a sincere apology and take the opportunity to learn from the experience to prevent future occurrences.",
             "<strong>Implement Changes:</strong> Make necessary adjustments in practice or policy to ensure alignment with cultural expectations."
           ])}
           <p class="text-sm text-gray-500 italic mt-8">Approaching a delegate with humility and a sincere heart can resolve many misunderstandings.</p>
        `
      },
      {
        id: 's23',
        title: 'Tone & Phrasing Tips',
        layout: 'text-only',
        content: `
          ${createList([
            "Speak <strong>gently and clearly</strong>.",
            "Avoid <strong>commanding or abrupt</strong> language.",
            "Use <strong>short, polite</strong> sentences:"
          ])}
          <div class="pl-8 mb-6 italic text-gray-700">
             <p class="mb-1">– “Please take your time.”</p>
             <p class="mb-1">– “Let me check for you.”</p>
             <p>– “Would you prefer to rest first?”</p>
          </div>
          ${createScripture("A mild answer turns away rage, But a harsh word stirs up anger.", "Proverbs 15:1")}
        `
      },
      {
        id: 's24',
        title: 'Recognizing Signs of Discomfort or Confusion',
        layout: 'text-only',
        content: `
          ${createText("<strong>Be observant.</strong> Signs include:")}
          ${createList([
            "Hesitant smile or silence",
            "Stepping back or looking unsure",
            "Nodding without clear understanding"
          ])}
          ${createText("<strong>If noticed, gently clarify:</strong>")}
          <div class="pl-8 mb-6 italic text-gray-700">
             <p class="mb-1">– “Would you like me to explain again?”</p>
             <p>– “Is this comfortable for you?”</p>
          </div>
          ${createScripture("...clothe yourselves with the tender affections of compassion, kindness, humility, mildness, and patience. But besides all these things, clothe yourselves with love, for it is a perfect bond of union.", "Colossians 3:12–14")}
        `
      }
    ],
    files: [],
    quiz: {
      enabled: true,
      questions: [
        {
          id: 'q1',
          text: 'What is a generally safe "neutral distance" to maintain for personal space?',
          options: [
            'Touching shoulders',
            '1 to 1.5 meters (3 to 5 feet)',
            'Across the room'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q2',
          text: 'How should you handle a situation where a delegate arrives late for an event?',
          options: [
            'Scold them for not respecting time',
            'Be kind and considerate, understanding cultural differences',
            'Refuse them entry immediately'
          ],
          correctOptionIndex: 1
        },
        {
          id: 'q3',
          text: 'If a hand gesture might be misunderstood, what is the safest approach?',
          options: [
            'Use the gesture anyway',
            'Use clear verbal communication instead',
            'Stop communicating'
          ],
          correctOptionIndex: 1
        }
      ]
    },
    stats: { views: 0, completions: 0 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  },
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