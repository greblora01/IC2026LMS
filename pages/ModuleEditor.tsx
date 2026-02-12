import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Upload, Plus, Trash, CheckCircle, Layout, 
  FileText, Settings, Play, Eye, AlignLeft, AlignRight, 
  MonitorPlay, Image as ImageIcon, Maximize, FileUp, Loader2, Link as LinkIcon
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { Module, Question, AttachedFile, Slide, SlideLayout, SlideMedia } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

type EditorSection = 'general' | 'quiz' | string; // 'general', 'quiz', or slide ID

export const ModuleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addModule, updateModule, getModule } = useAppContext();
  
  const isEditMode = !!id;
  const [activeSection, setActiveSection] = useState<EditorSection>('general');
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    description: '',
    thumbnail: '',
    slides: [],
    files: [],
    quiz: { enabled: false, questions: [] },
    stats: { views: 0, completions: 0 }
  });

  useEffect(() => {
    if (isEditMode && id) {
      const existing = getModule(id);
      if (existing) {
        setFormData(JSON.parse(JSON.stringify(existing)));
      } else {
        navigate('/');
      }
    } else if (!isEditMode && (!formData.slides || formData.slides.length === 0)) {
       // Initialize with one empty slide
       setFormData(prev => ({
         ...prev,
         slides: [{ 
           id: generateId(), 
           title: 'Introduction', 
           content: '<p>Welcome to this module.</p>',
           layout: 'text-only' 
         }]
       }));
    }
  }, [id, isEditMode, getModule, navigate]);

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');

    setIsSaving(true);

    const moduleData = {
      ...formData,
      lastUpdated: Date.now()
    } as Module;

    try {
      if (isEditMode && id) {
        await updateModule(id, moduleData);
      } else {
        moduleData.id = generateId();
        moduleData.createdAt = Date.now();
        await addModule(moduleData);
      }
      navigate('/');
    } catch (error: any) {
      console.error("Save error:", error);
      let msg = "Failed to save module to the database.";
      // Check for common Firestore size error
      if (error.code === 'resource-exhausted' || (error.message && error.message.includes('exceeds the maximum allowed size'))) {
        msg = "The module is too large to save (Max 1MB). Please remove some images or reduce slide count.";
      } else if (error.code === 'permission-denied') {
         msg = "You do not have permission to save changes.";
      }
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      try {
        const base64 = await readFileAsBase64(file);
        const extension = file.name.split('.').pop()?.toLowerCase();
        let type: AttachedFile['type'] = 'other';
        if (['pdf'].includes(extension || '')) type = 'pdf';
        else if (['mp4', 'webm', 'ogg'].includes(extension || '')) type = 'video';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) type = 'image';
        else if (['doc', 'docx'].includes(extension || '')) type = 'doc';

        const newFile: AttachedFile = {
          id: generateId(),
          name: file.name,
          type, 
          size: `${(file.size / 1024).toFixed(1)} KB`,
          url: base64
        };
        setFormData(prev => ({ ...prev, files: [...(prev.files || []), newFile] }));
      } catch (error) {
        console.error("Error reading file", error);
        alert("Error reading file");
      }
    }
  };

  // Thumbnail Handler
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64 = await readFileAsBase64(files[0]);
        setFormData(prev => ({ ...prev, thumbnail: base64 }));
      } catch (error) {
        console.error("Error reading thumbnail", error);
      }
    }
  };

  // PDF Import Handler
  const handleImportPdfSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Initialize PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs';
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const newSlides: Slide[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.8);

          newSlides.push({
            id: generateId(),
            title: `Slide ${(formData.slides?.length || 0) + i} (PDF)`,
            content: '',
            layout: 'full-media',
            media: {
              type: 'image',
              url: imgData,
              name: `Page ${i} of ${file.name}`
            }
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        slides: [...(prev.slides || []), ...newSlides]
      }));
      
      alert(`Successfully imported ${newSlides.length} pages as slides.`);
    } catch (err) {
      console.error(err);
      alert("Failed to import PDF. " + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessingPdf(false);
      e.target.value = ''; // Reset input
    }
  };

  // Slide Management
  const addSlide = () => {
    const newSlide: Slide = {
      id: generateId(),
      title: `Slide ${(formData.slides?.length || 0) + 1}`,
      content: '',
      layout: 'text-only'
    };
    setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
    setActiveSection(newSlide.id);
  };

  const deleteSlide = (slideId: string) => {
    if ((formData.slides?.length || 0) <= 1) return alert("You must have at least one slide.");
    const newSlides = formData.slides?.filter(s => s.id !== slideId) || [];
    setFormData(prev => ({ ...prev, slides: newSlides }));
    if (activeSection === slideId) setActiveSection('general');
  };

  const updateSlide = (slideId: string, field: keyof Slide, value: any) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === slideId ? { ...s, [field]: value } : s)
    }));
  };

  const updateSlideMedia = (slideId: string, media: SlideMedia | undefined) => {
    updateSlide(slideId, 'media', media);
  };

  const handleSlideMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const type = file.type.startsWith('video') ? 'video' : 'image';
      try {
        const base64 = await readFileAsBase64(file);
        const newMedia: SlideMedia = {
          type,
          url: base64,
          name: file.name
        };
        updateSlideMedia(slideId, newMedia);
      } catch (error) {
        console.error("Error uploading media", error);
      }
    }
  };

  // URL Helper for YouTube
  const getEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const getActiveSlide = () => formData.slides?.find(s => s.id === activeSection);

  // Quiz Management
  const addQuestion = () => {
    const newQ: Question = { id: generateId(), text: '', options: ['', ''], correctOptionIndex: 0 };
    setFormData(prev => ({
      ...prev,
      quiz: { ...prev.quiz!, enabled: true, questions: [...(prev.quiz?.questions || []), newQ] }
    }));
  };

  const updateQuestion = (qIndex: number, field: keyof Question, value: any) => {
    const newQuestions = [...(formData.quiz?.questions || [])];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...(formData.quiz?.questions || [])];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
  };

  // Layout UI Components
  const LayoutButton = ({ layout, icon, active, onClick }: { layout: string, icon: React.ReactNode, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all w-24 ${
        active 
          ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)] ring-1 ring-[var(--primary)]' 
          : 'border-gray-200 hover:bg-gray-50 text-gray-500'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase">{layout}</span>
    </button>
  );

  const MediaUploader = ({ slideId, currentMedia }: { slideId: string, currentMedia?: SlideMedia }) => {
    const [mode, setMode] = useState<'upload' | 'link'>('upload');
    const [urlInput, setUrlInput] = useState('');

    const handleAddUrl = () => {
      if (!urlInput) return;
      
      let type: 'video' | 'image' = 'image';
      let finalUrl = urlInput;

      // Check for video link (YouTube)
      if (urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) {
        type = 'video';
        finalUrl = getEmbedUrl(urlInput);
      } else if (urlInput.match(/\.(mp4|webm|ogg)$/i)) {
        type = 'video';
      }

      const newMedia: SlideMedia = {
        type,
        url: finalUrl,
        name: 'External Link'
      };
      
      updateSlideMedia(slideId, newMedia);
      setUrlInput('');
    };

    return (
      <div className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors bg-[var(--bg-color)] relative overflow-hidden group">
        {currentMedia ? (
          <>
            {currentMedia.type === 'video' ? (
              currentMedia.url.includes('youtube') ? (
                 <iframe 
                    src={currentMedia.url} 
                    className="w-full h-full pointer-events-none" 
                    title="Video Preview"
                  />
              ) : (
                <video src={currentMedia.url} className="w-full h-full object-contain" controls />
              )
            ) : (
              <img src={currentMedia.url} alt="Slide media" className="w-full h-full object-contain" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button 
                onClick={() => updateSlideMedia(slideId, undefined)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                title="Remove Media"
              >
                <Trash size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center w-full max-w-sm">
             <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setMode('upload')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Upload File
                </button>
                <button 
                  onClick={() => setMode('link')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'link' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  From URL
                </button>
             </div>

             {mode === 'upload' ? (
               <div className="text-center relative w-full">
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => handleSlideMediaUpload(e, slideId)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex gap-2 mb-2 text-gray-400 justify-center">
                    <ImageIcon size={24} />
                    <MonitorPlay size={24} />
                  </div>
                  <span className="text-[var(--primary)] font-medium text-sm block">Click to Upload</span>
                  <span className="text-xs text-gray-400 mt-1 block">Images or MP4 Videos</span>
               </div>
             ) : (
               <div className="w-full flex flex-col gap-2">
                 <input 
                    type="text" 
                    placeholder="https://youtube.com/..." 
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:border-[var(--primary)] outline-none"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                 />
                 <button 
                   onClick={handleAddUrl}
                   className="w-full bg-[var(--primary)] text-white py-1.5 rounded text-sm font-medium hover:opacity-90 flex items-center justify-center gap-1"
                 >
                   <LinkIcon size={14} /> Add Link
                 </button>
                 <span className="text-[10px] text-gray-400 text-center">Supports YouTube, Images, & Video Files</span>
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setShowPreview(false)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-black transition-colors"
          >
            Exit Preview
          </button>
        </div>
        <ModuleViewer previewModule={formData as Module} onExitPreview={() => setShowPreview(false)} />
      </div>
    );
  }

  const activeSlide = getActiveSlide();

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-color)]">
      {/* Top Header */}
      <div className="h-16 bg-[var(--card-bg)] border-b border-gray-200 flex justify-between items-center px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold truncate max-w-md">{formData.title || 'Untitled Module'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeCustomizer />
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={18} />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`bg-[var(--primary)] text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium hover:opacity-90 shadow-sm transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="w-64 bg-[var(--card-bg)] border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 overflow-y-auto flex-1 space-y-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Structure</div>
            
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
                activeSection === 'general' ? 'bg-blue-50 text-[var(--primary)]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings size={16} />
              General Info
            </button>

            <div className="mt-6 mb-2 px-2 flex justify-between items-center group">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slides</span>
              <button onClick={addSlide} className="text-[var(--primary)] p-1 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Add Slide">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {formData.slides?.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSection(slide.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-colors group ${
                    activeSection === slide.id ? 'bg-blue-50 text-[var(--primary)]' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Layout size={16} className="shrink-0" />
                    <span className="truncate">{slide.title || `Slide ${idx + 1}`}</span>
                  </div>
                  {formData.slides && formData.slides.length > 1 && (
                     <span 
                       onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                       className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"
                     >
                       <Trash size={12} />
                     </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={addSlide}
              className="w-full mt-2 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Add Slide
            </button>
            
            <div className="relative w-full mt-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handleImportPdfSlides}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isProcessingPdf}
              />
              <button
                className={`w-full py-2 bg-gray-100 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 ${isProcessingPdf ? 'opacity-50' : ''}`}
              >
                {isProcessingPdf ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
                {isProcessingPdf ? 'Importing...' : 'Import Slides from PDF'}
              </button>
            </div>

            <div className="mt-6 mb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Assessment</div>
            <button
              onClick={() => setActiveSection('quiz')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
                activeSection === 'quiz' ? 'bg-blue-50 text-[var(--primary)]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={16} />
              Quiz
            </button>
          </div>
        </div>

        {/* Editor Pane */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-color)] p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl mx-auto">
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">Module Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Module Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        placeholder="Enter module title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none h-24 resize-none"
                        placeholder="What is this module about?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
                      <div className="flex flex-col gap-2">
                         <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.thumbnail || ''}
                              onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                              placeholder="https://example.com/image.jpg"
                            />
                            <div className="relative">
                               <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                               <button className="h-full px-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-200">
                                  Upload
                               </button>
                            </div>
                         </div>
                         {formData.thumbnail && (
                            <div className="mt-2 h-32 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                               <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                         )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Paste an image URL or upload to set the course card thumbnail.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">Attachments</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-[var(--primary)] font-medium">Upload File</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {formData.files?.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-500" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, files: prev.files?.filter(f => f.id !== file.id) }))}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide Editor */}
            {activeSection !== 'general' && activeSection !== 'quiz' && activeSlide && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-gray-200 shadow-sm">
                  {/* Slide Title */}
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                     <div className="flex-1 mr-8">
                       <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Slide Title</label>
                       <input
                        type="text"
                        value={activeSlide.title}
                        onChange={(e) => updateSlide(activeSection, 'title', e.target.value)}
                        className="text-2xl font-bold bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-[var(--primary)] outline-none px-1 py-1 w-full transition-colors"
                        placeholder="Enter title here..."
                      />
                     </div>
                     <div className="text-right">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Layout</label>
                        <div className="flex gap-2">
                          <LayoutButton 
                            layout="Text Only" 
                            icon={<FileText size={20} />} 
                            active={activeSlide.layout === 'text-only'}
                            onClick={() => updateSlide(activeSection, 'layout', 'text-only')}
                          />
                          <LayoutButton 
                            layout="Media Left" 
                            icon={<AlignLeft size={20} />} 
                            active={activeSlide.layout === 'media-left'}
                            onClick={() => updateSlide(activeSection, 'layout', 'media-left')}
                          />
                          <LayoutButton 
                            layout="Media Right" 
                            icon={<AlignRight size={20} />} 
                            active={activeSlide.layout === 'media-right'}
                            onClick={() => updateSlide(activeSection, 'layout', 'media-right')}
                          />
                          <LayoutButton 
                            layout="Full Media" 
                            icon={<Maximize size={20} />} 
                            active={activeSlide.layout === 'full-media'}
                            onClick={() => updateSlide(activeSection, 'layout', 'full-media')}
                          />
                        </div>
                     </div>
                  </div>
                  
                  {/* Content Area Based on Layout */}
                  <div className="min-h-[400px]">
                    {activeSlide.layout === 'text-only' && (
                      <div className="max-w-3xl mx-auto">
                        <RichTextEditor
                          key={`rte-${activeSection}`}
                          initialContent={activeSlide.content || ''}
                          onChange={(content) => updateSlide(activeSection, 'content', content)}
                        />
                      </div>
                    )}

                    {(activeSlide.layout === 'media-left' || activeSlide.layout === 'media-right') && (
                      <div className={`grid grid-cols-2 gap-6 h-full ${activeSlide.layout === 'media-right' ? 'direction-rtl' : ''}`}>
                         <div className={activeSlide.layout === 'media-right' ? 'order-2' : 'order-1'}>
                           <MediaUploader slideId={activeSection} currentMedia={activeSlide.media} />
                         </div>
                         <div className={activeSlide.layout === 'media-right' ? 'order-1' : 'order-2'}>
                            <RichTextEditor
                              key={`rte-${activeSection}`}
                              initialContent={activeSlide.content || ''}
                              onChange={(content) => updateSlide(activeSection, 'content', content)}
                            />
                         </div>
                      </div>
                    )}

                    {activeSlide.layout === 'full-media' && (
                      <div className="space-y-4">
                        <div className="h-[400px]">
                          <MediaUploader slideId={activeSection} currentMedia={activeSlide.media} />
                        </div>
                        <div className="max-w-3xl mx-auto">
                          <RichTextEditor
                            key={`rte-${activeSection}`}
                            initialContent={activeSlide.content || ''}
                            onChange={(content) => updateSlide(activeSection, 'content', content)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Editor */}
            {activeSection === 'quiz' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl mx-auto">
                 <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Quiz Questions</h2>
                    <button
                      onClick={addQuestion}
                      className="text-sm bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.quiz?.questions.map((q, qIndex) => (
                      <div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                        <button
                           onClick={() => setFormData(prev => ({
                             ...prev,
                             quiz: { ...prev.quiz!, questions: prev.quiz!.questions.filter((_, i) => i !== qIndex) }
                           }))}
                           className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                          <Trash size={16} />
                        </button>

                        <div className="mb-4 pr-8">
                          <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">Question {qIndex + 1}</label>
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded bg-white"
                            placeholder="Enter question text..."
                          />
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  q.correctOptionIndex === oIndex
                                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                    : 'border-gray-300 text-transparent hover:border-gray-400'
                                }`}
                              >
                                <CheckCircle size={12} fill="currentColor" />
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white"
                                placeholder={`Option ${oIndex + 1}`}
                              />
                               <button
                                onClick={() => {
                                  const newQuestions = [...formData.quiz!.questions];
                                  newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
                                  if (q.correctOptionIndex >= oIndex && q.correctOptionIndex > 0) newQuestions[qIndex].correctOptionIndex--;
                                  setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
                                }}
                                 className="text-gray-400 hover:text-red-500"
                                 disabled={q.options.length <= 2}
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                               const newQuestions = [...formData.quiz!.questions];
                               newQuestions[qIndex].options.push('');
                               setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
                            }}
                            className="text-xs text-[var(--primary)] font-medium ml-7 mt-1 hover:underline"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!formData.quiz?.questions || formData.quiz.questions.length === 0) && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No questions yet. Click "Add Question" to create a quiz.
                      </div>
                    )}
                  </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};