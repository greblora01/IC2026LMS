
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash, CheckCircle, 
  Eye, Image as ImageIcon, Loader2, Type as TypeIcon, 
  Youtube, X, Grid3X3, Hash, Star, Settings2, Trash2, 
  MousePointer2, Square, Layers, LayoutTemplate, ChevronRight,
  ImagePlus, Upload, Copy, FileUp, FileText, Tag
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor, TextToolbar } from '../components/RichTextEditor';
import { Module, Slide, SlideBlock, BlockType, ModuleCategory } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { NEW_MODULE_TEMPLATE_SLIDES, SLIDE_TEMPLATES } from '../constants';
import * as pdfjs from 'pdfjs-dist';

/**
 * Robust PDF.js helper to handle different module resolutions
 */
const getPdfLib = () => {
  const lib = pdfjs as any;
  if (lib && lib.getDocument) return lib;
  if (lib && lib.default && lib.default.getDocument) return lib.default;
  return lib;
};

const initPdfWorker = () => {
  try {
    const lib = getPdfLib();
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
  } catch (e) {
    console.warn("PDF.js worker initialization delayed:", e);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);
const GRID_SIZE = 2; 
const CANVAS_BASE_WIDTH = 960;
const CANVAS_BASE_HEIGHT = 540;

const safeClone = <T,>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return { ...obj } as T;
  }
};

const SlideFooter: React.FC<{ leftText?: string; rightText?: string; isThumbnail?: boolean }> = ({ leftText, rightText, isThumbnail }) => (
  <div className={`absolute bottom-0 left-0 right-0 bg-[var(--primary)] flex items-center justify-between z-0 select-none ${isThumbnail ? 'h-[12%] px-6' : 'h-[12%] px-10'}`}>
    <span className={`text-white font-black uppercase tracking-widest ${isThumbnail ? 'text-[24px]' : 'text-xl md:text-2xl'}`}>
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className={`text-white font-black uppercase tracking-widest ${isThumbnail ? 'text-[24px]' : 'text-xl md:text-2xl'}`}>
      {rightText || '2026 IC'}
    </span>
  </div>
);

