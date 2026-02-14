import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowRight, ArrowLeft, X, Award, Loader2, Menu, List, CheckCircle2, Circle, Type, Minus, Plus, RefreshCw
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
    className={`bg-[var(--primary)] flex items-center justify-between px-8 py-3 select-none ${className}`}
  >
    <span className="text-white font-bold uppercase tracking-widest text-lg truncate mr-4">
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className="text-white font-bold uppercase tracking-widest text-lg truncate">
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
      border: block.style?.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor || '#000'}` : 'none'
    };

    const textStyle: React.CSSProperties = {
        zoom: textScale,
        fontSize: '16px' 
    };
 
    return (
      <div className="w-full mb-6 last:mb-0 relative" style={style}>
         {block.type === 'text' && (
            <div 
                className="w-full prose prose-sm max-w-none text-[var(--text-color)] slide-typography" 
                style={textStyle}
                dangerouslySetInnerHTML={{ __html: block.content }} 
            />
         )}
         {block.type === 'image' && (
            <img src={block.content} alt="" className="w-full h-auto rounded-lg shadow-sm" />
         )}
         {block.type === 'video' && (
            <video src={block.content} controls className="w-full h-auto rounded-lg" />
         )}
         {block.type === 'youtube' && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <iframe src={block.content} className="absolute inset-0 w-full h-full border-0" allowFullScreen title="Video" />
            </div>
         )}
         {block.type === 'shape' && (
            <div className="w-full h-24 rounded-lg bg-gray-100"></div>
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
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
  const [textScale, setTextScale] = useState(0.8);

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

    if (!id) {
        return;
    }

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

  // Completion Tracking Logic
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
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Syncing with Course Database...</p>
    </div>
  );
  
  if (error || !module) return (
    <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-gray-50">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
            <X size={48} strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4">Module Unreachable</h2>
        <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg leading-relaxed font-medium">{error || "The requested training module could not be retrieved."}</p>
        <button onClick={() => navigate('/')} className="bg-[var(--primary)] text-white px-10 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all">Back to Home</button>
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
      setCurrentSlideIndex(index);
      setShowCertificate(false);
      if (isMobile) setIsSidebarOpen(false);
  };

  const renderSidebar = () => {
    const sidebarClasses = isMobile 
        ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `w-[20%] min-w-[250px] border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 w-0 min-w-0 overflow-hidden'}`;

    return (
    <>
        {isSidebarOpen && isMobile && (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
        )}
        
        <aside className={`${sidebarClasses} bg-white h-[calc(100vh-64px)] overflow-hidden flex flex-col shrink-0`}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 truncate"><List size={18} /> Course Content</h3>
                {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={20} /></button>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                <button 
                    onClick={() => jumpToSlide(-1)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${currentSlideIndex === -1 ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                   <div className={`w-2 h-2 rounded-full ${currentSlideIndex === -1 ? 'bg-white' : 'bg-gray-300'}`} />
                   <span className="text-sm font-medium">Introduction</span>
                </button>
                
                {slides.map((slide, idx) => (
                    <button 
                        key={slide.id}
                        onClick={() => jumpToSlide(idx)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors ${currentSlideIndex === idx ? 'bg-[var(--primary)] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        {currentSlideIndex > idx ? (
                             <CheckCircle2 size={16} className="mt-0.5 text-green-500 shrink-0" />
                        ) : (
                             <Circle size={16} className={`mt-0.5 shrink-0 ${currentSlideIndex === idx ? 'text-white' : 'text-gray-300'}`} />
                        )}
                        <span className="text-sm font-medium leading-tight">{slide.title || `Slide ${idx + 1}`}</span>
                    </button>
                ))}

                {module.quiz?.enabled && (
                    <button 
                        onClick={() => jumpToSlide(totalSlides)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${currentSlideIndex === totalSlides ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                         <Award size={16} className={`${currentSlideIndex === totalSlides ? 'text-white' : 'text-gray-400'}`} />
                         <span className="text-sm font-medium">Knowledge Check</span>
                    </button>
                )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <div className="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>Progress</span>
                    <span>{Math.round(((currentSlideIndex + 1) / (maxIndex + 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[var(--primary)] transition-all duration-500" 
                        style={{ width: `${((currentSlideIndex + 1) / (maxIndex + 1)) * 100}%` }}
                    />
                </div>
            </div>
        </aside>
    </>
  )};

  const renderContent = () => {
    if (showCertificate) return (
       <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200 m-4 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Award size={64} className="text-[var(--primary)] mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[var(--text-color)]">Certificate of Completion</h1>
          <p className="text-gray-500 mb-8">Awarded to {userName || '[Your Name]'}</p>
          <div className="w-full max-w-md space-y-4">
             {!userName && <input type="text" placeholder="Enter Name for Certificate" className="w-full p-3 border rounded text-gray-700 outline-none focus:border-[var(--primary)]" onBlur={e => setUserName(e.target.value)} />}
             <button onClick={() => window.print()} className="bg-[var(--primary)] text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 w-full shadow-md">Print Certificate</button>
             <button onClick={() => { setShowCertificate(false); setCurrentSlideIndex(-1); }} className="text-gray-400 underline text-sm hover:text-gray-600">Back to Introduction</button>
          </div>
       </div>
    );

    if (currentSlideIndex === -1) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-white mb-6 md:mb-8 shadow-xl shrink-0">
             <FileText size={40} className="md:w-12 md:h-12" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-[var(--primary)] leading-tight">{module.title}</h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 md:mb-10 max-w-2xl leading-relaxed">{module.description}</p>
          <button onClick={handleNext} className="bg-[var(--primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
            Start Module <ArrowRight />
          </button>
        </div>
      );
    }

    if (isQuizStep) {
       return (
          <div className="max-w-3xl mx-auto p-6 md:p-10 text-left animate-in fade-in slide-in-from-right-4 duration-300 pb-24 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
             <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Knowledge Check</h2>
             {quizSubmitted ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                   <div className="text-5xl font-bold mb-2 text-[var(--primary)]">{score}%</div>
                   <p className="text-gray-500 mb-6">Quiz Completed</p>
                   <button onClick={() => setShowCertificate(true)} className="bg-[var(--primary)] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:opacity-90">Get Certificate</button>
                </div>
             ) : (
                <div className="space-y-6 md:space-y-8">
                   {module.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                         <div className="font-bold text-lg mb-4 text-gray-800 flex gap-3">
                            <span className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm">{qi + 1}</span>
                            {q.text}
                         </div>
                         <div className="space-y-3 pl-2 md:pl-11">
                            {q.options.map((opt, oi) => (
                               <label key={oi} className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg transition-colors border ${answers[qi] === oi ? 'border-[var(--primary)] bg-orange-50' : 'border-transparent hover:bg-gray-50 hover:border-gray-200'}`}>
                                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => {
                                     const newAns = [...answers]; newAns[qi] = oi; setAnswers(newAns);
                                  }} className="mt-1 w-4 h-4 accent-[var(--primary)]" />
                                  <span className="text-gray-700 text-sm md:text-base leading-snug">{opt}</span>
                               </label>
                            ))}
                         </div>
                      </div>
                   ))}
                   <button onClick={submitQuiz} className="bg-gray-800 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 w-full md:w-auto shadow-md">Submit Answers</button>
                </div>
             )}
          </div>
       );
    }

    const slide = slides[currentSlideIndex];
    if (!slide) return <div className="p-8 text-center text-red-500">Error: Slide not found.</div>;
    
    if (slide.layout === 'canvas') {
        if (isMobile) {
            const sortedBlocks = getSortedBlocks(slide);
            
            return (
                <div 
                    className="min-h-full bg-white animate-in fade-in duration-300 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ backgroundColor: slide.backgroundColor || '#ffffff' }}
                >
                    <style>{`
                        .slide-typography h1, .slide-typography h2, .slide-typography h3 { font-size: 32px !important; line-height: 1.2 !important; }
                        .slide-typography p, .slide-typography li { font-size: 18px !important; line-height: 1.5 !important; }
                    `}</style>
                    <div className="p-6 pb-24 space-y-6 flex-1">
                        {sortedBlocks.map(block => (
                            <MobileStackRenderer key={block.id} block={block} textScale={textScale} />
                        ))}
                    </div>
                    <div className="mt-auto">
                        <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} className="h-12" />
                    </div>
                </div>
            );
        } else {
            return (
                <div 
                    className="w-full h-full bg-gray-200 relative overflow-hidden"
                >
                    <style>{`
                       .slide-typography h1 { font-size: ${4.5 * textScale}vh; line-height: 1.1; margin-bottom: 0.5em; font-weight: 700; }
                       .slide-typography h2 { font-size: ${3.5 * textScale}vh; line-height: 1.2; margin-bottom: 0.5em; font-weight: 700; }
                       .slide-typography h3 { font-size: ${2.5 * textScale}vh; line-height: 1.3; margin-bottom: 0.5em; font-weight: 600; }
                       .slide-typography p, .slide-typography li, .slide-typography span, .slide-typography div { font-size: ${2.0 * textScale}vh; line-height: 1.5; }
                    `}</style>

                    <div 
                        className="bg-white shadow-2xl relative overflow-hidden w-full h-full"
                        style={{
                            backgroundColor: slide.backgroundColor || '#ffffff',
                            backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                            backgroundSize: 'cover'
                        }}
                    >
                        {slide.blocks?.map(block => <DesktopCanvasRenderer key={block.id} block={block} textScale={textScale} />)}
                        <div className="absolute bottom-0 w-full">
                            <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} />
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
       <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-[60vh] animate-in fade-in slide-in-from-right-4 duration-300 pb-24 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <article className="prose prose-lg text-left" dangerouslySetInnerHTML={{__html: slide.content}} />
       </div>
    );
  };

  const hasFooter = !showCertificate && currentSlideIndex > -1;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
       <div className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <button 
                onClick={() => {
                    setIsSidebarOpen(!isSidebarOpen);
                }} 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Toggle Menu"
              >
                  <Menu size={20} />
              </button>
              
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="font-bold text-gray-800 truncate text-sm md:text-base leading-tight">{module.title}</span>
                <span className="text-xs text-gray-500 font-medium">
                    {currentSlideIndex === -1 ? 'Introduction' : isQuizStep ? 'Final Quiz' : `Slide ${currentSlideIndex + 1} of ${totalSlides}`}
                </span>
              </div>
          </div>

          <button onClick={() => onExitPreview ? onExitPreview() : navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shrink-0">
              <X size={20} />
          </button>
       </div>

       <div className="flex flex-1 overflow-hidden relative">
           {renderSidebar()}
           <main className="flex-1 flex flex-col min-w-0 bg-gray-100 h-full relative">
              <div className="flex-1 w-full overflow-hidden relative flex flex-col">
                  {renderContent()}
              </div>
              
              {hasFooter && (
                <div className="h-[10vh] min-h-[60px] max-h-[100px] border-t bg-white/95 backdrop-blur-sm px-[10px] flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 shrink-0">
                    <button 
                        onClick={() => setCurrentSlideIndex(p => p - 1)} 
                        className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                    >
                        <ArrowLeft size={18} /> <span className="hidden md:inline">Previous</span>
                    </button>
                    
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mx-2">
                        <Type size={14} className="text-gray-400 ml-1 hidden sm:block"/>
                        <button 
                            onClick={() => setTextScale(Math.max(0.8, textScale - 0.1))}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                            disabled={textScale <= 0.8}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-xs w-8 text-center font-bold text-gray-700">{Math.round(textScale * 100)}%</span>
                        <button 
                            onClick={() => setTextScale(Math.min(2.0, textScale + 0.1))}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                            disabled={textScale >= 2.0}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <button 
                        onClick={handleNext} 
                        disabled={isQuizStep && !quizSubmitted} 
                        className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 md:px-8 py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 shadow-md transition-all active:scale-95 text-sm md:text-base"
                    >
                    {isQuizStep ? 'View Results' : currentSlideIndex === totalSlides - 1 ? (module.quiz?.enabled ? 'Start Quiz' : 'Finish') : 'Next'} <ArrowRight size={18} />
                    </button>
                </div>
              )}
           </main>
       </div>
    </div>
  );
};