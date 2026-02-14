import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowRight, ArrowLeft, X, Award, Loader 
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, SlideBlock } from '../types';

interface ModuleViewerProps {
  previewModule?: Module;
  onExitPreview?: () => void;
}

const SlideFooter: React.FC<{ leftText?: string; rightText?: string }> = ({ leftText, rightText }) => (
  <div 
    className="absolute bottom-0 left-0 right-0 h-[12%] bg-[#f57f20] flex items-center justify-between px-10 z-0 select-none"
  >
    <span className="text-white font-bold uppercase tracking-widest text-xl md:text-2xl">
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className="text-white font-bold uppercase tracking-widest text-xl md:text-2xl">
      {rightText || '2026 IC'}
    </span>
  </div>
);

const CanvasBlockRenderer: React.FC<{ block: SlideBlock }> = ({ block }) => {
   const style = {
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
     border: block.style?.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor || '#000'}` : 'none'
   };

   return (
     <div className="absolute overflow-hidden text-left" style={style}>
        {block.type === 'text' && (
           <div className="w-full h-full prose max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
        )}
        {block.type === 'image' && (
           <img src={block.content} alt="" className="w-full h-full object-cover" />
        )}
        {block.type === 'video' && (
           <video src={block.content} controls className="w-full h-full object-cover" />
        )}
        {block.type === 'youtube' && (
           <iframe src={block.content} className="w-full h-full border-0" allowFullScreen />
        )}
        {block.type === 'shape' && (
           <div className="w-full h-full"></div>
        )}
     </div>
   );
};

const LegacyBlockRenderer: React.FC<{ block: SlideBlock }> = ({ block }) => {
  if (block.type === 'text') {
    return (
      <article 
        className="prose prose-lg max-w-none prose-headings:text-[var(--text-color)] prose-p:text-[var(--text-color)] prose-strong:text-[var(--text-color)] text-left"
        dangerouslySetInnerHTML={{ __html: block.content }} 
      />
    );
  }
  
  if (block.type === 'image') {
    return (
      <div className="flex justify-center">
         <img 
            src={block.content} 
            alt="Slide content" 
            className="rounded-xl shadow-lg max-w-full h-auto max-h-[600px] object-contain" 
         />
      </div>
    );
  }
  return null;
};

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ previewModule, onExitPreview }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getModule, incrementModuleView, isLoading: contextLoading } = useAppContext();
  
  const [module, setModule] = useState<Module | undefined>(previewModule);
  const [loading, setLoading] = useState(!previewModule);
  const [error, setError] = useState<string | null>(null);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(-1); 
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (previewModule) {
      setModule(previewModule);
      setLoading(false);
      setAnswers(new Array(previewModule.quiz?.questions.length || 0).fill(-1));
      return;
    }
    if (id && !contextLoading) {
      const foundModule = getModule(id);
      setModule(foundModule);
      if(foundModule) {
         if (!sessionStorage.getItem(`viewed_${id}`)) incrementModuleView(id);
         setAnswers(new Array(foundModule.quiz?.questions.length || 0).fill(-1));
      } else {
         setError("Module not found.");
      }
      setLoading(false);
    }
  }, [id, getModule, previewModule, contextLoading, incrementModuleView]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-orange-500" /></div>;
  if (error || !module) return <div className="p-10 text-center">{error}</div>;

  const slides = module.slides || [];
  const totalSlides = slides.length;
  const maxIndex = module.quiz?.enabled ? totalSlides : totalSlides - 1;
  const isQuizStep = currentSlideIndex === totalSlides;

  const handleNext = () => {
    if (currentSlideIndex === totalSlides - 1 && !module.quiz?.enabled) {
       setShowCertificate(true);
    } else if (currentSlideIndex < maxIndex) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const submitQuiz = () => {
    let correct = 0;
    module.quiz.questions.forEach((q, i) => { if (answers[i] === q.correctOptionIndex) correct++; });
    setScore(Math.round((correct / module.quiz.questions.length) * 100));
    setQuizSubmitted(true);
  };

  const renderContent = () => {
    if (showCertificate) return (
       <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-xl border border-gray-200 m-4">
          <Award size={64} className="text-[#f57f20] mb-4" />
          <h1 className="text-4xl font-bold mb-2">Certificate of Completion</h1>
          <p className="text-gray-500 mb-8">Awarded to {userName || '[Your Name]'}</p>
          <div className="w-full max-w-md space-y-4">
             {!userName && <input type="text" placeholder="Enter Name" className="w-full p-3 border rounded text-gray-700 outline-none focus:border-[#f57f20]" onBlur={e => setUserName(e.target.value)} />}
             <button onClick={() => window.print()} className="bg-[#f57f20] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 w-full">Print Certificate</button>
             <button onClick={() => { setShowCertificate(false); setCurrentSlideIndex(-1); }} className="text-gray-400 underline text-sm">Back to Start</button>
          </div>
       </div>
    );

    if (currentSlideIndex === -1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <div className="w-24 h-24 bg-[#f57f20] rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl">
             <FileText size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#f57f20]">{module.title}</h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl">{module.description}</p>
          <button onClick={handleNext} className="bg-[#f57f20] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
            Start Module <ArrowRight />
          </button>
        </div>
      );
    }

    if (isQuizStep) {
       return (
          <div className="max-w-3xl mx-auto p-8 text-left">
             <h2 className="text-3xl font-bold mb-8 text-gray-800">Knowledge Check</h2>
             {quizSubmitted ? (
                <div className="text-center py-10">
                   <div className="text-5xl font-bold mb-6 text-[#f57f20]">Score: {score}%</div>
                   <button onClick={() => setShowCertificate(true)} className="bg-[#f57f20] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:opacity-90">Continue to Certificate</button>
                </div>
             ) : (
                <div className="space-y-8">
                   {module.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                         <div className="font-bold text-lg mb-4 text-gray-800">{qi + 1}. {q.text}</div>
                         <div className="space-y-3 pl-2">
                            {q.options.map((opt, oi) => (
                               <label key={oi} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-orange-100">
                                  <input type="radio" name={`q-${qi}`} checked={answers[qi] === oi} onChange={() => {
                                     const newAns = [...answers]; newAns[qi] = oi; setAnswers(newAns);
                                  }} className="w-4 h-4 accent-[#f57f20]" />
                                  <span className="text-gray-700">{opt}</span>
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
    
    if (slide.layout === 'canvas') {
       return (
          <div className="w-full flex items-center justify-center p-4 bg-gray-100 min-h-[calc(100vh-140px)]">
             <div 
               className="bg-white shadow-2xl relative overflow-hidden"
               style={{
                  width: '100%',
                  maxWidth: '1280px',
                  aspectRatio: '16/9',
                  backgroundColor: slide.backgroundColor || '#ffffff',
                  backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                  backgroundSize: 'cover'
               }}
             >
                {slide.blocks?.map(block => <CanvasBlockRenderer key={block.id} block={block} />)}
                <SlideFooter leftText={module.footerTextLeft} rightText={module.footerTextRight} />
             </div>
          </div>
       );
    }

    return (
       <div className="max-w-4xl mx-auto p-8 min-h-[60vh]">
          {slide.blocks && slide.blocks.length > 0 ? (
             <div className="space-y-8">
                {slide.blocks.map(block => <LegacyBlockRenderer key={block.id} block={block} />)}
             </div>
          ) : (
             <article className="prose prose-lg text-left" dangerouslySetInnerHTML={{__html: slide.content}} />
          )}
       </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <div className="h-16 bg-white border-b flex items-center justify-between px-6 fixed top-0 w-full z-40">
          <button onClick={() => onExitPreview ? onExitPreview() : navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
          <span className="font-bold text-gray-700 truncate max-w-md">{module.title}</span>
          <div className="text-sm font-medium text-gray-400">
            {currentSlideIndex === -1 ? 'Introduction' : isQuizStep ? 'Quiz' : `${currentSlideIndex + 1} / ${totalSlides}`}
          </div>
       </div>

       <main className="flex-1 pt-16 pb-20 overflow-y-auto">
          {renderContent()}
       </main>

       {!showCertificate && currentSlideIndex > -1 && (
         <div className="fixed bottom-0 w-full h-16 bg-white border-t flex justify-between items-center px-8 z-40 shadow-lg">
            <button onClick={() => setCurrentSlideIndex(p => p - 1)} className="flex items-center gap-2 text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium"><ArrowLeft size={18} /> Prev</button>
            <button onClick={handleNext} disabled={isQuizStep && !quizSubmitted} className="flex items-center gap-2 bg-[#f57f20] text-white px-8 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 shadow-md">
              {isQuizStep ? 'Finish' : currentSlideIndex === totalSlides - 1 ? 'Start Quiz' : 'Next'} <ArrowRight size={18} />
            </button>
         </div>
       )}
    </div>
  );
};