const SlideThumbnail: React.FC<{ slide: Slide; footerTextLeft?: string; footerTextRight?: string }> = ({ slide, footerTextLeft, footerTextRight }) => {
  const SCALE = 0.18;
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${CANVAS_BASE_WIDTH}px`,
          height: `${CANVAS_BASE_HEIGHT}px`,
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
                  <div className="w-full h-full p-2" style={{ fontSize: '32px', color: block.style?.color || 'inherit' }} dangerouslySetInnerHTML={{ __html: block.content }} />
               )}
               {block.type === 'image' && block.content && <img src={block.content} className="w-full h-full object-cover" alt="" />}
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
  const { addModule, updateModule, getModule, theme } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    description: '',
    category: 'UNCATEGORIZED',
    thumbnail: '',
    thumbnailSlideId: '',
    footerTextLeft: 'VOLUNTEER TRAINING',
    footerTextRight: '2026 IC',
    slides: [],
    quiz: { enabled: false, questions: [] },
    stats: { views: 0, completions: 0 }
  });

  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBlockState, setInitialBlockState] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initPdfWorker();
  }, []);

  useEffect(() => {
    if (id) {
      const existing = getModule(id);
      if (existing) {
        setFormData(safeClone(existing));
        if (existing.slides.length > 0) setActiveSectionId(existing.slides[0].id);
      } else navigate('/admin');
    } else {
       const templateSlides = NEW_MODULE_TEMPLATE_SLIDES.map(s => ({
         ...s,
         id: generateId(),
         layout: 'canvas' as const,
         blocks: s.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType }))
       }));
       setFormData(prev => ({ 
         ...prev, 
         title: 'New Training Module', 
         category: 'UNCATEGORIZED',
         slides: templateSlides as Slide[], 
         thumbnailSlideId: templateSlides[0].id,
         thumbnail: ''
       }));
       setActiveSectionId(templateSlides[0].id);
    }
  }, [id, getModule, navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (!canvasContainerRef.current) return;
      const container = canvasContainerRef.current;
      const padding = 80;
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;
      const scaleX = availableWidth / CANVAS_BASE_WIDTH;
      const scaleY = availableHeight / CANVAS_BASE_HEIGHT;
      setCanvasScale(Math.min(scaleX, scaleY, 1));
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSectionId]);

  const activeSlide = useMemo(() => 
    formData.slides?.find(s => s.id === activeSectionId), 
    [formData.slides, activeSectionId]
  );

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');
    setIsSaving(true);
    const moduleData = { ...formData, lastUpdated: Date.now() } as Module;
    try {
      if (id) await updateModule(id, moduleData);
      else {
        moduleData.id = generateId();
        moduleData.createdAt = Date.now();
        await addModule(moduleData);
      }
      navigate('/admin');
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addSlide = (template: typeof SLIDE_TEMPLATES[0] | 'blank') => {
    const newSlide: Slide = template === 'blank' 
      ? { id: generateId(), title: 'Blank Slide', layout: 'canvas', blocks: [], content: '' }
      : { 
          id: generateId(), 
          title: template.label, 
          layout: 'canvas', 
          blocks: template.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType })), 
          content: '' 
        };
    
    setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
    setActiveSectionId(newSlide.id);
    setShowTemplateModal(false);
  };

  const duplicateSlide = () => {
    if (!activeSlide) return;
    const newSlide = safeClone(activeSlide);
    newSlide.id = generateId();
    newSlide.blocks = (newSlide.blocks || []).map(b => ({ ...b, id: generateId() }));
    
    const currentIdx = formData.slides?.findIndex(s => s.id === activeSectionId) ?? -1;
    const newSlides = [...(formData.slides || [])];
    newSlides.splice(currentIdx + 1, 0, newSlide);
    
    setFormData(prev => ({ ...prev, slides: newSlides }));
    setActiveSectionId(newSlide.id);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const lib = getPdfLib();
      const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
      const newSlides: Slide[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        
        const items = textContent.items as any[];
        const slideBlocks: SlideBlock[] = [];
        
        // Advanced Grouping: Group items by horizontal and vertical proximity
        const lines: Record<number, any[]> = {};
        items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item);
        });

        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
        
        let currentGroup: { y: number, items: any[] }[] = [];
        const Y_THRESHOLD = viewport.height * 0.08; 

        const createBlockFromItems = (groupedLines: { y: number, items: any[] }[]) => {
            if (groupedLines.length === 0) return null;
            
            let minX = viewport.width;
            let maxX = 0;
            let minY = viewport.height;
            let maxY = 0;
            
            groupedLines.forEach(line => {
                line.items.forEach(it => {
                   const x = it.transform[4];
                   const y = viewport.height - it.transform[5];
                   const w = it.width;
                   const h = it.height || 14;
                   
                   minX = Math.min(minX, x);
                   maxX = Math.max(maxX, x + w);
                   minY = Math.min(minY, y - h);
                   maxY = Math.max(maxY, y);
                });
            });

            // Map to percentage (avoid edges)
            const xPct = Math.max(8, Math.min(85, (minX / viewport.width) * 100));
            const yPct = Math.max(8, Math.min(80, (minY / viewport.height) * 100));
            const wPct = Math.min(85, ((maxX - minX) / viewport.width) * 100 + 4);
            const hPct = Math.min(75, ((maxY - minY) / viewport.height) * 100 + 4);

            let html = '';
            groupedLines.forEach((line, idx) => {
                const sortedItems = line.items.sort((a, b) => a.transform[4] - b.transform[4]);
                const lineText = sortedItems.map(it => it.str).join(' ');
                if (lineText.trim()) {
                   // Heuristic for headers: shorter lines at the top of a group
                   if (idx === 0 && (lineText.length < 40 || groupedLines.length === 1)) {
                      html += `<h2 style="color: ${theme.primary}; font-weight: 800; font-size: 28px; line-height: 1.2; margin-bottom: 12px;">${lineText}</h2>`;
                   } else {
                      html += `<p style="font-size: 16px; line-height: 1.5; margin-bottom: 6px; color: ${theme.text};">${lineText}</p>`;
                   }
                }
            });

            if (!html || html.replace(/<[^>]*>/g, '').trim().length === 0) return null;

            return {
                id: generateId(),
                type: 'text' as BlockType,
                x: Math.round(xPct),
                y: Math.round(yPct),
                width: Math.round(Math.max(wPct, 25)),
                height: Math.round(Math.max(hPct, 8)),
                content: html,
                zIndex: slideBlocks.length + 1,
                style: { padding: 10 }
            };
        };

        sortedY.forEach((y) => {
            const line = { y, items: lines[y] };
            if (currentGroup.length === 0) {
                currentGroup.push(line);
            } else {
                const lastY = currentGroup[currentGroup.length - 1].y;
                // If the vertical distance is too large, start a new block
                if (Math.abs(lastY - y) < Y_THRESHOLD) {
                    currentGroup.push(line);
                } else {
                    const blk = createBlockFromItems(currentGroup);
                    if (blk) slideBlocks.push(blk);
                    currentGroup = [line];
                }
            }
        });

        const lastBlk = createBlockFromItems(currentGroup);
        if (lastBlk) slideBlocks.push(lastBlk);

        const slide: Slide = {
          id: generateId(),
          title: `Document Page ${i}`,
          layout: 'canvas',
          blocks: slideBlocks,
          content: '',
          backgroundColor: '#ffffff'
        };
        newSlides.push(slide);
      }

      setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), ...newSlides] }));
      if (newSlides.length > 0) setActiveSectionId(newSlides[0].id);
    } catch (err) {
      console.error(err);
      alert("Failed to process document spatial layout.");
    } finally {
      setIsProcessingFile(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const deleteSlide = (slideId: string) => {
    if ((formData.slides?.length || 0) <= 1) return alert("Modules must have at least one slide.");
    const newSlides = formData.slides?.filter(s => s.id !== slideId) || [];
    setFormData(prev => ({ 
      ...prev, 
      slides: newSlides, 
      thumbnailSlideId: prev.thumbnailSlideId === slideId ? newSlides[0]?.id : prev.thumbnailSlideId 
    }));
    if (activeSectionId === slideId) setActiveSectionId(newSlides[0].id);
  };

  const addBlock = (type: BlockType) => {
    if (activeSectionId === 'quiz') return;
    const newBlock: SlideBlock = { 
      id: generateId(), 
      type, 
      content: type === 'text' ? '<h2 style="font-size: 24px;">New Text Item</h2>' : '', 
      x: 35, y: 35, width: 30, height: 20, 
      zIndex: (activeSlide?.blocks?.length || 0) + 1, 
      style: type === 'shape' ? { backgroundColor: '#E5E7EB', borderRadius: 8 } : {} 
    };
    setFormData(prev => ({ 
      ...prev, 
      slides: prev.slides?.map(s => s.id === activeSectionId ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s) 
    }));
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<SlideBlock>) => {
    setFormData(prev => ({ 
      ...prev, 
      slides: prev.slides?.map(s => s.id === activeSectionId ? { 
        ...s, 
        blocks: s.blocks?.map(b => b.id === blockId ? { ...b, ...updates } : b) 
      } : s) 
    }));
  };

  const deleteBlock = (blockId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      slides: prev.slides?.map(s => s.id === activeSectionId ? { 
        ...s, 
        blocks: s.blocks?.filter(b => b.id !== blockId) 
      } : s) 
    }));
    setSelectedBlockId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string, handle?: string) => {
    if (editingTextId) return;
    e.stopPropagation(); 
    const block = activeSlide?.blocks?.find(b => b.id === blockId);
    if (!block || !canvasRef.current) return;
    
    setSelectedBlockId(blockId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBlockState({ x: block.x || 0, y: block.y || 0, w: block.width || 20, h: block.height || 20 });
    
    if (handle) {
      setIsResizing(true);
      resizeHandleRef.current = handle;
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !selectedBlockId || !initialBlockState || !canvasRef.current) return;
    
    const containerRect = canvasRef.current.getBoundingClientRect();
    let deltaXPct = ((e.clientX - dragStart.x) / containerRect.width) * 100;
    let deltaYPct = ((e.clientY - dragStart.y) / containerRect.height) * 100;

    if (isDragging) {
      let nextX = initialBlockState.x + deltaXPct;
      let nextY = initialBlockState.y + deltaYPct;
      if (snapToGrid) {
        nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
        nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;
      }
      updateBlock(selectedBlockId, { x: nextX, y: nextY });
    } else if (isResizing) {
      const handle = resizeHandleRef.current;
      let { x, y, w, h: hi } = initialBlockState;
      
      if (handle?.includes('e')) w += deltaXPct;
      if (handle?.includes('w')) { x += deltaXPct; w -= deltaXPct; }
      if (handle?.includes('s')) hi += deltaYPct;
      if (handle?.includes('n')) { y += deltaYPct; hi -= deltaYPct; }

      if (snapToGrid) {
        w = Math.round(w / GRID_SIZE) * GRID_SIZE;
        hi = Math.round(hi / GRID_SIZE) * GRID_SIZE;
        x = Math.round(x / GRID_SIZE) * GRID_SIZE;
        y = Math.round(y / GRID_SIZE) * GRID_SIZE;
      }
      updateBlock(selectedBlockId, { x, y, width: Math.max(w, 2), height: Math.max(hi, 2) });
    }
  };

  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
    const palette = [theme.primary, theme.accent, '#FFFFFF', '#000000', '#F3F4F6', '#EF4444', '#10B981', '#3B82F6'];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">{label}</span>
          <div className="relative group flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              style={{ backgroundColor: value }}
            >
              <input 
                type="color" 
                value={value || '#ffffff'} 
                onChange={e => onChange(e.target.value)} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">{value}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {palette.map(c => (
            <button 
              key={c}
              onClick={() => onChange(c)}
              className={`w-6 h-6 rounded-md border border-gray-100 transition-transform hover:scale-110 active:scale-90 ${value === c ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (showPreview) return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <button onClick={() => setShowPreview(false)} className="fixed top-6 right-6 z-[110] bg-gray-900 text-white px-8 py-3 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all">
        EXIT PREVIEW
      </button>
      <ModuleViewer previewModule={formData as Module} onExitPreview={() => setShowPreview(false)} />
    </div>
  );

  return (
    <div 
      className="h-screen flex flex-col bg-gray-100 select-none overflow-hidden theme-transition" 
      onMouseUp={handleGlobalMouseUp} 
      onMouseMove={handleMouseMove}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleThumbnailFileChange} />
      <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf" onChange={handlePdfUpload} />
      
      {isProcessingFile && (
        <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-center justify-center">
           <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
              <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">Extracting Layout...</p>
           </div>
        </div>
      )}

      <header className="h-16 bg-white border-b flex justify-between items-center px-6 z-[60] shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1 text-left">
          <button onClick={() => navigate('/admin')} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-[var(--primary)] transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="h-8 w-px bg-gray-100" />
          <input 
            type="text" 
            value={formData.title || ''} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            className="text-xl font-black bg-transparent outline-none w-full max-w-md text-gray-900 tracking-tight placeholder:text-gray-200" 
            placeholder="Untitled Module" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(true)} className="px-6 py-2.5 text-gray-500 hover:bg-gray-50 rounded-xl flex items-center gap-2 font-bold transition-all">
            <Eye size={20} /> Preview
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[var(--primary)] text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-24 bg-white border-r flex flex-col items-center py-6 gap-6 shrink-0 z-50 overflow-y-auto custom-scrollbar shadow-sm">
             <ToolButton icon={<Plus size={24} />} label="Add Slide" onClick={() => setShowTemplateModal(true)} />
             <ToolButton icon={<Copy size={24} />} label="Duplicate" onClick={duplicateSlide} />
             <ToolButton icon={<FileUp size={24} />} label="Upload PDF" onClick={() => pdfInputRef.current?.click()} />
             <div className="w-12 h-px bg-gray-100" />
             <ToolButton icon={<TypeIcon size={24} />} label="Text" onClick={() => addBlock('text')} />
             <ToolButton icon={<ImageIcon size={24} />} label="Image" onClick={() => addBlock('image')} />
             <ToolButton icon={<Square size={24} />} label="Shape" onClick={() => addBlock('shape')} />
             <ToolButton icon={<Youtube size={24} />} label="Video" onClick={() => addBlock('youtube')} />
             <ToolButton icon={<CheckCircle size={24} />} label="Quiz" onClick={() => setActiveSectionId('quiz')} active={activeSectionId === 'quiz'} />
        </aside>

        <main ref={canvasContainerRef} className="flex-1 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center p-4 transition-all">
          {activeSectionId === 'quiz' ? (
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl h-fit border border-gray-100 overflow-y-auto max-h-full custom-scrollbar text-left">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Knowledge Check</h3>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.quiz?.enabled} 
                      onChange={e => setFormData(p => ({...p, quiz: {...p.quiz!, enabled: e.target.checked}}))} 
                      className="accent-[var(--primary)] w-6 h-6 rounded-lg transition-all" 
                    />
                    <span className="font-black text-gray-500 uppercase tracking-widest text-xs">Enabled</span>
                  </label>
                </div>
                
                {formData.quiz?.enabled ? (
                  <div className="space-y-8">
                    {formData.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 relative group text-left">
                        <button onClick={() => setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.filter(qu => qu.id !== q.id)}}))} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={20} />
                        </button>
                        <div className="mb-6">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-[0.2em]">Question {qi+1}</label>
                          <input 
                            value={q.text} 
                            onChange={e => setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.map(qu => qu.id === q.id ? {...qu, text: e.target.value} : qu)}}))} 
                            className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-4 focus:ring-orange-100 bg-white font-bold text-lg outline-none shadow-sm" 
                            placeholder="Enter question text..." 
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${q.correctOptionIndex === oi ? 'bg-orange-50 border-[var(--primary)]/30' : 'bg-white border-gray-50'}`}>
                              <input 
                                type="radio" 
                                checked={q.correctOptionIndex === oi} 
                                onChange={() => setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.map(qu => qu.id === q.id ? {...qu, correctOptionIndex: oi} : qu)}}))} 
                                className="accent-[var(--primary)] w-5 h-5 cursor-pointer" 
                              />
                              <input 
                                value={opt} 
                                onChange={e => {
                                  const newOpts = [...q.options]; 
                                  newOpts[oi] = e.target.value; 
                                  setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.map(qu => qu.id === q.id ? {...qu, options: newOpts} : qu)}}))
                                }} 
                                className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-200" 
                                placeholder={`Option ${oi+1}`} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setFormData(p => ({...p, quiz: {...p.quiz!, questions: [...p.quiz!.questions, {id: generateId(), text: '', options: ['','','',''], correctOptionIndex: 0}]}}))} className="w-full py-10 border-4 border-dashed border-gray-100 rounded-[3rem] text-gray-300 font-black uppercase tracking-widest hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-orange-50 transition-all">
                      + Add Question
                    </button>
                  </div>
                ) : (
                  <div className="py-32 flex flex-col items-center justify-center text-gray-200 gap-6">
                    <FileText size={80} className="opacity-20" />
                    <p className="font-black uppercase tracking-[0.4em] text-2xl text-center">Quiz is Disabled</p>
                  </div>
                )}
             </div>
          ) : activeSlide ? (
            <div 
              className="relative shadow-2xl bg-white border border-gray-100"
              style={{ width: `${CANVAS_BASE_WIDTH}px`, height: `${CANVAS_BASE_HEIGHT}px`, transform: `scale(${canvasScale})` }}
            >
               <div ref={canvasRef} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: activeSlide.backgroundColor || '#ffffff' }} onMouseDown={() => { setSelectedBlockId(null); setEditingTextId(null); }}>
                  {showGrid && <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: `${GRID_SIZE}% ${GRID_SIZE * (16/9)}%` }} />}
                  {activeSlide.blocks?.map(block => (
                    <div 
                      key={block.id} 
                      onMouseDown={(e) => handleMouseDown(e, block.id)} 
                      onDoubleClick={(e) => { e.stopPropagation(); block.type === 'text' && setEditingTextId(block.id); }}
                      className={`absolute group cursor-move ${selectedBlockId === block.id ? 'ring-2 ring-[var(--primary)] z-50 shadow-2xl' : 'hover:ring-1 hover:ring-gray-300'}`} 
                      style={{ left: `${block.x}%`, top: `${block.y}%`, width: `${block.width}%`, height: `${block.height}%`, zIndex: block.zIndex || 1, backgroundColor: block.style?.backgroundColor, borderRadius: `${block.style?.borderRadius || 0}px`, opacity: block.style?.opacity }}
                    >
                        <div className="w-full h-full overflow-hidden text-left">
                            {block.type === 'text' ? (
                              editingTextId === block.id ? (
                                <div className="h-full bg-white ring-4 ring-[var(--primary)] shadow-2xl overflow-hidden" onMouseDown={e => e.stopPropagation()}>
                                  <RichTextEditor initialContent={block.content} onChange={html => updateBlock(block.id, { content: html })} onClose={() => setEditingTextId(null)} />
                                </div>
                              ) : (
                                <div className="p-4 prose max-w-none pointer-events-none select-none slide-typography" dangerouslySetInnerHTML={{ __html: block.content }} />
                              )
                            ) : block.type === 'image' && block.content ? (
                                <img src={block.content} className="w-full h-full object-cover pointer-events-none" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                                    {block.type === 'image' ? <ImageIcon size={48} /> : block.type === 'youtube' ? <Youtube size={48} /> : null}
                                </div>
                            )}
                        </div>
                        {selectedBlockId === block.id && !editingTextId && (
                            <>
                                {['nw', 'ne', 'sw', 'se'].map(h => (
                                    <div key={h} className="absolute w-5 h-5 bg-white border-2 border-[var(--primary)] rounded-md shadow-xl z-[60]" style={{ top: h.includes('n') ? -8 : 'auto', bottom: h.includes('s') ? -8 : 'auto', left: h.includes('w') ? -8 : 'auto', right: h.includes('e') ? -8 : 'auto', cursor: `${h}-resize` }} onMouseDown={e => handleMouseDown(e, block.id, h)} />
                                ))}
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl flex items-center gap-2 p-1.5 shadow-2xl">
                                   <button onClick={(e) => {e.stopPropagation(); updateBlock(block.id, { zIndex: (block.zIndex || 1) + 1 });}} className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="Layer Up"><Layers size={16} /></button>
                                   <div className="w-px h-4 bg-white/10" />
                                   <button onClick={(e) => {e.stopPropagation(); deleteBlock(block.id);}} className="p-2 hover:bg-red-500 rounded-xl text-red-400 hover:text-white transition-all" title="Remove"><Trash2 size={16} /></button>
                                </div>
                            </>
                        )}
                    </div>
                  ))}
                  <SlideFooter leftText={formData.footerTextLeft} rightText={formData.footerTextRight} />
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 text-gray-300">
              <Loader2 size={48} className="animate-spin text-gray-200" />
              <p className="font-black uppercase tracking-widest text-sm text-center">Initializing Workspace...</p>
            </div>
          )}
        </main>

        <aside className="w-80 bg-white border-l p-8 shrink-0 z-50 text-left overflow-y-auto custom-scrollbar shadow-sm">
          {editingTextId ? (
            <div className="space-y-8 text-left">
               <div className="flex items-center gap-3 text-[var(--primary)] mb-8">
                  <TypeIcon size={22} strokeWidth={3} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Text Formatting</h3>
              </div>
              <TextToolbar onClose={() => setEditingTextId(null)} />
            </div>
          ) : selectedBlockId && activeSlide?.blocks?.find(b => b.id === selectedBlockId) ? (
             <div className="space-y-8 text-left">
                <div className="flex items-center gap-3 text-[var(--primary)] mb-8">
                    <Settings2 size={22} strokeWidth={3} />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Properties</h3>
                </div>
                
                {activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.type === 'image' && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Image Source</label>
                        <input 
                          type="text" 
                          value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.content} 
                          onChange={e => updateBlock(selectedBlockId!, { content: e.target.value })} 
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-orange-100 transition-all font-medium" 
                          placeholder="Paste image URL here..." 
                        />
                    </div>
                )}

                <div className="pt-8 border-t border-gray-50 text-left space-y-8">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Appearance</label>
                    <ColorInput 
                      label="Fill Color" 
                      value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.backgroundColor || '#ffffff'} 
                      onChange={v => updateBlock(selectedBlockId!, { style: { ...activeSlide?.blocks?.find(b => b.id === selectedBlockId!)?.style, backgroundColor: v } })} 
                    />
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Rounded Corners</span>
                            <span>{activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.borderRadius || 0}px</span>
                        </div>
                        <input type="range" min="0" max="100" value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.borderRadius || 0} onChange={e => updateBlock(selectedBlockId!, { style: { ...activeSlide?.blocks?.find(b => b.id === selectedBlockId!)?.style, borderRadius: parseInt(e.target.value) } })} className="w-full accent-[var(--primary)]" />
                    </div>
                </div>

                <button onClick={() => deleteBlock(selectedBlockId!)} className="w-full py-5 text-red-500 font-black text-xs uppercase tracking-widest bg-red-50 rounded-[2rem] mt-12 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100">
                  Remove Element
                </button>
             </div>
          ) : (
             <div className="space-y-10 text-left">
                <div className="flex items-center gap-3 text-gray-300 mb-8">
                    <MousePointer2 size={22} strokeWidth={3} />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Editor</h3>
                </div>

                <div className="space-y-8 text-left">
                  {/* Category Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <Tag size={16} className="text-[var(--primary)]" />
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Module Category</label>
                    </div>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as ModuleCategory })}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100 transition-all cursor-pointer"
                    >
                      <option value="UNCATEGORIZED">Uncategorized</option>
                      <option value="GVM">General Volunteer (GVM)</option>
                      <option value="CCVM">Convention Committee (CCVM)</option>
                      <option value="HCVM">Hospitality Committee (HCVM)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <ImagePlus size={16} className="text-[var(--primary)]" />
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Cover Image</label>
                    </div>
                    {formData.thumbnail ? (
                      <div className="relative group mb-3 aspect-video rounded-2xl overflow-hidden border-2 border-orange-100 shadow-lg">
                        <img src={formData.thumbnail} className="w-full h-full object-cover" alt="Cover preview" />
                        <button onClick={() => setFormData({ ...formData, thumbnail: '' })} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white font-black text-[10px] uppercase tracking-widest">Clear Custom Image</button>
                      </div>
                    ) : (
                      <div className="mb-3 aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 text-[10px] font-black uppercase px-6 text-center leading-relaxed">Using automatic slide thumbnail</div>
                    )}
                    <div className="flex flex-col gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-orange-50 text-[var(--primary)] rounded-2xl border-2 border-[var(--primary)]/10 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all">
                           <Upload size={16} /> Upload Image File
                        </button>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 space-y-6 text-left">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Slide Options</label>
                    <ColorInput 
                      label="Background" 
                      value={activeSlide?.backgroundColor || '#ffffff'} 
                      onChange={v => setFormData(p => ({...p, slides: p.slides?.map(s => s.id === activeSectionId ? {...s, backgroundColor: v} : s)}))} 
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 pt-8 border-t border-gray-50 text-left">
                    <button onClick={() => setShowGrid(!showGrid)} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-2 transition-all ${showGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/30 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-100'}`}>
                      <Grid3X3 size={18} /> {showGrid ? 'Hide Grid' : 'Show Grid'}
                    </button>
                    <button onClick={() => setSnapToGrid(!snapToGrid)} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-2 transition-all ${snapToGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/30 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-100'}`}>
                      <Hash size={18} /> {snapToGrid ? 'Snapping On' : 'Snapping Off'}
                    </button>
                </div>
             </div>
          )}
        </aside>
      </div>

      <footer className="h-48 bg-white border-t flex items-center px-10 gap-10 overflow-x-auto shrink-0 z-[60] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.08)] custom-scrollbar">
          {formData.slides?.map((slide, idx) => (
             <div key={slide.id} onClick={() => setActiveSectionId(slide.id)} className={`w-64 h-36 border-[4px] rounded-[2.5rem] cursor-pointer relative shrink-0 overflow-hidden group transition-all duration-500 ${activeSectionId === slide.id ? 'border-[var(--primary)] shadow-2xl scale-110 -translate-y-2' : 'border-gray-50 opacity-60 hover:opacity-100'}`}>
                <SlideThumbnail slide={slide} footerTextLeft={formData.footerTextLeft} footerTextRight={formData.footerTextRight} />
                <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-black px-4 py-1.5 rounded-xl backdrop-blur-md z-10 tracking-[0.2em]">{idx + 1}</div>
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-30">
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="w-full bg-white rounded-2xl py-2.5 shadow-2xl border-2 border-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Trash size={18} /> Delete
                    </button>
                </div>
             </div>
          ))}
          <button onClick={() => setShowTemplateModal(true)} className="w-64 h-36 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-orange-50 transition-all shrink-0 font-black uppercase text-xs tracking-[0.3em] gap-4 group">
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-xl transition-all"><Plus size={36} strokeWidth={3} /></div>
            New Slide
          </button>
      </footer>

      {showTemplateModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl p-20 relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-50 rounded-full -mr-[20rem] -mt-[20rem] blur-[10rem] opacity-40"></div>
             <div className="flex justify-between items-center mb-16 relative z-10">
                <div>
                  <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Select Layout</h3>
                  <p className="text-gray-400 font-medium text-lg">Choose a starting point for your new slide.</p>
                </div>
                <button onClick={() => setShowTemplateModal(false)} className="p-5 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"><X size={40} /></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {SLIDE_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => addSlide(t)} className="p-10 border-4 border-gray-50 rounded-[3rem] text-left hover:border-[var(--primary)]/30 hover:bg-orange-50/20 transition-all group relative h-full flex flex-col">
                        <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center text-gray-200 group-hover:text-[var(--primary)] mb-10 transition-colors"><LayoutTemplate size={40} /></div>
                        <div className="font-black text-2xl text-gray-900 mb-4 group-hover:text-[var(--primary)] transition-colors">{t.label}</div>
                        <div className="text-sm text-gray-400 font-medium leading-relaxed flex-1">{t.description}</div>
                        <ChevronRight className="mt-6 text-gray-200 group-hover:text-[var(--primary)]" />
                    </button>
                ))}
                <button onClick={() => addSlide('blank')} className="p-10 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-[0.2em] hover:border-[var(--primary)]/40 hover:bg-orange-50/20 hover:text-[var(--primary)] transition-all gap-6 group">
                    <div className="p-8 bg-gray-50 rounded-3xl group-hover:bg-white group-hover:shadow-2xl transition-all"><Plus size={64} strokeWidth={3} /></div>
                    Blank Slide
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolButton = ({ icon, label, onClick, active }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2 group p-2 rounded-2xl w-20 transition-all ${active ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
     <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${active ? 'bg-white border-[var(--primary)] text-[var(--primary)] shadow-2xl shadow-orange-100' : 'bg-white border-gray-50 text-gray-400 group-hover:border-gray-200 group-hover:text-gray-600 shadow-sm'}`}>
      {icon}
     </div>
     <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-[var(--primary)]' : 'text-gray-400 group-hover:text-gray-600'} text-center truncate w-full`}>{label}</span>
  </button>
);
