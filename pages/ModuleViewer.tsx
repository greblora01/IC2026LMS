import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, FileText, PlayCircle, Image as ImageIcon, File, CheckCircle, XCircle, ArrowRight, ArrowLeft, X, Printer, Award, Loader } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module } from '../types';
import { ThemeCustomizer } from '../components/ThemeCustomizer';

interface ModuleViewerProps {
  previewModule?: Module;
  onExitPreview?: () => void;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ previewModule, onExitPreview }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getModule, incrementModuleView } = useAppContext();
  
  const [module, setModule] = useState<Module | undefined>(previewModule);
  const [loading, setLoading] = useState(!previewModule);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(-1); 
  const [showResources, setShowResources] = useState(false);

  // Quiz State
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // Certificate State
  const [showCertificate, setShowCertificate] = useState(false);
  const [userName, setUserName] = useState('');
  const [certificateDate, setCertificateDate] = useState('');

  useEffect(() => {
    // 1. Preview Mode (from Editor)
    if (previewModule) {
      setModule(previewModule);
      setLoading(false);
      setAnswers(new Array(previewModule.quiz?.questions.length || 0).fill(-1));
      return;
    }

    // 2. External URL Mode
    if (id === 'external') {
      const url = searchParams.get('url');
      if (!url) {
        setError("No URL provided for external module.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch module");
          return res.json();
        })
        .then((data: Module) => {
          setModule(data);
          setAnswers(new Array(data.quiz?.questions.length || 0).fill(-1));
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError("Failed to load module from URL. Ensure it is a valid JSON file and accessible (CORS).");
          setLoading(false);
        });
      return;
    }

    // 3. Database/Local Mode
    if (id) {
      const foundModule = getModule(id);
      setModule(foundModule);
      if (foundModule) {
        if (!sessionStorage.getItem(`viewed_${id}`)) {
          incrementModuleView(id);
          sessionStorage.setItem(`viewed_${id}`, 'true');
        }
        setAnswers(new Array(foundModule.quiz?.questions.length || 0).fill(-1));
      } else {
        setError("Module not found locally.");
      }
      setLoading(false);
    }
  }, [id, getModule, incrementModuleView, previewModule, searchParams]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
      <Loader className="animate-spin" size={32} />
      <p>Loading module content...</p>
    </div>
  );

  if (error || !module) return (
    <div className="p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-red-50 text-red-500 p-6 rounded-xl border border-red-100 max-w-md">
        <XCircle size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Error Loading Module</h3>
        <p>{error || "Module not found."}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  );

  const slides = module.slides || [];
  const totalSlides = slides.length;
  // Index -1: Intro, 0 to N-1: Slides, N: Quiz (if enabled)
  const maxIndex = module.quiz?.enabled && module.quiz.questions.length > 0 ? totalSlides : totalSlides - 1;
  const isQuizStep = currentSlideIndex === totalSlides;

  const handleNext = () => {
    // If we are at the last slide and there is no quiz, clicking next should go to completion/certificate
    if (currentSlideIndex === totalSlides - 1 && (!module.quiz?.enabled || module.quiz.questions.length === 0)) {
       setShowCertificate(true);
       setCertificateDate(new Date().toLocaleDateString());
       return;
    }

    if (currentSlideIndex < maxIndex) {
      setCurrentSlideIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > -1) {
      setCurrentSlideIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={24} className="text-red-500" />;
      case 'video': return <PlayCircle size={24} className="text-blue-500" />;
      case 'image': return <ImageIcon size={24} className="text-purple-500" />;
      default: return <File size={24} className="text-gray-500" />;
    }
  };

  const handleOptionSelect = (qIndex: number, oIndex: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = oIndex;
    setAnswers(newAnswers);
  };

  const submitQuiz = () => {
    if (answers.includes(-1)) {
      if(!confirm("You haven't answered all questions. Submit anyway?")) return;
    }
    let correctCount = 0;
    module.quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) correctCount++;
    });
    setScore(Math.round((correctCount / module.quiz.questions.length) * 100));
    setQuizSubmitted(true);
  };

  const openCertificate = () => {
    setCertificateDate(new Date().toLocaleDateString());
    setShowCertificate(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMedia = (media: any, className = "w-full h-full object-cover rounded-xl shadow-md") => {
    if (!media) return (
       <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border border-gray-200">
          <ImageIcon size={48} className="opacity-20" />
       </div>
    );
    if (media.type === 'video') {
      return <video src={media.url} className={className} controls controlsList="nodownload" />;
    }
    return <img src={media.url} alt={media.name || 'Slide image'} className={className} />;
  };

  if (showCertificate) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center p-4">
        <div className="print:hidden w-full max-w-4xl flex justify-between items-center mb-6">
          <button 
            onClick={() => setShowCertificate(false)} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} /> Back to Module
          </button>
          {userName && (
             <button 
              onClick={handlePrint}
              className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 shadow-sm"
             >
               <Printer size={20} /> Print Certificate
             </button>
          )}
        </div>

        {!userName ? (
          <div className="bg-[var(--card-bg)] p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-center animate-in fade-in zoom-in-95">
             <Award size={64} className="mx-auto mb-4 text-[var(--accent)]" />
             <h2 className="text-2xl font-bold mb-2">Module Completed!</h2>
             <p className="text-gray-500 mb-6">Enter your name to generate your certificate of completion.</p>
             <input
               type="text"
               placeholder="Your Full Name"
               className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[var(--primary)] outline-none"
               autoFocus
               onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    setUserName((e.target as HTMLInputElement).value);
                  }
               }}
             />
             <button
               onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                  if (input) setUserName(input);
               }}
               className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-bold hover:opacity-90"
             >
               Generate Certificate
             </button>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-2xl border-8 border-double border-gray-200 max-w-4xl w-full text-center relative print:shadow-none print:border-4 print:w-full print:h-screen print:max-w-none print:rounded-none">
             <div className="absolute top-0 left-0 w-full h-full border-[20px] border-[var(--primary)] opacity-5 pointer-events-none"></div>
             
             <div className="mb-12">
               <div className="text-6xl font-serif text-[var(--primary)] font-bold mb-4 tracking-wider">Certificate</div>
               <div className="text-xl uppercase tracking-[0.2em] text-gray-400">Of Completion</div>
             </div>

             <div className="mb-12">
               <p className="text-gray-500 italic mb-4 text-lg">This is to certify that</p>
               <h1 className="text-5xl font-serif font-bold text-gray-800 mb-2 border-b-2 border-gray-300 inline-block pb-4 px-12 min-w-[300px] capitalize">
                 {userName}
               </h1>
             </div>

             <div className="mb-16">
               <p className="text-gray-500 italic mb-4 text-lg">Has successfully completed the module</p>
               <h2 className="text-3xl font-bold text-[var(--primary)] mb-2">{module?.certificateTitle || module?.title}</h2>
               {module?.certificateMessage && <p className="text-gray-600 max-w-xl mx-auto italic">"{module.certificateMessage}"</p>}
               {quizSubmitted && module?.quiz?.enabled && <p className="text-gray-500 mt-4">Score: <span className="font-bold text-gray-800">{score}%</span></p>}
             </div>

             <div className="flex justify-between items-end px-12 mt-auto">
               <div className="text-left">
                  <div className="w-48 border-b border-gray-400 mb-2"></div>
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Date</p>
                  <p className="text-lg font-medium">{certificateDate}</p>
               </div>
               <div className="text-right">
                 <div className="w-48 border-b border-gray-400 mb-2 flex justify-center pb-2">
                    <Award size={40} className="text-[var(--accent)] opacity-80" />
                 </div>
                 <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">LMS Lite Certified</p>
               </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // Render Content Logic
  const renderContent = () => {
    // 1. Cover Page
    if (currentSlideIndex === -1) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl">
             <FileText size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-color)] max-w-3xl leading-tight">{module.title}</h1>
          <p className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">{module.description}</p>
          <button 
            onClick={handleNext}
            className="group bg-[var(--primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 shadow-lg transition-all flex items-center gap-2"
          >
            Start Module <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-12 flex gap-8 text-sm text-gray-400 font-medium">
             <span>{totalSlides} Slides</span>
             {module.quiz?.enabled && <span>• Quiz Included</span>}
          </div>
        </div>
      );
    }

    // 2. Quiz Page
    if (isQuizStep) {
      return (
        <div className="max-w-3xl mx-auto animate-in slide-in-from-right duration-300">
           <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-[var(--primary)] text-white p-8">
              <h2 className="text-3xl font-bold">Knowledge Check</h2>
              <p className="opacity-90 mt-2 text-lg">
                 {quizSubmitted ? `You scored ${score}%` : `Answer ${module.quiz.questions.length} questions to complete this module.`}
              </p>
            </div>

            <div className="p-8 space-y-10">
                {module.quiz.questions.map((q, qIndex) => (
                  <div key={q.id}>
                    <h3 className="font-bold text-lg mb-4 flex gap-3">
                      <span className="bg-gray-100 text-gray-500 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">{qIndex + 1}</span> 
                      <span className="pt-1">{q.text}</span>
                    </h3>
                    <div className="space-y-3 pl-11">
                      {q.options.map((opt, oIndex) => {
                        let optionClass = "border-gray-200 hover:bg-gray-50";
                        let icon = null;

                        if (quizSubmitted) {
                          if (oIndex === q.correctOptionIndex) {
                            optionClass = "border-green-500 bg-green-50 text-green-700";
                            icon = <CheckCircle size={18} />;
                          } else if (answers[qIndex] === oIndex) {
                            optionClass = "border-red-500 bg-red-50 text-red-700";
                            icon = <XCircle size={18} />;
                          } else {
                            optionClass = "border-gray-100 opacity-50";
                          }
                        } else if (answers[qIndex] === oIndex) {
                          optionClass = "border-[var(--primary)] bg-blue-50 text-[var(--primary)] ring-1 ring-[var(--primary)]";
                        }

                        return (
                          <button
                            key={oIndex}
                            onClick={() => handleOptionSelect(qIndex, oIndex)}
                            disabled={quizSubmitted}
                            className={`w-full text-left p-4 rounded-lg border-2 flex items-center justify-between transition-all ${optionClass}`}
                          >
                            <span>{opt}</span>
                            {icon}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <div className="pt-8 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={submitQuiz}
                      className="bg-[var(--accent)] text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-md"
                    >
                      Submit Answers
                    </button>
                  </div>
                ) : (
                   <div className="pt-8 border-t border-gray-100 text-center flex flex-col items-center">
                     <p className="text-gray-500 mb-4">Great job completing the quiz!</p>
                     <div className="flex gap-4">
                       <button onClick={() => window.location.reload()} className="text-[var(--primary)] font-medium hover:underline px-4 py-2">
                         Restart Module
                       </button>
                       <button 
                         onClick={openCertificate}
                         className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 shadow-md flex items-center gap-2"
                       >
                         <Award size={18} /> Get Certificate
                       </button>
                     </div>
                   </div>
                )}
              </div>
          </div>
        </div>
      );
    }

    // 3. Slide Page Logic
    const slide = slides[currentSlideIndex];
    if (!slide) return null; // Added safety check
    const layout = slide.layout || 'text-only';

    if (layout === 'text-only') {
      return (
        <div className="max-w-5xl mx-auto h-full animate-in fade-in duration-300" key={slide.id}>
           <div className="mb-4">
               <h2 className="text-3xl font-bold text-[var(--text-color)]">{slide.title}</h2>
           </div>
          <article 
            className="prose prose-lg max-w-none prose-headings:text-[var(--text-color)] prose-p:text-[var(--text-color)] prose-strong:text-[var(--text-color)]"
            dangerouslySetInnerHTML={{ __html: slide.content }} 
          />
        </div>
      );
    }

    if (layout === 'media-left' || layout === 'media-right') {
      return (
        <div className="max-w-5xl mx-auto h-full animate-in fade-in duration-300" key={slide.id}>
           <div className="mb-4">
               <h2 className="text-3xl font-bold text-[var(--text-color)]">{slide.title}</h2>
           </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
             <div className={`w-full lg:w-1/2 ${layout === 'media-right' ? 'lg:order-2' : 'lg:order-1'}`}>
               {renderMedia(slide.media)}
             </div>
             <div className={`w-full lg:w-1/2 ${layout === 'media-right' ? 'lg:order-1' : 'lg:order-2'}`}>
                <article 
                  className="prose prose-lg max-w-none prose-headings:text-[var(--text-color)] prose-p:text-[var(--text-color)] prose-strong:text-[var(--text-color)]"
                  dangerouslySetInnerHTML={{ __html: slide.content }} 
                />
             </div>
          </div>
        </div>
      );
    }

    if (layout === 'full-media') {
       return (
        <div className="max-w-5xl mx-auto h-full animate-in fade-in duration-300" key={slide.id}>
           <div className="mb-4">
               <h2 className="text-3xl font-bold text-[var(--text-color)]">{slide.title}</h2>
           </div>
          <div className="space-y-6">
             <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                {renderMedia(slide.media, "w-full h-full object-contain")}
             </div>
             <article 
                className="prose prose-lg max-w-none prose-headings:text-[var(--text-color)] prose-p:text-[var(--text-color)] prose-strong:text-[var(--text-color)]"
                dangerouslySetInnerHTML={{ __html: slide.content }} 
              />
          </div>
        </div>
       );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
      {/* Viewer Header */}
      <div className="h-16 bg-[var(--card-bg)] border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0 fixed top-0 w-full z-40 shadow-sm print:hidden">
         <div className="flex items-center gap-4">
           {onExitPreview ? (
             <button onClick={onExitPreview} className="mr-2 text-gray-500 hover:text-gray-900 font-bold">Close</button>
           ) : (
             <button onClick={() => navigate('/')} className="mr-2 text-gray-500 hover:text-gray-900 font-bold">
               <X size={24} />
             </button>
           )}
           <span className="font-bold text-[var(--primary)] truncate max-w-[150px] md:max-w-md">{module.title}</span>
         </div>
         
         <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500">
             <span>{currentSlideIndex === -1 ? 'Intro' : isQuizStep ? 'Quiz' : `Slide ${currentSlideIndex + 1} of ${totalSlides}`}</span>
             <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] transition-all duration-500" 
                  style={{ width: `${((currentSlideIndex + 1) / (maxIndex + 1)) * 100}%` }}
                ></div>
             </div>
           </div>
           
           <ThemeCustomizer />

           {module.files.length > 0 && (
             <button 
               onClick={() => setShowResources(!showResources)}
               className={`p-2 rounded-lg transition-colors ${showResources ? 'bg-blue-50 text-[var(--primary)]' : 'text-gray-500 hover:bg-gray-100'}`}
               title="Resources"
             >
               <Download size={20} />
             </button>
           )}
         </div>
      </div>

      {/* Resources Drawer */}
      {showResources && (
        <div className="fixed top-16 right-0 w-80 h-[calc(100vh-64px)] bg-white shadow-2xl border-l border-gray-200 z-30 p-6 animate-in slide-in-from-right overflow-y-auto print:hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Resources</h3>
            <button onClick={() => setShowResources(false)}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="space-y-3">
            {module.files.map(file => (
              <a 
                key={file.id} 
                href={file.url}
                download={file.name} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[var(--primary)] transition-colors group"
              >
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate group-hover:text-[var(--primary)]">{file.name}</div>
                  <div className="text-xs text-gray-500">{file.size}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Scroll Area */}
      <main className="flex-1 mt-16 pb-24 px-4 md:px-8 py-8 overflow-y-auto print:p-0 print:m-0">
         {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-[var(--card-bg)] border-t border-gray-200 p-4 flex justify-between items-center z-40 print:hidden">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === -1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            currentSlideIndex === -1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowLeft size={20} /> <span className="hidden md:inline">Previous</span>
        </button>

        <div className="md:hidden text-xs font-medium text-gray-400">
           {currentSlideIndex === -1 ? 'Start' : isQuizStep ? 'Quiz' : `${currentSlideIndex + 1} / ${totalSlides}`}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex >= maxIndex && !(!module.quiz?.enabled && currentSlideIndex === totalSlides - 1)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            (currentSlideIndex >= maxIndex && module.quiz?.enabled)
              ? 'text-gray-300 cursor-not-allowed'
              : 'bg-[var(--primary)] text-white hover:opacity-90 shadow-md'
          }`}
        >
          <span className="hidden md:inline">
            {/* Logic: If no quiz and on last slide, show Finish */}
            {!module.quiz?.enabled && currentSlideIndex === totalSlides - 1 ? 'Finish' : 'Next'}
          </span> 
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};