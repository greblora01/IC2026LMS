import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Upload, Plus, Trash, CheckCircle, 
  FileText, Eye, MonitorPlay, Image as ImageIcon, 
  FileUp, Loader2, Type as TypeIcon, Youtube, X, 
  Paperclip, Copy, LayoutTemplate, MousePointer2, Layers, Square
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { Module, Slide, SlideBlock, BlockType, AttachedFile } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { NEW_MODULE_TEMPLATE_SLIDES, SLIDE_TEMPLATES } from '../constants';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

const generateId = () => Math.random().toString(36).substr(2, 9);

type EditorSection = 'quiz' | string;

// Helper for deep cloning plain objects without circular risk
const safeClone = <T,>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error("Cloning failed, using shallow fallback", e);
    return { ...obj };
  }
};

interface SlideFooterProps {
  leftText?: string;
  rightText?: string;
  isThumbnail?: boolean;
}

const SlideFooter: React.FC<SlideFooterProps> = ({ leftText, rightText, isThumbnail }) => (
  <div 
    className={`absolute bottom-0 left-0 right-0 bg-[#f57f20] flex items-center justify-between z-0 select-none ${isThumbnail ? 'h-[12%] px-6' : 'h-[12%] px-10'}`}
  >
    <span className={`text-white font-bold uppercase tracking-widest ${isThumbnail ? 'text-[24px]' : 'text-xl md:text-2xl'}`}>
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className={`text-white font-bold uppercase tracking-widest ${isThumbnail ? 'text-[24px]' : 'text-xl md:text-2xl'}`}>
      {rightText || '2026 IC'}
    </span>
  </div>
);

interface SlideThumbnailProps {
    slide: Slide;
    isActive: boolean;
    footerTextLeft?: string;
    footerTextRight?: string;
}

