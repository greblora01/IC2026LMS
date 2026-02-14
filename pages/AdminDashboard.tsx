
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, BarChart2, BookOpen, Eye, 
  Cloud, HardDrive, Settings, PlayCircle, X, Home, Tag
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, Slide } from '../types';

// Helper component to render a slide preview
const SlidePreview: React.FC<{ slide: Slide; footerLeft?: string; footerRight?: string }> = ({ slide, footerLeft, footerRight }) => {
  const BASE_WIDTH = 960;
  const BASE_HEIGHT = 540;
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(0.8)`, // Increased scale for larger preview detail
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
                fontSize: block.style?.fontSize ? `${block.style.fontSize * 3}px` : '42px',
                fontWeight: block.style?.fontWeight || 'normal',
                fontStyle: block.style?.fontStyle || 'normal',
                textDecoration: block.style?.textDecoration || 'none',
                fontFamily: block.style?.fontFamily || 'inherit'
              }}
              className="overflow-hidden"
            >
               {block.type === 'text' && (
                  <div 
                    className="w-full h-full p-2" 
                    dangerouslySetInnerHTML={{ __html: block.content }} 
                  />
               )}
               {block.type === 'plain-text' && (
                  <div className="w-full h-full p-2 whitespace-pre-wrap">{block.content}</div>
               )}
               {block.type === 'image' && block.content && (
                  <img src={block.content} className="w-full h-full object-cover" alt="" />
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

export const AdminDashboard: React.FC = () => {
  const { modules, isCloud } = useAppContext();
  const navigate = useNavigate();
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  const getThumbnailSlide = (module: Module) => {
    if (module.thumbnailSlideId) {
      return module.slides.find(s => s.id === module.thumbnailSlideId) || module.slides[0];
    }
    return module.slides[0];
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 text-left">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter">Admin Portal</h1>
            <Link to="/" className="p-3 bg-white border rounded-2xl text-gray-400 hover:text-[var(--primary)] shadow-sm transition-all flex items-center gap-2 font-bold text-sm">
              <Home size={18} /> View Student Site
            </Link>
          </div>
          <p className="text-gray-500 font-medium text-xl">Manage your training modules and monitor volunteer engagement.</p>
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${isCloud ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isCloud ? <><Cloud size={14} /> Cloud Storage Active</> : <><HardDrive size={14} /> Local Storage Only</>}
          </div>
        </div>
        <Link
          to="/create"
          className="bg-[var(--primary)] text-white px-12 py-6 rounded-[2.5rem] flex items-center gap-4 font-black text-xl hover:opacity-95 transition-all shadow-2xl shadow-orange-200 active:scale-95"
        >
          <Plus size={28} strokeWidth={3} /> Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Analytics Summary */}
        <div className="col-span-full bg-white rounded-[3rem] p-12 shadow-xl border-4 border-[var(--primary)]/10 mb-6 flex flex-col md:flex-row items-center justify-between gap-10 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex-1 relative z-10">
              <h2 className="text-xs font-black text-[var(--primary)] uppercase tracking-[0.4em] mb-6">Aggregate Performance</h2>
              <div className="flex flex-wrap gap-12 md:gap-20">
                <div>
                  <div className="text-6xl font-black text-gray-900 tabular-nums">{modules.length}</div>
                  <div className="text-[11px] font-black text-gray-400 uppercase mt-2 tracking-widest">Modules</div>
                </div>
                <div className="w-px h-16 bg-gray-100 hidden sm:block"></div>
                <div>
                  <div className="text-6xl font-black text-gray-900 tabular-nums">{modules.reduce((acc, m) => acc + (m.stats?.completions || 0), 0)}</div>
                  <div className="text-[11px] font-black text-gray-400 uppercase mt-2 tracking-widest">Total Completions</div>
                </div>
              </div>
            </div>
            <div className="w-28 h-28 bg-[var(--primary)] text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-200 relative z-10">
               <BarChart2 size={56} />
            </div>
        </div>

        {modules.length === 0 ? (
          <div className="col-span-full text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
               <BookOpen size={48} className="text-gray-200" />
            </div>
            <h3 className="text-4xl font-black text-gray-800 mb-4">Your library is empty</h3>
            <p className="text-gray-400 mb-12 max-w-md mx-auto font-medium text-xl leading-relaxed">Ready to build something amazing? Start with a template or a blank canvas.</p>
            <Link to="/create" className="inline-flex bg-[var(--primary)] text-white px-14 py-6 rounded-[2.5rem] font-black text-xl hover:opacity-95 shadow-2xl active:scale-95 transition-all">Get Started</Link>
          </div>
        ) : (
          modules.map((module) => (
            <div 
              key={module.id} 
              className="bg-white rounded-[3rem] border-4 border-transparent hover:border-[var(--primary)]/20 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group relative transform hover:-translate-y-2 cursor-pointer"
              onClick={() => setActiveOverlayId(module.id)}
            >
              {/* Cover Image Area */}
              <div className="h-96 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
                {module.thumbnail ? (
                  <div className="w-full h-full overflow-hidden">
                    <img 
                      src={module.thumbnail} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt={module.title} 
                    />
                  </div>
                ) : (
                  <div className="w-full h-full scale-[1.0] transition-transform duration-700 group-hover:scale-[1.02]">
                    <SlidePreview 
                        slide={getThumbnailSlide(module)} 
                        footerLeft={module.footerTextLeft} 
                        footerRight={module.footerTextRight} 
                    />
                  </div>
                )}

                {/* Integrated Card Overlay */}
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center p-12 gap-6 z-40 ${activeOverlayId === module.id ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0'}`}>
                   <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/view/${module.id}`); }}
                      className="w-full max-w-xs bg-[var(--primary)] text-white py-6 rounded-3xl font-black flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-[0.2em] text-lg"
                   >
                      <PlayCircle size={32} strokeWidth={2.5} /> Preview
                   </button>
                   <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/edit/${module.id}`); }}
                      className="w-full max-w-xs bg-white text-gray-900 py-6 rounded-3xl font-black flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-[0.2em] text-lg"
                   >
                      <Settings size={32} strokeWidth={2.5} /> Edit
                   </button>
                   
                   <button 
                      onClick={(e) => { e.stopPropagation(); setActiveOverlayId(null); }}
                      className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2"
                   >
                      <X size={32} strokeWidth={3} />
                   </button>
                </div>

                <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-2.5 text-[11px] font-black text-gray-800 shadow-2xl uppercase tracking-[0.2em] border border-white/50 border-l-4 border-l-[var(--primary)] z-10 flex items-center gap-2">
                   <Tag size={12} className="text-[var(--primary)]" /> {module.category || 'UNCATEGORIZED'}
                </div>
              </div>

              {/* Card Footer Content */}
              <div className="p-10 flex-1 text-left flex flex-col relative bg-white">
                <div className="absolute top-0 right-10 -translate-y-1/2 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[var(--primary)] border-2 border-gray-50 z-10">
                   <BookOpen size={28} />
                </div>
                <h3 className="font-black text-3xl leading-tight text-gray-900 mb-4 line-clamp-2 pr-12">{module.title}</h3>
                <p className="text-gray-500 line-clamp-2 mb-10 font-medium text-lg leading-relaxed flex-1">{module.description || 'Custom interactive training program'}</p>
                <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-auto">
                  <span className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl">
                    <Eye size={18} className="text-[var(--primary)]" /> <span>{(module.stats?.views || 0)} Views</span>
                  </span>
                  <span className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl">
                    <CheckCircle2 size={18} className="text-[var(--primary)]" /> <span>{module.slides.length} Slides</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Internal icon helper
const CheckCircle2 = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
