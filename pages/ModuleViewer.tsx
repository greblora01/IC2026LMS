
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowRight, ArrowLeft, X, Award, Loader2, Menu, List, CheckCircle2, Circle, Type, Minus, Plus, Lock, Smartphone, Monitor
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, SlideBlock, Slide } from '../types';

interface ModuleViewerProps {
  previewModule?: Module;
  onExitPreview?: () => void;
}

// --- Components ---

const SlideFooter: React.FC<{ leftText?: string; rightText?: string, className?: string, isMobile?: boolean }> = ({ leftText, rightText, className = "", isMobile }) => (
  <div 
    className={`bg-[var(--primary)] flex items-center justify-between select-none ${className} ${isMobile ? 'px-6' : 'px-8'}`}
  >
    <span className={`text-white font-bold uppercase tracking-widest truncate mr-4 ${isMobile ? 'text-[12px]' : 'text-sm md:text-lg'}`}>
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className={`text-white font-bold uppercase tracking-widest truncate ${isMobile ? 'text-[12px]' : 'text-sm md:text-lg'}`}>
      {rightText || '2026 IC'}
    </span>
  </div>
);

const DesktopCanvasRenderer: React.FC<{ block: SlideBlock; textScale: number }> = ({ block, textScale }) => {
   const style: React.CSSProperties = {
     left: `${block.x}%`,
     top: `${block.y}%`,
     width: `${block.width}%`,
     height: `${block.height}%`,
     zIndex: block.zIndex || 1,
     transform: block.rotation ? `rotate(${block.rotation}deg)` : 'none',
     backgroundColor: block.style?.backgroundColor,
     borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
     opacity: block.style?.opacity,
     boxShadow: block.style?.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
     border: block.style?.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor || '#000'}` : 'none',
     color: block.style?.color || 'inherit'
   };

   const contentStyle: React.CSSProperties = {
       fontSize: `${textScale}em`, 
       height: '100%',
       width: '100%',
       color: 'inherit'
   };

   return (
     <div 
        className="absolute text-left overflow-hidden" 
        style={style}
     >
        {block.type === 'text' && (
           <div 
            style={contentStyle} 
            className="prose max-w-none p-2 h-full w-full slide-typography overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
            dangerouslySetInnerHTML={{ __html: block.content }} 
           />
        )}
        {block.type === 'image' && (
           <img src={block.content} alt="" className="w-full h-full object-cover" />
        )}
        {block.type === 'svg' && (
           <div className="w-full h-full flex items-center justify-center p-2" dangerouslySetInnerHTML={{ __html: block.content }} />
        )}
        {block.type === 'video' && (
           <video src={block.content} controls className="w-full h-full object-cover" />
        )}
        {block.type === 'youtube' && (
           <iframe src={block.content} className="w-full h-full border-0" allowFullScreen title="Video" />
        )}
        {block.type === 'shape' && (
           <div className="w-full h-full"></div>
        )}
     </div>
   );
};

/**
 * AdaptiveBlockRenderer: Optimized for Mobile Reading
 * This component "auto-formats" content by ignoring absolute positioning
 * and stacking elements with legible font sizes (min 16px).
 */
const AdaptiveBlockRenderer: React.FC<{ block: SlideBlock; textScale: number }> = ({ block, textScale }) => {
    const baseFontSize = 1.1 * textScale;
    
    const textStyle: React.CSSProperties = {
        fontSize: `${baseFontSize}rem`, 
        lineHeight: '1.6',
        color: block.style?.color || '#333333'
    };
 
    return (
      <div className="w-full mb-8 last:mb-0">
         {block.type === 'text' && (
            <div 
                className="w-full prose prose-lg max-w-none text-left slide-typography" 
                style={textStyle}
            >
               <style>{`
                  .adaptive-text p { font-size: 1em !important; margin-bottom: 1em; }
                  .adaptive-text h1 { font-size: 1.8em !important; font-weight: 900 !important; margin-bottom: 0.5em !important; color: var(--primary) !important; line-height: 1.1 !important; }
                  .adaptive-text h2 { font-size: 1.4em !important; font-weight: 800 !important; margin-bottom: 0.5em !important; }
                  .adaptive-text li { font-size: 1em !important; margin-bottom: 0.5em; }
               `}</style>
               <div 
                  className="adaptive-text"
                  dangerouslySetInnerHTML={{ __html: block.content }} 
               />
            </div>
         )}
         {block.type === 'image' && block.content && (
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
                <img src={block.content} alt="" className="w-full h-auto object-contain" />
            </div>
         )}
         {block.type === 'svg' && block.content && (
            <div className="rounded-2xl overflow-hidden shadow-md bg-white p-4 flex items-center justify-center min-h-[100px]" style={{ color: block.style?.color || 'inherit' }}>
                <div className="w-full max-w-xs" dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
         )}
         {block.type === 'video' && block.content && (
            <div className="rounded-2xl overflow-hidden shadow-md bg-black">
                <video src={block.content} controls className="w-full h-auto" />
            </div>
         )}
         {block.type === 'youtube' && block.content && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                <iframe src={block.content} className="absolute inset-0 w-full h-full border-0" allowFullScreen title="Video" />
            </div>
         )}
      </div>
    );
 };

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ previewModule, onExitPreview }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getModule, incrementModuleView, incrementModuleCompletion, isLoading: contextLoading } = useAppContext();
  
  const [module, setModule] = useState<Module | undefined>(previewModule);
  const [loading, setLoading] = useState(!previewModule);
  const [error, setError] = useState<string | null>(null);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(-1); 
  const [maxSlideIndexReached, setMaxSlideIndexReached] = useState(-1);

  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
  const [textScale, setTextScale] = useState(1.0); 
  const [dynamicScale, setDynamicScale] = useState(1);
  
  const [viewMode, setViewMode] = useState<'adaptive' | 'canvas'>(window.innerWidth < 1024 ? 'adaptive' : 'canvas');

  const CANVAS_BASE_WIDTH = 960;
  const CANVAS_BASE_HEIGHT = 540;

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        
        const screenWidth = window.innerWidth;
        const targetWidth = mobile ? screenWidth - 32 : CANVAS_BASE_WIDTH;
        const scale = mobile ? targetWidth / CANVAS_BASE_WIDTH : 1;
        setDynamicScale(scale);

        if (!mobile) setViewMode('canvas');
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (previewModule) {
      setModule(previewModule);
      setLoading(false);
      setAnswers(new Array(previewModule.quiz?.questions.length || 0).fill(-1));
      return;
    }
    if (!id) return;

    if (!contextLoading) {
      const foundModule = getModule(id);
      if(foundModule) {
         setModule(foundModule);
         if (!sessionStorage.getItem(`viewed_${id}`)) {
            incrementModuleView(id);
            sessionStorage.setItem(`viewed_${id}`, 'true');
         }
         setAnswers(new Array(foundModule.quiz?.questions.length || 0).fill(-1));
         setError(null);
      } else {
         setError("Module not found.");
      }
      setLoading(false);
    }
  }, [id, getModule, previewModule, contextLoading, incrementModuleView]);

  useEffect(() => {
    if (currentSlideIndex > maxSlideIndexReached) {
        setMaxSlideIndexReached(currentSlideIndex);
    }
  }, [currentSlideIndex, maxSlideIndexReached]);

  if (loading || contextLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[var(--primary)] mb-6" size={48} />
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Training...</p>
    </div>
  );
  
  if (error || !module) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <X size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-gray-900 mb-4">Module Unreachable</h2>
        <button onClick={() => navigate('/')} className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-black">Back to Home</button>
    </div>
  );

  const slides = module.slides || [];
  const totalSlides = slides.length;
  const maxIndex = module.quiz?.enabled ? totalSlides : totalSlides - 1;
  const isQuizStep = currentSlideIndex === totalSlides;

  const handleNext = () => {
    if (currentSlideIndex === totalSlides - 1 && !module.quiz?.enabled) {
       setShowCertificate(true);
    } else if (currentSlideIndex < maxIndex) {
      setCurrentSlideIndex(prev => prev + 1);
      if (isMobile) setIsSidebarOpen(false);
    }
  };

  const jumpToSlide = (index: number) => {
      if (index > maxSlideIndexReached + 1) return;
      setCurrentSlideIndex(index);
      setShowCertificate(false);
      if (isMobile) setIsSidebarOpen(false);
  };

  const renderSidebar = () => {
    const sidebarClasses = isMobile 
        ? `fixed inset-y-0 left-0 z-50 w-[85%] sm:w-80 transform transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `w-80 border-r border-gray-100 bg-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 w-0 min-w-0 overflow-hidden'}`;

    return (
    <>
        {isSidebarOpen && isMobile && (
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
        <aside className={`${sidebarClasses} bg-white h-full overflow-hidden flex flex-col shrink-0 text-left`}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2 truncate">Training Outline</h3>
                {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"><X size={18} /></button>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <button 
                    onClick={() => jumpToSlide(-1)}
                    className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all ${currentSlideIndex === -1 ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                   <span className="text-xs font-black uppercase tracking-widest">Introduction</span>
                </button>
                {slides.map((slide, idx) => {
                    const isLocked = idx > maxSlideIndexReached + 1;
                    const isCompleted = idx <= maxSlideIndexReached;
                    return (
                        <button 
                            key={slide.id}
                            disabled={isLocked}
                            onClick={() => jumpToSlide(idx)}
                            className={`w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all ${currentSlideIndex === idx ? 'bg-[var(--primary)] text-white shadow-lg' : isLocked ? 'opacity-30' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            {isLocked ? <Lock size={12} className="mt-1" /> : isCompleted ? <CheckCircle2 size={14} className="mt-1 text-green-500" /> : <Circle size={14} className="mt-1" />}
                            <span className="text-xs font-bold leading-tight line-clamp-2">{slide.title || `Lesson ${idx + 1}`}</span>
                        </button>
                    );
                })}
                {module.quiz?.enabled && (
                    <button 
                        disabled={totalSlides > maxSlideIndexReached + 1}
                        onClick={() => jumpToSlide(totalSlides)}
                        className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all ${currentSlideIndex === totalSlides ? 'bg-[var(--primary)] text-white shadow-lg' : 'opacity-30'}`}
                    >
                         <Award size={14} />
                         <span className="text-xs font-black uppercase tracking-widest">Knowledge Check</span>
                    </button>
                )}
            </div>
        </aside>
    </>
  )};

  const renderContent = () => {
    if (showCertificate) return (
       <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-8 text-center bg-white rounded-[2rem] shadow-2xl border border-gray-50 m-4 md:m-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
          <Award className="w-16 h-16 md:w-20 md:h-20 text-[var(--primary)] mb-6" />
          <h1 className="text-2xl md:text-5xl font-black mb-2 text-gray-900 tracking-tighter">Congratulations!</h1>
          <p className="text-gray-400 font-medium mb-10 max-w-md mx-auto text-sm md:text-base">You have completed: <br/><span className="text-gray-900 font-bold">{module.title}</span></p>
          <button onClick={() => navigate('/')} className="bg-[var(--primary)] text-white px-12 py-4 rounded-2xl font-black shadow-2xl shadow-orange-100 uppercase tracking-widest text-xs">Finish Course</button>
       </div>
    );

    if (currentSlideIndex === -1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-8 animate-in fade-in duration-700">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-8">
             <FileText size={32} />
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 leading-tight">{module.title}</h1>
          <p className="text-sm md:text-xl text-gray-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">{module.description}</p>
          <button onClick={handleNext} className="bg-[var(--primary)] text-white px-10 py-4 rounded-2xl font-black text-base shadow-2xl flex items-center gap-3 transition-all active:scale-95 uppercase tracking-widest">
            Begin Module <ArrowRight size={18} />
          </button>
        </div>
      );
    }

    if (isQuizStep) {
       return (
          <div className="max-w-4xl mx-auto p-6 md:p-8 animate-in fade-in duration-500 pb-40 h-full overflow-y-auto">
             <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-8 text-left">Knowledge Check</h2>
             {quizSubmitted ? (
                <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-xl text-center border border-gray-50">
                   <div className="text-4xl md:text-5xl font-black text-[var(--primary)] mb-2">{score}%</div>
                   <h3 className="text-sm md:text-xl font-bold mb-8 text-gray-400 uppercase tracking-widest">Overall Score</h3>
                   <button onClick={() => setShowCertificate(true)} className="bg-[var(--primary)] text-white px-12 py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">View Certificate</button>
                </div>
             ) : (
                <div className="space-y-6">
                   {module.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
                         <div className="font-black text-base md:text-lg mb-6 text-gray-900 flex gap-3">
                            <span className="text-[var(--primary)]">{qi+1}.</span> <span>{q.text}</span>
                         </div>
                         <div className="space-y-3">
                            {q.options.map((opt, oi) => (
                               <label key={oi} className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${answers[qi] === oi ? 'border-[var(--primary)] bg-orange-50' : 'border-gray-50 bg-gray-50'}`}>
                                  <input type="radio" checked={answers[qi] === oi} onChange={() => {
                                     const newAns = [...answers]; newAns[qi] = oi; setAnswers(newAns);
                                  }} className="mt-1 accent-[var(--primary)] w-5 h-5" />
                                  <span className="text-sm font-bold text-gray-700">{opt}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   ))}
                   <button onClick={() => {
                      let correct = 0;
                      module.quiz.questions.forEach((q, i) => { if (answers[i] === q.correctOptionIndex) correct++; });
                      setScore(Math.round((correct / module.quiz.questions.length) * 100));
                      setQuizSubmitted(true);
                   }} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs mt-8">Submit Assessment</button>
                </div>
             )}
          </div>
       );
    }

    const slide = slides[currentSlideIndex];
    if (!slide) return null;
    
    // --- MODE: ADAPTIVE (Auto-Format Stacked View) ---
    if (isMobile && viewMode === 'adaptive') {
        const sortedBlocks = [...(slide.blocks || [])].sort((a, b) => (a.y || 0) - (b.y || 0));
        return (
            <div className="flex-1 w-full flex flex-col items-center bg-[#F8F9FA] overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-3xl px-6 pt-10 pb-40 flex-1">
                    <div className="flex items-center gap-2 mb-8 text-[var(--primary)]/60">
                        <Smartphone size={16} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Adaptive View Active</span>
                    </div>
                    {sortedBlocks.map(block => (
                        <AdaptiveBlockRenderer key={block.id} block={block} textScale={textScale} />
                    ))}
                </div>
                {/* Visual anchor for the slide end */}
                <div className="w-full shrink-0">
                    <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} className="h-16" isMobile />
                </div>
            </div>
        );
    }

    // --- MODE: CANVAS (Original spatial layout) ---
    return (
        <div 
            className="flex-1 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto overflow-x-hidden p-4 md:p-8"
        >
            <style>{`
               .slide-typography h1 { font-size: ${5 * textScale}vh; line-height: 1.1; margin-bottom: 0.5em; font-weight: 900; }
               .slide-typography h2 { font-size: ${4 * textScale}vh; line-height: 1.2; margin-bottom: 0.5em; font-weight: 800; }
               .slide-typography p, .slide-typography li, .slide-typography span, .slide-typography div { font-size: ${2.6 * textScale}vh; line-height: 1.6; font-weight: 500; }
               @media (max-width: 1023px) {
                   .slide-typography h1 { font-size: ${4.5 * textScale}vw; }
                   .slide-typography h2 { font-size: ${3.8 * textScale}vw; }
                   .slide-typography p, .slide-typography li, .slide-typography span, .slide-typography div { font-size: ${3.4 * textScale}vw; }
               }
            `}</style>

            <div 
                className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden aspect-[16/9] w-full max-w-full rounded-xl md:rounded-2xl transition-all duration-500 ease-out text-left"
                style={{
                    width: isMobile ? undefined : `${CANVAS_BASE_WIDTH}px`,
                    height: isMobile ? undefined : `${CANVAS_BASE_HEIGHT}px`,
                    maxWidth: isMobile ? '100%' : `${CANVAS_BASE_WIDTH}px`,
                    transform: isMobile ? `scale(${dynamicScale})` : 'none',
                    transformOrigin: 'top center',
                    backgroundColor: slide.backgroundColor || '#ffffff',
                    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                    backgroundSize: 'cover'
                }}
            >
                {slide.blocks?.map(block => <DesktopCanvasRenderer key={block.id} block={block} textScale={textScale} />)}
                <div className="absolute bottom-0 w-full">
                    <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} className="h-[12%]" isMobile={isMobile} />
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden">
       {/* Global Navigation Header */}
       <div className="h-14 md:h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-3 md:gap-6 overflow-hidden flex-1">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                  <Menu size={20} />
              </button>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-black text-gray-900 truncate text-[10px] md:text-sm leading-tight uppercase tracking-tight">{module.title}</span>
                <span className="text-[8px] md:text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                    {currentSlideIndex === -1 ? 'Introduction' : isQuizStep ? 'Assessment' : `Lesson ${currentSlideIndex + 1} of ${totalSlides}`}
                </span>
              </div>
          </div>
          <button onClick={() => onExitPreview ? onExitPreview() : navigate('/')} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
              <X size={18} strokeWidth={3} />
          </button>
       </div>

       <div className="flex flex-1 overflow-hidden relative">
           {renderSidebar()}
           <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F4F4]">
              <div className="flex-1 w-full overflow-hidden relative flex flex-col">
                  {renderContent()}
              </div>
              
              {/* Bottom Task Bar */}
              {!showCertificate && currentSlideIndex > -1 && (
                <div className="h-20 md:h-24 bg-white/95 backdrop-blur-md border-t px-4 md:px-8 flex justify-between items-center z-30 shrink-0 shadow-xl">
                    <button onClick={() => setCurrentSlideIndex(p => p - 1)} className={`flex items-center gap-2 px-3 md:px-4 py-3 rounded-xl font-bold transition-all text-[10px] md:text-xs uppercase tracking-widest ${currentSlideIndex === -1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'}`}>
                        <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
                    </button>
                    
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* THE AUTO-FORMAT TOGGLE */}
                        {isMobile && (
                            <button 
                                onClick={() => setViewMode(viewMode === 'adaptive' ? 'canvas' : 'adaptive')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all border-2 ${viewMode === 'adaptive' ? 'bg-orange-50 border-[var(--primary)]/30 text-[var(--primary)]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                title="Auto-Format Toggle"
                            >
                                {viewMode === 'adaptive' ? <Smartphone size={14} /> : <Monitor size={14} />}
                                <span>{viewMode === 'adaptive' ? 'Readable' : 'Original'}</span>
                            </button>
                        )}

                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-100">
                            <button onClick={() => setTextScale(Math.max(0.7, textScale - 0.1))} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all shadow-sm"><Minus size={14} /></button>
                            <span className="text-[9px] font-black uppercase text-gray-300 w-12 text-center">Zoom</span>
                            <button onClick={() => setTextScale(Math.min(2.0, textScale + 0.1))} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all shadow-sm"><Plus size={14} /></button>
                        </div>
                    </div>

                    <button onClick={handleNext} className="bg-[var(--primary)] text-white px-6 md:px-12 py-3 md:py-4 rounded-xl font-black shadow-2xl shadow-orange-100 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 md:gap-3 hover:opacity-90 active:scale-95 transition-all">
                    {isQuizStep ? 'Finish' : currentSlideIndex === totalSlides - 1 ? (module.quiz?.enabled ? 'Take Quiz' : 'Finish') : 'Continue'} <ArrowRight size={16} strokeWidth={3} />
                    </button>
                </div>
              )}
           </main>
       </div>
    </div>
  );
};