const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ slide, isActive, footerTextLeft, footerTextRight }) => {
  const BASE_WIDTH = 960; 
  const BASE_HEIGHT = 540;
  const SCALE = 0.16;

  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${SCALE})`,
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
                borderRadius: block.style?.borderRadius ? `${block.style.borderRadius * 2}px` : undefined,
                opacity: block.style?.opacity,
                border: block.style?.borderWidth ? `${block.style.borderWidth * 2}px solid ${block.style.borderColor || '#000'}` : 'none'
              }}
              className="overflow-hidden"
            >
               {block.type === 'text' && (
                  <div 
                    className="w-full h-full" 
                    style={{ fontSize: '32px', color: block.style?.color || 'inherit' }}
                    dangerouslySetInnerHTML={{ __html: block.content }} 
                  />
               )}
               {block.type === 'image' && block.content && (
                  <img src={block.content} className="w-full h-full object-cover" alt="" />
               )}
               {block.type === 'image' && !block.content && (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center"><ImageIcon size={48} className="text-gray-400" /></div>
               )}
               {block.type === 'video' && <div className="w-full h-full bg-black flex items-center justify-center"><MonitorPlay size={48} className="text-white" /></div>}
               {block.type === 'youtube' && <div className="w-full h-full bg-red-600 flex items-center justify-center"><Youtube size={48} className="text-white" /></div>}
               {block.type === 'shape' && <div className="w-full h-full"></div>}
            </div>
         ))}
         
         <SlideFooter leftText={footerTextLeft} rightText={footerTextRight} isThumbnail />
      </div>
    </div>
  );
};

export const ModuleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addModule, updateModule, getModule } = useAppContext();
  
  const isEditMode = !!id;
  const [activeSection, setActiveSection] = useState<EditorSection>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBlockState, setInitialBlockState] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<string | null>(null);

  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    description: '',
    thumbnail: '',
    footerTextLeft: 'VOLUNTEER TRAINING',
    footerTextRight: '2026 IC',
    slides: [],
    files: [],
    quiz: { enabled: false, questions: [] },
    stats: { views: 0, completions: 0 }
  });

  useEffect(() => {
    if (isEditMode && id) {
      const existing = getModule(id);
      if (existing) {
        setFormData(safeClone(existing));
        if (existing.slides && existing.slides.length > 0) {
           setActiveSection(existing.slides[0].id);
        } else {
           setActiveSection('quiz');
        }
      } else {
        navigate('/');
      }
    } else if (!isEditMode && (!formData.slides || formData.slides.length === 0)) {
       const templateSlides = NEW_MODULE_TEMPLATE_SLIDES.map(s => ({
         ...s,
         id: generateId(),
         layout: 'canvas' as const,
         blocks: s.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType }))
       }));
       
       setFormData(prev => ({
         ...prev,
         title: 'New Training Module',
         slides: templateSlides as Slide[]
       }));
       setActiveSection(templateSlides[0].id);
    }
  }, [id, isEditMode, getModule, navigate]);

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');
    setIsSaving(true);
    const moduleData = { ...formData, lastUpdated: Date.now() } as Module;
    try {
      if (isEditMode && id) await updateModule(id, moduleData);
      else {
        moduleData.id = generateId();
        moduleData.createdAt = Date.now();
        await addModule(moduleData);
      }
      navigate('/');
    } catch (error: any) {
      alert("Failed to save. " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getActiveSlide = () => formData.slides?.find(s => s.id === activeSection);

  const duplicateSlide = (slideId: string) => {
    const slideIndex = formData.slides?.findIndex(s => s.id === slideId);
    if (slideIndex === undefined || slideIndex === -1) return;
    
    const slideToClone = formData.slides![slideIndex];
    const newSlide: Slide = {
      ...safeClone(slideToClone),
      id: generateId(),
      title: `${slideToClone.title} (Copy)`,
      blocks: slideToClone.blocks?.map(b => ({ ...b, id: generateId() })) || []
    };

    setFormData(prev => {
      const newSlides = [...(prev.slides || [])];
      newSlides.splice(slideIndex + 1, 0, newSlide);
      return { ...prev, slides: newSlides };
    });
    setActiveSection(newSlide.id);
  };

  const deleteSlide = (slideId: string) => {
    if ((formData.slides?.length || 0) <= 1) return alert("You must have at least one slide.");
    const newSlides = formData.slides?.filter(s => s.id !== slideId) || [];
    setFormData(prev => ({ ...prev, slides: newSlides }));
    if (activeSection === slideId) {
        setActiveSection(newSlides.length > 0 ? newSlides[0].id : 'quiz');
    }
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleImportPdfSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdfjs = pdfjsLib.default || pdfjsLib;
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const newSlides: Slide[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        
        let pageText = items.map((item: any) => item.str).join(' ');
        if (!pageText.trim()) pageText = "Slide content...";

        newSlides.push({
           id: generateId(),
           title: `Slide ${(formData.slides?.length || 0) + i}`,
           layout: 'canvas',
           content: '', 
           blocks: [{
              id: generateId(),
              type: 'text',
              content: `<p>${pageText}</p>`,
              x: 10, y: 10, width: 80, height: 80, zIndex: 1
           }]
        });
      }

      setFormData(prev => ({
        ...prev,
        slides: [...(prev.slides || []), ...newSlides]
      }));
      
      alert(`Successfully imported ${newSlides.length} slides.`);
    } catch (err) {
      console.error(err);
      alert("Failed to import PDF.");
    } finally {
      setIsProcessingPdf(false);
      e.target.value = '';
    }
  };

  const addBlockToSlide = (type: BlockType) => {
    if (activeSection === 'quiz') return;
    
    let width = 30;
    let height = 20;
    let content = '';
    let style = {};

    if (type === 'text') {
       content = '<h2>Double click to edit</h2>';
       width = 40; height = 15;
    } else if (type === 'image') {
       width = 30; height = 40;
    } else if (type === 'video' || type === 'youtube') {
       width = 40; height = 25;
    } else if (type === 'shape') {
       width = 20; height = 20;
       style = { backgroundColor: '#E5E7EB', borderRadius: 0 };
    }

    const newBlock: SlideBlock = {
      id: generateId(),
      type,
      content,
      x: 35, y: 35, 
      width, height,
      zIndex: (getActiveSlide()?.blocks?.length || 0) + 1,
      style
    };

    setFormData(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === activeSection ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s)
    }));
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<SlideBlock>) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === activeSection ? {
        ...s,
        blocks: s.blocks?.map(b => b.id === blockId ? { ...b, ...updates } : b)
      } : s)
    }));
  };

  const deleteBlock = (blockId: string) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === activeSection ? {
        ...s,
        blocks: s.blocks?.filter(b => b.id !== blockId)
      } : s)
    }));
    setSelectedBlockId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string, handle?: string) => {
    if (editingTextId) return;
    e.stopPropagation();
    e.preventDefault();
    
    const slide = getActiveSlide();
    const block = slide?.blocks?.find(b => b.id === blockId);
    if (!block || !canvasRef.current) return;

    setSelectedBlockId(blockId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBlockState({ 
      x: block.x || 0, 
      y: block.y || 0, 
      w: block.width || 20, 
      h: block.height || 20 
    });

    if (handle) {
      setIsResizing(true);
      resizeHandleRef.current = handle;
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !selectedBlockId || !initialBlockState || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const deltaXPct = (deltaX / canvasRect.width) * 100;
    const deltaYPct = (deltaY / canvasRect.height) * 100;

    if (isDragging) {
      updateBlock(selectedBlockId, {
        x: initialBlockState.x + deltaXPct,
        y: initialBlockState.y + deltaYPct
      });
    } else if (isResizing) {
      const handle = resizeHandleRef.current;
      let newX = initialBlockState.x;
      let newY = initialBlockState.y;
      let newW = initialBlockState.w;
      let newH = initialBlockState.h;

      if (handle?.includes('e')) newW = initialBlockState.w + deltaXPct;
      if (handle?.includes('w')) {
        newX = initialBlockState.x + deltaXPct;
        newW = initialBlockState.w - deltaXPct;
      }
      if (handle?.includes('s')) newH = initialBlockState.h + deltaYPct;
      if (handle?.includes('n')) {
        newY = initialBlockState.y + deltaYPct;
        newH = initialBlockState.h - deltaYPct;
      }

      if (newW < 2) newW = 2;
      if (newH < 2) newH = 2;

      updateBlock(selectedBlockId, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    resizeHandleRef.current = null;
  };

  const handleLayer = (direction: 'up' | 'down') => {
    if (!selectedBlockId) return;
    const slide = getActiveSlide();
    const block = slide?.blocks?.find(b => b.id === selectedBlockId);
    if (!block) return;
    updateBlock(selectedBlockId, { zIndex: (block.zIndex || 0) + (direction === 'up' ? 1 : -1) });
  };

  const handleSlideDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlideDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSlideIndex === null || draggedSlideIndex === index) return;
    const newSlides = [...(formData.slides || [])];
    const draggedSlide = newSlides[draggedSlideIndex];
    newSlides.splice(draggedSlideIndex, 1);
    newSlides.splice(index, 0, draggedSlide);
    setFormData(prev => ({ ...prev, slides: newSlides }));
    setDraggedSlideIndex(index);
  };

  const handleSlideDragEnd = () => {
    setDraggedSlideIndex(null);
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="fixed top-4 right-4 z-50">
          <button onClick={() => setShowPreview(false)} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Exit Preview</button>
        </div>
        <ModuleViewer previewModule={formData as Module} onExitPreview={() => setShowPreview(false)} />
      </div>
    );
  }

  const activeSlide = getActiveSlide();
  const selectedBlock = activeSlide?.blocks?.find(b => b.id === selectedBlockId);

  return (
    <div className="h-screen flex flex-col bg-gray-100" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <input type="file" accept=".pdf" ref={pdfInputRef} onChange={handleImportPdfSlides} className="hidden" />

      <div className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shrink-0 z-10">
        <div className="flex items-center gap-4 flex-1 text-left">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={20} /></button>
          <input
             type="text"
             value={formData.title}
             onChange={e => setFormData({ ...formData, title: e.target.value })}
             className="text-xl font-bold bg-transparent border-none focus:ring-0 outline-none w-full max-w-md text-[#f57f20]"
             placeholder="Untitled Module"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Eye size={18} /> Preview</button>
          <button onClick={handleSave} disabled={isSaving} className="bg-[#f57f20] text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium hover:opacity-90">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-20 shadow-sm shrink-0 overflow-y-auto custom-scrollbar">
             {activeSection !== 'quiz' && (
               <>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Insert</div>
                 <ToolButton icon={<TypeIcon size={20} />} label="Text" onClick={() => addBlockToSlide('text')} />
                 <ToolButton icon={<ImageIcon size={20} />} label="Image" onClick={() => addBlockToSlide('image')} />
                 <ToolButton icon={<Square size={20} />} label="Shape" onClick={() => addBlockToSlide('shape')} />
                 <ToolButton icon={<Youtube size={20} />} label="Video" onClick={() => addBlockToSlide('youtube')} />
                 <div className="w-10 h-px bg-gray-200 my-2"></div>
               </>
             )}
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Actions</div>
             <ToolButton icon={<Plus size={20} />} label="New Slide" onClick={() => setShowTemplateModal(true)} active />
             {activeSection !== 'quiz' && (
               <ToolButton icon={<Copy size={20} />} label="Duplicate" onClick={() => duplicateSlide(activeSection)} />
             )}
             <ToolButton icon={<Paperclip size={20} />} label="Resources" onClick={() => setShowResourceModal(true)} />
             <ToolButton 
                icon={isProcessingPdf ? <Loader2 size={20} className="animate-spin" /> : <FileUp size={20} />} 
                label="Import" 
                onClick={() => pdfInputRef.current?.click()} 
                disabled={isProcessingPdf}
             />
             <ToolButton icon={<CheckCircle size={20} />} label="Quiz" onClick={() => setActiveSection('quiz')} active={activeSection === 'quiz'} />
        </div>

        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto relative">
          {activeSection !== 'quiz' && activeSlide ? (
            <div 
               ref={canvasRef}
               className="bg-white shadow-xl relative overflow-hidden transition-colors"
               style={{ 
                 width: '100%', 
                 maxWidth: '1280px', 
                 aspectRatio: '16/9',
                 backgroundColor: activeSlide.backgroundColor || '#ffffff',
                 backgroundImage: activeSlide.backgroundImage ? `url(${activeSlide.backgroundImage})` : undefined,
                 backgroundSize: 'cover'
               }}
               onMouseDown={() => { setSelectedBlockId(null); setEditingTextId(null); }}
            >
               {activeSlide.blocks?.map(block => (
                 <div
                    key={block.id}
                    onMouseDown={(e) => handleMouseDown(e, block.id)}
                    className={`absolute group cursor-move ${selectedBlockId === block.id ? 'ring-2 ring-blue-500 z-50' : ''}`}
                    style={{
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
                    }}
                 >
                    <div className="w-full h-full overflow-hidden text-left" onDoubleClick={() => block.type === 'text' && setEditingTextId(block.id)}>
                        {block.type === 'text' ? (
                           editingTextId === block.id ? (
                             <div className="h-full bg-white text-black cursor-text" onMouseDown={e => e.stopPropagation()}>
                                <RichTextEditor initialContent={block.content} onChange={(html) => updateBlock(block.id, { content: html })} />
                                <button onClick={() => setEditingTextId(null)} className="absolute -top-8 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">Done</button>
                             </div>
                           ) : (
                             <div className="w-full h-full prose max-w-none pointer-events-none" dangerouslySetInnerHTML={{ __html: block.content }} />
                           )
                        ) : block.type === 'image' ? (
                           block.content ? (
                             <img src={block.content} className="w-full h-full object-cover pointer-events-none" alt="" />
                           ) : (
                             <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed">
                                <ImageIcon size={32} />
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                   if(e.target.files?.[0]) {
                                      const url = await readFileAsBase64(e.target.files[0]);
                                      updateBlock(block.id, { content: url });
                                   }
                                }} />
                             </div>
                           )
                        ) : block.type === 'youtube' ? (
                           block.content ? (
                             <iframe src={block.content} className="w-full h-full pointer-events-none" />
                           ) : (
                             <div className="w-full h-full bg-red-50 flex items-center justify-center text-red-400 border-2 border-dashed border-red-200">
                                <Youtube size={32} />
                                <button onClick={() => {
                                   const url = prompt("Enter YouTube URL");
                                   if (url) updateBlock(block.id, { content: url.replace('watch?v=', 'embed/') });
                                }} className="absolute inset-0"></button>
                             </div>
                           )
                        ) : null}
                    </div>

                    {selectedBlockId === block.id && !editingTextId && (
                      <>
                        {['nw', 'ne', 'sw', 'se'].map(h => (
                          <div 
                            key={h}
                            className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-50"
                            style={{ 
                              top: h.includes('n') ? -4 : 'auto', 
                              bottom: h.includes('s') ? -4 : 'auto', 
                              left: h.includes('w') ? -4 : 'auto', 
                              right: h.includes('e') ? -4 : 'auto',
                              cursor: `${h}-resize`
                            }}
                            onMouseDown={(e) => handleMouseDown(e, block.id, h)}
                          />
                        ))}
                      </>
                    )}
                 </div>
               ))}
               
               <SlideFooter leftText={formData.footerTextLeft} rightText={formData.footerTextRight} />
            </div>
          ) : (
             <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <h3 className="text-xl font-bold mb-2">Quiz Editor Active</h3>
                <p className="text-gray-500">Select a slide from the bottom bar to edit design.</p>
             </div>
          )}
        </div>

        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto text-left">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Properties</h3>
              {selectedBlock ? (
                 <div className="space-y-6">
                    <div>
                       <label className="text-xs font-bold text-gray-500 block mb-2">Layering</label>
                       <div className="flex gap-2">
                          <button onClick={() => handleLayer('up')} className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center gap-1 text-gray-700"><Layers size={12} /> Front</button>
                          <button onClick={() => handleLayer('down')} className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center gap-1 text-gray-700"><Layers size={12} /> Back</button>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500 block mb-2">Style</label>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-xs text-gray-600">Background</span>
                             <input type="color" value={selectedBlock.style?.backgroundColor || '#ffffff'} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, backgroundColor: e.target.value } })} className="w-6 h-6 rounded cursor-pointer border-0" />
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-xs text-gray-600">Opacity</span>
                             <input type="range" min="0" max="1" step="0.1" value={selectedBlock.style?.opacity ?? 1} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, opacity: parseFloat(e.target.value) } })} className="w-20" />
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-xs text-gray-600">Radius</span>
                             <input type="range" min="0" max="50" value={selectedBlock.style?.borderRadius ?? 0} onChange={e => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, borderRadius: parseInt(e.target.value) } })} className="w-20" />
                          </div>
                       </div>
                    </div>
                    <button onClick={() => deleteBlock(selectedBlock.id)} className="w-full py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded text-sm flex items-center justify-center gap-2 font-medium"><Trash size={14} /> Delete Element</button>
                 </div>
              ) : (
                 <div className="space-y-8">
                    {activeSlide && (
                       <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Slide Settings</h3>
                          <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">BG Color</span>
                             <input type="color" value={activeSlide.backgroundColor || '#ffffff'} onChange={e => setFormData(p => ({ ...p, slides: p.slides?.map(s => s.id === activeSection ? { ...s, backgroundColor: e.target.value } : s) }))} className="w-8 h-8 rounded border-0 cursor-pointer" />
                          </div>
                       </div>
                    )}
                    <div className="border-t pt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Global Footer</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Left Text</label>
                                <input type="text" value={formData.footerTextLeft || ''} onChange={e => setFormData({...formData, footerTextLeft: e.target.value})} className="w-full text-sm border rounded p-1.5 focus:border-[#f57f20] outline-none" placeholder="e.g. VOLUNTEER TRAINING" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Right Text</label>
                                <input type="text" value={formData.footerTextRight || ''} onChange={e => setFormData({...formData, footerTextRight: e.target.value})} className="w-full text-sm border rounded p-1.5 focus:border-[#f57f20] outline-none" placeholder="e.g. 2026 IC" />
                            </div>
                        </div>
                    </div>
                 </div>
              )}
           </div>
      </div>
      
      <div className="h-32 bg-white border-t border-gray-200 flex items-center px-4 gap-4 overflow-x-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 pb-2">
          {formData.slides?.map((slide, idx) => (
             <div 
               key={slide.id} 
               onClick={() => setActiveSection(slide.id)}
               draggable
               onDragStart={(e) => handleSlideDragStart(e, idx)}
               onDragOver={(e) => handleSlideDragOver(e, idx)}
               onDragEnd={handleSlideDragEnd}
               className={`w-40 h-24 border rounded-lg cursor-pointer relative shrink-0 overflow-hidden bg-gray-100 group transition-all select-none ${activeSection === slide.id ? 'border-[#f57f20] ring-2 ring-orange-100 shadow-md' : 'border-gray-300 hover:border-[#f57f20]'}`}
             >
                <SlideThumbnail 
                    slide={slide} 
                    isActive={activeSection === slide.id} 
                    footerTextLeft={formData.footerTextLeft}
                    footerTextRight={formData.footerTextRight}
                />
                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm z-10">{idx + 1}</div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }} className="bg-white rounded p-1 shadow-md border border-gray-200 hover:text-blue-600"><Copy size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="bg-white rounded p-1 shadow-md border border-gray-200 hover:text-red-600"><X size={12} /></button>
                </div>
             </div>
          ))}
          <button onClick={() => setShowTemplateModal(true)} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#f57f20] hover:text-[#f57f20] hover:bg-orange-50 transition-colors shrink-0">
             <Plus size={24} className="mb-1" />
             <span className="text-xs font-medium">Add Slide</span>
          </button>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50 text-left">
                <h3 className="font-bold flex items-center gap-2 text-gray-700"><LayoutTemplate size={18} /> Choose Slide Layout</h3>
                <button onClick={() => setShowTemplateModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                {SLIDE_TEMPLATES.map((t, i) => (
                   <button key={i} onClick={() => {
                      const newSlide: Slide = {
                         id: generateId(),
                         title: t.label,
                         layout: 'canvas',
                         blocks: t.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType })),
                         content: '' 
                      };
                      setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
                      setActiveSection(newSlide.id);
                      setShowTemplateModal(false);
                   }} className="p-4 border rounded-xl hover:border-[#f57f20] hover:bg-orange-50/50 hover:shadow-md transition-all text-left flex flex-col h-full">
                      <div className="font-bold text-[#f57f20] mb-2">{t.label}</div>
                      <div className="text-sm text-gray-500">{t.description}</div>
                   </button>
                ))}
                <button onClick={() => {
                     const newSlide: Slide = { id: generateId(), title: 'Blank Slide', layout: 'canvas', blocks: [], content: '' };
                     setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
                     setActiveSection(newSlide.id);
                     setShowTemplateModal(false);
                }} className="p-4 border-2 border-dashed rounded-xl hover:bg-gray-50 transition-all flex flex-col justify-center items-center text-gray-400 hover:text-gray-600">
                    <Plus size={32} className="mb-2" />
                    <div className="font-bold">Blank Slide</div>
                </button>
             </div>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-left">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Paperclip size={18} /> Module Materials</h3>
                <button onClick={() => setShowResourceModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                   {formData.files?.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                         <div className="flex items-center gap-3 truncate">
                            <FileText size={16} className="text-gray-400" />
                            <div className="text-sm font-medium truncate text-gray-700">{file.name}</div>
                         </div>
                         <button onClick={() => setFormData(prev => ({...prev, files: prev.files?.filter(f => f.id !== file.id)}))} className="text-red-500 p-1"><Trash size={16} /></button>
                      </div>
                   ))}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 relative cursor-pointer">
                   <input type="file" onChange={handleResourceUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-[#f57f20]" />
                      <span className="text-sm text-gray-600 font-medium">Click to upload PDF or File</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolButton = ({ icon, label, onClick, active, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-colors ${active ? 'bg-orange-50 text-[#f57f20]' : 'text-gray-500 hover:bg-gray-100'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
     <div className="p-2 bg-white rounded border border-gray-200">{icon}</div>
     <span className="text-[10px] font-medium">{label}</span>
  </button>
);
