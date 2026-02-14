
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowRight, ArrowLeft, X, Award, Loader2, Menu, List, CheckCircle2, Circle, Type, Minus, Plus, RefreshCw, Lock
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, SlideBlock, Slide } from '../types';

interface ModuleViewerProps {
  previewModule?: Module;
  onExitPreview?: () => void;
}

// --- Components ---

const SlideFooter: React.FC<{ leftText?: string; rightText?: string, className?: string }> = ({ leftText, rightText, className = "" }) => (
  <div 
    className={`bg-[var(--primary)] flex items-center justify-between px-6 md:px-8 py-2 md:py-3 select-none ${className}`}
  >
    <span className="text-white font-bold uppercase tracking-widest text-sm md:text-lg truncate mr-4">
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className="text-white font-bold uppercase tracking-widest text-sm md:text-lg truncate">
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
   };

   const contentStyle: React.CSSProperties = {
       fontSize: `${textScale}em`, 
       height: '100%',
       width: '100%',
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

const MobileStackRenderer: React.FC<{ block: SlideBlock; textScale: number }> = ({ block, textScale }) => {
    const style: React.CSSProperties = {
      backgroundColor: block.style?.backgroundColor,
      borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
      opacity: block.style?.opacity,
      boxShadow: block.style?.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      border: block.style?.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor || '#000'}` : 'none',
      padding: block.type === 'text' ? '0' : '0'
    };

    // Base font size for mobile is larger to avoid "too small" look
    const textStyle: React.CSSProperties = {
        fontSize: `${1.1 * textScale}rem`,
        lineHeight: '1.6'
    };
 
    return (
      <div className="w-full mb-8 last:mb-0 relative" style={style}>
         {block.type === 'text' && (
            <div 
                className="w-full prose prose-base max-w-none text-[var(--text-color)] slide-typography" 
                style={textStyle}
                dangerouslySetInnerHTML={{ __html: block.content }} 
            />
         )}
         {block.type === 'image' && (
            <img src={block.content} alt="" className="w-full h-auto rounded-xl shadow-md border border-gray-100" />
         )}
         {block.type === 'video' && (
            <video src={block.content} controls className="w-full h-auto rounded-xl shadow-md" />
         )}
         {block.type === 'youtube' && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                <iframe src={block.content} className="absolute inset-0 w-full h-full border-0" allowFullScreen title="Video" />
            </div>
         )}
         {block.type === 'shape' && (
            <div className="w-full h-24 rounded-xl bg-gray-50 border border-gray-100"></div>
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
  const [userName, setUserName] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
  const [textScale, setTextScale] = useState(1.0); // Default to 1.0 for better initial visibility

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
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
         setError("Module not found. Please check the URL and try again.");
      }
      setLoading(false);
    }
  }, [id, getModule, previewModule, contextLoading, incrementModuleView]);

  useEffect(() => {
    if (currentSlideIndex > maxSlideIndexReached) {
        setMaxSlideIndexReached(currentSlideIndex);
    }
  }, [currentSlideIndex, maxSlideIndexReached]);

  useEffect(() => {
    if (showCertificate && module?.id) {
      if (!sessionStorage.getItem(`completed_${module.id}`)) {
        incrementModuleCompletion(module.id);
        sessionStorage.setItem(`completed_${module.id}`, 'true');
      }
    }
  }, [showCertificate, module?.id, incrementModuleCompletion]);

  if (loading || contextLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[var(--primary)] mb-6" size={64} />
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Syncing Content...</p>
    </div>
  );
  
  if (error || !module) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
            {/* Fixed: Removed md:size prop */}
            <X size={40} strokeWidth={3} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Module Unreachable</h2>
        <p className="text-gray-500 mb-10 max-w-md mx-auto text-base md:text-lg leading-relaxed font-medium">{error || "The requested training module could not be retrieved."}</p>
        <button onClick={() => navigate('/')} className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all">Back to Home</button>
    </div>
  );

  const slides = module.slides || [];
  const totalSlides = slides.length;
  const maxIndex = module.quiz?.enabled ? totalSlides : totalSlides - 1;
  const isQuizStep = currentSlideIndex === totalSlides;

  const getSortedBlocks = (slide: Slide) => {
    if (!slide.blocks) return [];
    return [...slide.blocks].sort((a, b) => {
        const yDiff = (a.y || 0) - (b.y || 0);
        if (Math.abs(yDiff) > 5) return yDiff;
        return (a.x || 0) - (b.x || 0);
    });
  };

  const handleNext = () => {
    if (currentSlideIndex === totalSlides - 1 && !module.quiz?.enabled) {
       setShowCertificate(true);
    } else if (currentSlideIndex < maxIndex) {
      setCurrentSlideIndex(prev => prev + 1);
      if (isMobile) setIsSidebarOpen(false);
    }
  };

  const submitQuiz = () => {
    let correct = 0;
    module.quiz.questions.forEach((q, i) => { if (answers[i] === q.correctOptionIndex) correct++; });
    setScore(Math.round((correct / module.quiz.questions.length) * 100));
    setQuizSubmitted(true);
  };

  const jumpToSlide = (index: number) => {
      if (index > maxSlideIndexReached + 1) {
          alert("Please complete the current topic first.");
          return;
      }
      setCurrentSlideIndex(index);
      setShowCertificate(false);
      if (isMobile) setIsSidebarOpen(false);
  };

  const renderSidebar = () => {
    const sidebarClasses = isMobile 
        ? `fixed inset-y-0 left-0 z-50 w-[85%] sm:w-80 transform transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `w-[20%] min-w-[280px] border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 w-0 min-w-0 overflow-hidden'}`;

    return (
    <>
        {isSidebarOpen && isMobile && (
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
        
        <aside className={`${sidebarClasses} bg-white h-full overflow-hidden flex flex-col shrink-0`}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2 truncate"><List size={16} /> Course Outline</h3>
                {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"><X size={20} /></button>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                <button 
                    onClick={() => jumpToSlide(-1)}
                    className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-3 transition-all ${currentSlideIndex === -1 ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                   <div className={`w-2 h-2 rounded-full ${currentSlideIndex === -1 ? 'bg-white' : 'bg-gray-300'}`} />
                   <span className="text-sm font-black uppercase tracking-widest">Introduction</span>
                </button>
                
                {slides.map((slide, idx) => {
                    const isLocked = idx > maxSlideIndexReached + 1;
                    const isCompleted = idx <= maxSlideIndexReached;
                    
                    return (
                        <button 
                            key={slide.id}
                            disabled={isLocked}
                            onClick={() => jumpToSlide(idx)}
                            className={`w-full text-left px-4 py-4 rounded-xl flex items-start gap-3 transition-all ${currentSlideIndex === idx ? 'bg-[var(--primary)] text-white shadow-lg' : isLocked ? 'opacity-40 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                            {isLocked ? (
                                <Lock size={14} className="mt-1 shrink-0" />
                            ) : isCompleted ? (
                                <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${currentSlideIndex === idx ? 'text-white' : 'text-green-500'}`} />
                            ) : (
                                <Circle size={16} className={`mt-0.5 shrink-0 ${currentSlideIndex === idx ? 'text-white' : 'text-gray-300'}`} />
                            )}
                            <span className={`text-sm leading-tight tracking-tight ${currentSlideIndex === idx ? 'font-black' : 'font-bold'}`}>
                                {slide.title || `Lesson ${idx + 1}`}
                            </span>
                        </button>
                    );
                })}

                {module.quiz?.enabled && (
                    <button 
                        disabled={totalSlides > maxSlideIndexReached + 1}
                        onClick={() => jumpToSlide(totalSlides)}
                        className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-3 transition-all ${currentSlideIndex === totalSlides ? 'bg-[var(--primary)] text-white shadow-lg' : (totalSlides > maxSlideIndexReached + 1) ? 'opacity-40 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                         <Award size={16} className={`${currentSlideIndex === totalSlides ? 'text-white' : 'text-gray-400'}`} />
                         <span className="text-sm font-black uppercase tracking-widest">Knowledge Check</span>
                         {totalSlides > maxSlideIndexReached + 1 && <Lock size={12} className="ml-auto" />}
                    </button>
                )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex justify-between">
                    <span>Overall Progress</span>
                    <span className="text-[var(--primary)]">{Math.round(((maxSlideIndexReached + 1) / (maxIndex + 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[var(--primary)] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,127,32,0.4)]" 
                        style={{ width: `${((maxSlideIndexReached + 1) / (maxIndex + 1)) * 100}%` }}
                    />
                </div>
            </div>
        </aside>
    </>
  )};

  const renderContent = () => {
    if (showCertificate) return (
       <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-8 text-center bg-white rounded-3xl md:rounded-[3rem] shadow-2xl border border-gray-100 m-4 md:m-8 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
          <Award className="w-20 h-20 md:w-28 md:h-28 text-[var(--primary)] mb-6 md:mb-8" />
          <h1 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 tracking-tighter">Certificate of Achievement</h1>
          <p className="text-gray-500 text-base md:text-xl font-medium mb-10 md:mb-12 max-w-lg leading-relaxed">This certifies that you have successfully completed the training module: <br/><span className="text-gray-900 font-extrabold">{module.title}</span></p>
          
          <div className="w-full max-w-md space-y-6">
             {!userName && (
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Your Full Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. John Doe" 
                        className="w-full p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-[var(--primary)] transition-all" 
                        onBlur={e => setUserName(e.target.value)} 
                    />
                </div>
             )}
             <button onClick={() => window.print()} className="bg-[var(--primary)] text-white px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-lg hover:opacity-90 w-full shadow-2xl shadow-orange-100 transition-all active:scale-95">Download / Print</button>
             <button onClick={() => { setShowCertificate(false); setCurrentSlideIndex(-1); }} className="text-gray-400 font-black uppercase tracking-widest text-xs hover:text-[var(--primary)] transition-colors py-2">Restart Training</button>
          </div>
       </div>
    );

    if (currentSlideIndex === -1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-full text-center p-6 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-y-auto">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--primary)] rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white mb-8 md:mb-10 shadow-2xl shadow-orange-200 shrink-0 transform hover:rotate-6 transition-transform">
             <FileText className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          <div className="space-y-4 mb-10 md:mb-12">
            <span className="bg-orange-50 text-[var(--primary)] px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-orange-100 inline-block">Training Module</span>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight max-w-3xl mx-auto px-4">{module.title}</h1>
            <p className="text-sm md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed px-4">{module.description}</p>
          </div>
          <button onClick={handleNext} className="bg-[var(--primary)] text-white px-8 md:px-12 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-xl hover:opacity-95 shadow-2xl shadow-orange-200 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 mb-10">
            Start Module <ArrowRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
          </button>
        </div>
      );
    }

    if (isQuizStep) {
       return (
          <div className="max-w-4xl mx-auto p-4 md:p-10 text-left animate-in fade-in slide-in-from-right-8 duration-500 pb-24 h-full overflow-y-auto">
             <div className="mb-8 md:mb-12 border-b border-gray-100 pb-6 md:pb-8">
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter mb-2">Knowledge Check</h2>
                <p className="text-sm md:text-lg text-gray-500 font-medium leading-relaxed">Let's verify your understanding of this training content.</p>
             </div>
             
             {quizSubmitted ? (
                <div className="text-center py-12 md:py-20 bg-white rounded-3xl md:rounded-[3rem] shadow-2xl p-8 md:p-12 border border-gray-100 animate-in zoom-in-95 duration-500">
                   <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-orange-50 rounded-full mb-6">
                      <div className="text-3xl md:text-5xl font-black text-[var(--primary)]">{score}%</div>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Module Completed!</h3>
                   <p className="text-sm md:text-lg text-gray-500 font-medium mb-8 md:mb-10 leading-relaxed">Great job! You've finished the assessment phase.</p>
                   <button onClick={() => setShowCertificate(true)} className="bg-[var(--primary)] text-white px-10 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg shadow-2xl shadow-orange-100 hover:opacity-90 active:scale-95 transition-all w-full md:w-auto">View Certificate</button>
                </div>
             ) : (
                <div className="space-y-6 md:space-y-10">
                   {module.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                         <div className="font-black text-lg md:text-2xl mb-6 md:mb-8 text-gray-900 flex gap-4 md:gap-6">
                            <span className="bg-orange-50 text-[var(--primary)] w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-base md:text-xl font-black border border-orange-100">{qi + 1}</span>
                            <span className="mt-1 leading-tight">{q.text}</span>
                         </div>
                         <div className="space-y-3 md:space-y-4 md:pl-16">
                            {q.options.map((opt, oi) => (
                               <label key={oi} className={`flex items-start gap-4 cursor-pointer p-4 md:p-5 rounded-xl md:rounded-2xl transition-all border-2 ${answers[qi] === oi ? 'border-[var(--primary)] bg-orange-50 shadow-inner' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-100'}`}>
                                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => {
                                     const newAns = [...answers]; newAns[qi] = oi; setAnswers(newAns);
                                  }} className="mt-1 md:mt-1.5 w-4 h-4 md:w-5 md:h-5 accent-[var(--primary)] shrink-0" />
                                  <span className={`text-sm md:text-lg leading-tight font-bold ${answers[qi] === oi ? 'text-gray-900' : 'text-gray-600'}`}>{opt}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   ))}
                   <div className="pt-6 md:pt-10 flex justify-center pb-20">
                    <button onClick={submitQuiz} className="bg-gray-900 text-white px-10 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 shadow-2xl transition-all active:scale-95 w-full md:w-auto">Submit Assessment</button>
                   </div>
                </div>
             )}
          </div>
       );
    }

    const slide = slides[currentSlideIndex];
    if (!slide) return <div className="p-8 text-center text-red-500">Error: Slide content missing.</div>;
    
    if (slide.layout === 'canvas') {
        if (isMobile) {
            const sortedBlocks = getSortedBlocks(slide);
            return (
                <div 
                    className="min-h-full bg-white animate-in fade-in duration-500 flex flex-col overflow-y-auto"
                    style={{ backgroundColor: slide.backgroundColor || '#ffffff' }}
                >
                    <div className="p-6 pb-32 space-y-6 flex-1">
                        {sortedBlocks.map(block => (
                            <MobileStackRenderer key={block.id} block={block} textScale={textScale} />
                        ))}
                    </div>
                    <div className="mt-auto shrink-0">
                        <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} className="h-14" />
                    </div>
                </div>
            );
        } else {
            return (
                <div 
                    className="w-full h-full bg-gray-200 relative overflow-hidden flex items-center justify-center p-6 md:p-8"
                >
                    <style>{`
                       .slide-typography h1 { font-size: ${5 * textScale}vh; line-height: 1.1; margin-bottom: 0.5em; font-weight: 900; tracking: -0.05em; }
                       .slide-typography h2 { font-size: ${4 * textScale}vh; line-height: 1.2; margin-bottom: 0.5em; font-weight: 800; tracking: -0.02em; }
                       .slide-typography h3 { font-size: ${3 * textScale}vh; line-height: 1.3; margin-bottom: 0.5em; font-weight: 700; }
                       .slide-typography p, .slide-typography li, .slide-typography span, .slide-typography div { font-size: ${2.4 * textScale}vh; line-height: 1.6; font-weight: 500; }
                    `}</style>

                    <div 
                        className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] relative overflow-hidden aspect-[16/9] w-full max-h-full max-w-full rounded-2xl"
                        style={{
                            backgroundColor: slide.backgroundColor || '#ffffff',
                            backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                            backgroundSize: 'cover'
                        }}
                    >
                        {slide.blocks?.map(block => <DesktopCanvasRenderer key={block.id} block={block} textScale={textScale} />)}
                        <div className="absolute bottom-0 w-full">
                            <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} className="h-[12%]" />
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
       <div className="max-w-5xl mx-auto p-6 md:p-16 min-h-[70vh] animate-in fade-in slide-in-from-right-8 duration-500 pb-32 h-full overflow-y-auto">
          <article className="prose prose-lg md:prose-2xl prose-orange text-left slide-typography" dangerouslySetInnerHTML={{__html: slide.content}} />
       </div>
    );
  };

  const hasFooter = !showCertificate && currentSlideIndex > -1;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden theme-transition">
       <div className="h-16 md:h-20 bg-white border-b flex items-center justify-between px-4 md:px-6 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-3 md:gap-6 overflow-hidden flex-1">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 md:p-3 hover:bg-gray-50 rounded-xl text-gray-500 transition-all active:scale-90 shrink-0"
              >
                  {/* Fixed: Removed md:size prop */}
                  <Menu size={22} />
              </button>
              
              <div className="flex flex-col overflow-hidden text-left min-w-0">
                <span className="font-black text-gray-900 truncate text-sm md:text-lg tracking-tight leading-tight">{module.title}</span>
                <span className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                    {currentSlideIndex === -1 ? 'Introduction' : isQuizStep ? 'Assessment' : `Lesson ${currentSlideIndex + 1} / ${totalSlides}`}
                </span>
              </div>
          </div>

          <button onClick={() => onExitPreview ? onExitPreview() : navigate('/')} className="p-2 md:p-3 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-all shrink-0">
              {/* Fixed: Removed md:size prop */}
              <X size={20} strokeWidth={3} />
          </button>
       </div>

       <div className="flex flex-1 overflow-hidden relative">
           {renderSidebar()}
           <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full relative">
              <div className="flex-1 w-full overflow-hidden relative flex flex-col">
                  {renderContent()}
              </div>
              
              {hasFooter && (
                <div className="h-20 md:h-28 border-t bg-white/95 backdrop-blur-xl px-4 md:px-8 flex justify-between items-center z-30 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <button 
                        onClick={() => setCurrentSlideIndex(p => p - 1)} 
                        className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all text-[10px] md:text-sm uppercase tracking-widest ${currentSlideIndex === -1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} /> <span className="hidden sm:inline">Back</span>
                    </button>
                    
                    <div className="flex items-center gap-1 md:gap-2 bg-gray-50 rounded-xl md:rounded-2xl p-1.5 border border-gray-100">
                        <button 
                            onClick={() => setTextScale(Math.max(0.7, textScale - 0.1))}
                            className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl text-gray-600 shadow-sm disabled:opacity-30 transition-all active:scale-90"
                            disabled={textScale <= 0.7}
                        >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <span className="text-[9px] w-10 md:w-14 text-center font-black text-gray-400 uppercase tracking-tighter">Scale {Math.round(textScale * 100)}%</span>
                        <button 
                            onClick={() => setTextScale(Math.min(2.5, textScale + 0.1))}
                            className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl text-gray-600 shadow-sm disabled:opacity-30 transition-all active:scale-90"
                            disabled={textScale >= 2.5}
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={handleNext} 
                        disabled={isQuizStep && !quizSubmitted} 
                        className="flex items-center gap-2 md:gap-4 bg-[var(--primary)] text-white px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[1.5rem] font-black hover:opacity-95 disabled:opacity-50 shadow-2xl shadow-orange-100 transition-all active:scale-95 text-[10px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em]"
                    >
                    {isQuizStep ? 'Finish' : currentSlideIndex === totalSlides - 1 ? (module.quiz?.enabled ? 'Go to Quiz' : 'Complete') : 'Continue'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
                    </button>
                </div>
              )}
           </main>
       </div>
    </div>
  );
};
