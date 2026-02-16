
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { BookOpen, Users, Building2, HeartHandshake, Settings, PlayCircle, Calendar } from 'lucide-react';
import { Module, Slide } from '../types';

/**
 * Philippines 2026 Logo Component
 * Uses the official brand image for maximum fidelity.
 */
export const Philippines2026Logo: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <img 
    src="https://cdn.jwevent.org/assets/2026-co-ph-902d/pictures/fbca443c-af24-4d1b-abbe-c8d429cc71fc.svg" 
    alt="Philippines 2026"
    className={`${className} object-contain transition-opacity duration-500`}
    onError={(e) => {
      // Simple fallback if image fails to load
      e.currentTarget.style.display = 'none';
    }}
  />
);

const SlidePreview: React.FC<{ slide: Slide; footerLeft?: string; footerRight?: string }> = ({ slide, footerLeft, footerRight }) => {
  const BASE_WIDTH = 960;
  const BASE_HEIGHT = 540;
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(0.4)`, 
          transformOrigin: 'top left',
          backgroundColor: slide.backgroundColor || '#ffffff',
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover'
        }}
        className="absolute top-0 left-0 pointer-events-none"
      >
         {slide.blocks?.map(block => (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                zIndex: block.zIndex || 1,
                transform: block.rotation ? `rotate(${block.rotation}deg)` : 'none',
                backgroundColor: block.style?.backgroundColor,
                borderRadius: block.style?.borderRadius ? `${block.style.borderRadius * 3}px` : undefined,
                opacity: block.style?.opacity,
                border: block.style?.borderWidth ? `${block.style.borderWidth * 3}px solid ${block.style.borderColor || '#000'}` : 'none',
                color: block.style?.color || 'inherit',
              }}
              className="overflow-hidden"
            >
               {block.type === 'text' && (
                  <div 
                    className="w-full h-full p-2" 
                    style={{ fontSize: '32px' }}
                    dangerouslySetInnerHTML={{ __html: block.content }} 
                  />
               )}
               {block.type === 'image' && block.content && (
                  <img src={block.content} className="w-full h-full object-cover" alt="" />
               )}
               {block.type === 'svg' && block.content && (
                  <div className="w-full h-full flex items-center justify-center p-2" dangerouslySetInnerHTML={{ __html: block.content }} />
               )}
            </div>
         ))}
         
         <div className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] h-[12%] flex items-center justify-between px-10">
            <span className="text-white font-bold uppercase tracking-widest text-2xl">
              {footerLeft || 'VOLUNTEER TRAINING'}
            </span>
            <span className="text-white font-bold uppercase tracking-widest text-2xl">
              {footerRight || '2026 IC'}
            </span>
         </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { modules } = useAppContext();
  const navigate = useNavigate();

  const categories = [
    { 
      code: 'GVM', 
      title: 'General Volunteers Modules', 
      description: 'Foundational training for all volunteers participating in ICPH2026.',
      icon: <Users className="text-blue-600" size={24} />,
      bgColor: 'bg-blue-50',
      accentColor: 'border-blue-200'
    },
    { 
      code: 'CCVM', 
      title: 'Convention Committee Volunteers', 
      description: 'Specific training for committee members handling operational logistics.',
      icon: <Building2 className="text-purple-600" size={24} />,
      bgColor: 'bg-purple-50',
      accentColor: 'border-purple-200'
    },
    { 
      code: 'HCVM', 
      title: 'Hospitality Committee Volunteers', 
      description: 'Specialized training for providing exceptional care and support to delegates.',
      icon: <HeartHandshake className="text-orange-600" size={24} />,
      bgColor: 'bg-orange-50',
      accentColor: 'border-orange-200'
    }
  ];

  const filterModules = (code: string) => modules.filter(m => m.category === code);

  const getThumbnailSlide = (module: Module) => {
    if (module.thumbnailSlideId) {
      return module.slides.find(s => s.id === module.thumbnailSlideId) || module.slides[0];
    }
    return module.slides[0];
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-left">
      <header className="bg-white border-b px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <Philippines2026Logo className="w-8 h-8 md:w-10 md:h-10" />
          <span className="font-black text-base md:text-xl tracking-tighter text-gray-900 uppercase">ICPH2026</span>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="p-2 md:px-4 md:py-2 text-gray-500 hover:text-[var(--primary)] hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 font-bold text-[10px] md:text-xs uppercase tracking-widest"
        >
          <Settings size={25} /> <span>Admin Portal</span>
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10">
        <div className="text-center mb-12 md:mb-24 mt-4 md:mt-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-32 h-32 md:w-56 md:h-56 bg-transparent flex items-center justify-center mx-auto mb-8 md:mb-12 relative group hover:scale-105 transition-transform duration-500 p-4">
            <Philippines2026Logo className="w-full h-full relative z-10" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-4 md:mb-8 leading-tight px-4">
            Welcome to <span className="text-[var(--primary)]">ICPH2026 LMS</span>
          </h1>
          <p className="text-sm md:text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed px-6">
            Your centralized gateway for volunteer excellence. Access specialized training modules tailored to your specific role and team.
          </p>
        </div>

        <div className="space-y-20 md:space-y-32">
          {categories.map((cat) => {
            const catModules = filterModules(cat.code);
            return (
              <section key={cat.code} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6 border-b border-gray-100 pb-8 md:pb-12">
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 ${cat.bgColor} rounded-xl shadow-sm border ${cat.accentColor}`}>
                        {cat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-[9px] uppercase tracking-[0.4em] text-[var(--primary)]">Category Code</span>
                        <span className="font-black text-xl text-gray-900">{cat.code}</span>
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 md:mb-4">{cat.title}</h2>
                    <p className="text-xs md:text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">{cat.description}</p>
                  </div>
                  <div className="bg-white px-6 py-3 md:py-5 rounded-2xl shadow-sm border border-gray-100 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-1 min-w-[140px]">
                    <span className="text-2xl md:text-4xl font-black text-[var(--primary)]">{catModules.length}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Modules Available</span>
                  </div>
                </div>

                {catModules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {catModules.map((module) => (
                      <div 
                        key={module.id} 
                        onClick={() => navigate(`/view/${module.id}`)}
                        className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-transparent hover:border-[var(--primary)]/30 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col h-full"
                      >
                        <div className="aspect-[16/10] relative overflow-hidden bg-gray-50 border-b border-gray-50">
                          {module.thumbnail ? (
                            <img src={module.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={module.title} />
                          ) : (
                            <div className="w-full h-full">
                               <SlidePreview 
                                  slide={getThumbnailSlide(module)} 
                                  footerLeft={module.footerTextLeft} 
                                  footerRight={module.footerTextRight} 
                               />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                            <div className="bg-white text-gray-900 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                              <PlayCircle size={18} className="text-[var(--primary)]" /> START LEARNING
                            </div>
                          </div>
                        </div>
                        <div className="p-6 md:p-10 text-left flex-1 flex flex-col">
                          <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-2 md:mb-4 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors duration-300">{module.title}</h3>
                          <p className="text-gray-500 line-clamp-2 mb-6 md:mb-10 font-medium text-xs md:text-base leading-relaxed flex-1">
                            {module.description || 'No specialized description provided for this module.'}
                          </p>
                          <div className="flex items-center justify-between text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 border-t border-gray-50 pt-6 md:pt-8">
                            <div className="flex items-center gap-2">
                               <BookOpen size={14} className="text-[var(--primary)]" />
                               <span>{module.slides.length} Lessons</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Calendar size={14} />
                               <span>{new Date(module.lastUpdated).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-4 border-dashed border-gray-100 rounded-[2.5rem] md:rounded-[4rem] py-16 md:py-32 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 md:mb-8">
                        <BookOpen size={32} className="text-gray-100" />
                    </div>
                    <h3 className="text-xl font-black text-gray-200 tracking-tighter mb-2 uppercase">No Modules Categorized</h3>
                    <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">Courses for the <span className="text-[var(--primary)]">{cat.code}</span> category will appear here once published.</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <footer className="bg-white border-t mt-20 md:mt-40 py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-lg">I</div>
                <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">ICPH2026 LMS</span>
              </div>
              <p className="text-gray-400 font-medium text-center md:text-left max-w-xs text-xs md:text-sm">Centralized training portal for International Convention volunteers.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Navigation</span>
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-[var(--primary)] font-bold text-xs text-left">Admin Portal</button>
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-gray-600 hover:text(--primary) font-bold text-xs text-left">Top</button>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-300 text-[10px] font-black uppercase tracking-widest text-center">
              © 2026 International Convention Hospitality Committee 3 - VM Trainers
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
