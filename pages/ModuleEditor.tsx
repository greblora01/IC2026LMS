
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { throttle } from 'lodash';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  Eye, Image as ImageIcon, Loader2, Type as TypeIcon, 
  Youtube, X, Grid3X3, Hash, Settings2, 
  MousePointer2, Square, Layers, LayoutTemplate,
  RotateCcw, RotateCw,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, List, ZoomIn, ZoomOut, ChevronDown, Shapes, Upload, ImagePlus, FileUp
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor, applyGlobalCommand, restoreGlobalSelection, saveGlobalSelection } from '../components/RichTextEditor';
import { Module, Slide, SlideBlock, BlockType, ModuleCategory } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { NEW_MODULE_TEMPLATE_SLIDES, SLIDE_TEMPLATES } from '../constants';

// --- PDF.js Initialization Helpers ---
// Fixes "pdfjsLib.getDocument is not a function" by checking default vs named exports
const getPdfLoader = () => {
    if (pdfjsLib && (pdfjsLib as any).getDocument) {
        return (pdfjsLib as any).getDocument;
    }
    if (pdfjsLib && (pdfjsLib as any).default && (pdfjsLib as any).default.getDocument) {
        return (pdfjsLib as any).default.getDocument;
    }
    return null;
};

const getGlobalWorkerOptions = () => {
    if (pdfjsLib && (pdfjsLib as any).GlobalWorkerOptions) {
        return (pdfjsLib as any).GlobalWorkerOptions;
    }
    if (pdfjsLib && (pdfjsLib as any).default && (pdfjsLib as any).default.GlobalWorkerOptions) {
        return (pdfjsLib as any).default.GlobalWorkerOptions;
    }
    return null;
};

const initializePdfJs = () => {
  try {
    const GlobalWorkerOptions = getGlobalWorkerOptions();
    if (GlobalWorkerOptions) {
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
  } catch (e) { console.warn("PDF.js worker initialization failed", e); }
};
initializePdfJs();

const generateId = () => Math.random().toString(36).substr(2, 9);
const GRID_SIZE = 10; 
const CANVAS_BASE_WIDTH = 960;
const CANVAS_BASE_HEIGHT = 540;

const safeClone = <T,>(obj: T): T => {
  try { return JSON.parse(JSON.stringify(obj)); } 
  catch (e) { return { ...obj } as T; }
};

const SlideFooter: React.FC<{ leftText?: string; rightText?: string }> = React.memo(({ leftText, rightText }) => (
  <div className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] flex items-center justify-between h-[12%] px-10 z-0 select-none">
    <span className="text-white font-black uppercase tracking-widest text-xl md:text-2xl">
      {leftText || 'VOLUNTEER TRAINING'}
    </span>
    <span className="text-white font-black uppercase tracking-widest text-xl md:text-2xl">
      {rightText || '2026 IC'}
    </span>
  </div>
));

const Ruler: React.FC<{ orientation: 'horizontal' | 'vertical'; scale: number; size: number }> = ({ orientation, scale, size }) => {
  const ticks = [];
  const step = 50;
  for (let i = 0; i <= size; i += step) {
    ticks.push(
      <div 
        key={i} 
        className="absolute flex items-start"
        style={{
          [orientation === 'horizontal' ? 'left' : 'top']: `${i * scale}px`,
          [orientation === 'horizontal' ? 'height' : 'width']: i % 100 === 0 ? '100%' : '50%',
        }}
      >
        <div className={`bg-gray-300 ${orientation === 'horizontal' ? 'w-px h-full' : 'h-px w-full'}`} />
        {i % 100 === 0 && (
          <span className={`text-[8px] font-bold text-gray-400 select-none ${orientation === 'horizontal' ? 'ml-1 mt-1' : 'ml-1 mt-0.5'}`}>
            {i}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative bg-white/50 border-gray-100 ${orientation === 'horizontal' ? 'h-6 w-full border-b' : 'w-6 h-full border-r'}`}>
      {ticks}
    </div>
  );
};

const SlideThumbnail: React.FC<{ slide: Slide; footerTextLeft?: string; footerTextRight?: string }> = ({ slide, footerTextLeft, footerTextRight }) => {
  const scale = 192 / CANVAS_BASE_WIDTH;
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${CANVAS_BASE_WIDTH}px`,
          height: `${CANVAS_BASE_HEIGHT}px`,
          transform: `scale(${scale})`, 
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
                borderRadius: block.style?.borderRadius ? `${block.style.borderRadius * (1/scale)}px` : undefined,
                opacity: block.style?.opacity,
                color: block.style?.color || 'inherit',
              }}
              className="overflow-hidden"
            >
               {block.type === 'text' && (
                  <div className="w-full h-full p-2" style={{ fontSize: '32px' }} dangerouslySetInnerHTML={{ __html: block.content }} />
               )}
               {block.type === 'image' && block.content && (
                  <img src={block.content} className="w-full h-full object-cover" alt="" />
               )}
            </div>
         ))}
         <SlideFooter leftText={footerTextLeft} rightText={footerTextRight} />
      </div>
    </div>
  );
};

export const ModuleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addModule, updateModule, getModule } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Module>>({
    title: '', description: '', category: 'UNCATEGORIZED',
    thumbnail: '', thumbnailSlideId: '',
    footerTextLeft: 'VOLUNTEER TRAINING', footerTextRight: '2026 IC',
    slides: [], quiz: { enabled: false, questions: [] }, stats: { views: 0, completions: 0 }
  });

  const [history, setHistory] = useState<Partial<Module>[]>([]);
  const [future, setFuture] = useState<Partial<Module>[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [canvasScale, setCanvasScale] = useState(0.85);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBlockState, setInitialBlockState] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [fontSizeInput, setFontSizeInput] = useState('24');

  const canvasRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockFileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const activeSlide = useMemo(() => formData.slides?.find(s => s.id === activeSectionId), [formData.slides, activeSectionId]);
  const activeBlock = useMemo(() => activeSlide?.blocks?.find(b => b.id === selectedBlockId), [activeSlide, selectedBlockId]);

  const updateStateWithHistory = useCallback((next: Partial<Module> | ((prev: Partial<Module>) => Partial<Module>)) => {
    setFormData(prev => {
      const updated = typeof next === 'function' ? next(prev) : next;
      setHistory(h => [safeClone(prev), ...h].slice(0, 50));
      setFuture([]);
      return updated;
    });
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<SlideBlock>) => {
    setFormData(prev => ({ 
      ...prev, 
      slides: prev.slides?.map(s => s.id === activeSectionId ? { 
        ...s, 
        blocks: s.blocks?.map(b => b.id === blockId ? { 
          ...b, 
          ...updates, 
          style: { ...(b.style || {}), ...(updates.style || {}) } 
        } : b) 
      } : s) 
    }));
  }, [activeSectionId]);

  useEffect(() => {
    if (id) {
      const existing = getModule(id);
      if (existing) {
        setFormData(safeClone(existing));
        if (existing.slides.length > 0) setActiveSectionId(existing.slides[0].id);
      } else navigate('/admin');
    } else {
       const templateSlides = NEW_MODULE_TEMPLATE_SLIDES.map(s => ({
         ...s, id: generateId(), layout: 'canvas' as const,
         blocks: s.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType }))
       }));
       setFormData(prev => ({ 
         ...prev, title: 'New Training Module', category: 'UNCATEGORIZED',
         slides: templateSlides as Slide[], thumbnailSlideId: templateSlides[0].id, thumbnail: ''
       }));
       setActiveSectionId(templateSlides[0].id);
    }
  }, [id, getModule, navigate]);

  const addBlock = (type: BlockType) => {
    const newBlock: SlideBlock = {
      id: generateId(),
      type,
      content: type === 'text' ? '<h2>New Content</h2>' : '',
      x: 30, y: 30, width: 40, height: 20,
      zIndex: (activeSlide?.blocks?.length || 0) + 1,
      style: { borderRadius: 0, opacity: 1, textAlign: 'left' }
    };
    updateStateWithHistory(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === activeSectionId ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s)
    }));
    setSelectedBlockId(newBlock.id);
  };

  const deleteBlock = useCallback((blockId: string) => {
    updateStateWithHistory(prev => ({ 
      ...prev, 
      slides: prev.slides?.map(s => s.id === activeSectionId ? { ...s, blocks: s.blocks?.filter(b => b.id !== blockId) } : s) 
    }));
    setSelectedBlockId(null);
  }, [activeSectionId, updateStateWithHistory]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData) return;

    setIsProcessingPdf(true);
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Use helper to resolve the correct function from the imported module
        const getDocument = getPdfLoader();
        if (!getDocument) throw new Error("PDF.js library could not be loaded. Please refresh the page.");
        
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const newSlides: Slide[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            const { width: pageWidth, height: pageHeight } = viewport;
            
            const textContent = await page.getTextContent();
            const operatorList = await page.getOperatorList();
            
            const blocks: SlideBlock[] = [];

            // 1. Process Text with Formatting
            const items = textContent.items.filter((item: any) => item.str.trim().length > 0);
            
            // Sort items: Top to Bottom (Y desc), then Left to Right (X asc)
            items.sort((a: any, b: any) => {
                const yA = a.transform[5];
                const yB = b.transform[5];
                if (Math.abs(yA - yB) > 8) return yB - yA; // Different lines
                return a.transform[4] - b.transform[4]; // Same line
            });

            // Group into lines
            const lines: any[][] = [];
            let currentLine: any[] = [];
            items.forEach((item: any) => {
                if (currentLine.length === 0) {
                    currentLine.push(item);
                } else {
                    const lastItem = currentLine[currentLine.length - 1];
                    const yDiff = Math.abs(lastItem.transform[5] - item.transform[5]);
                    if (yDiff < 8) {
                        currentLine.push(item);
                    } else {
                        lines.push(currentLine);
                        currentLine = [item];
                    }
                }
            });
            if (currentLine.length > 0) lines.push(currentLine);

            // Create blocks from lines
            lines.forEach((line, idx) => {
                const firstItem = line[0];
                const lastItem = line[line.length - 1];
                const text = line.map((it: any) => it.str).join(' ');

                // Extract Style
                const pdfY = firstItem.transform[5];
                const pdfX = firstItem.transform[4];
                const fontSize = Math.abs(firstItem.transform[3]); // Transform[3] is roughly font size
                const isBold = firstItem.fontName?.toLowerCase().includes('bold');
                const isItalic = firstItem.fontName?.toLowerCase().includes('italic');

                // Convert to %
                const xPct = (pdfX / pageWidth) * 100;
                // PDF Y is bottom-up. HTML Top is (PageHeight - PDF_Y - FontHeight)
                const yPct = ((pageHeight - pdfY - fontSize) / pageHeight) * 100;
                
                // Estimate width
                const widthPx = (lastItem.transform[4] + (lastItem.width || 0)) - pdfX;
                const widthPct = Math.min(90, Math.max(10, (widthPx / pageWidth) * 100 * 1.1));

                blocks.push({
                    id: `pdf_txt_${Date.now()}_${i}_${idx}`,
                    type: 'text',
                    content: text,
                    x: Math.max(0, Math.min(95, xPct)),
                    y: Math.max(0, Math.min(95, yPct)),
                    width: widthPct,
                    height: Math.max(4, (fontSize * 1.5 / pageHeight) * 100),
                    style: {
                        fontSize: Math.max(12, Math.round(fontSize)),
                        color: '#333333',
                        textAlign: 'left',
                        fontWeight: isBold ? 'bold' : 'normal',
                        fontStyle: isItalic ? 'italic' : 'normal',
                    }
                });
            });

            // 2. Process Image Placeholders
            // Check operator list for image painting operations
            const paintImageOps = [82, 85, 86]; 
            let hasImages = false;
            
            if (operatorList && operatorList.fnArray) {
                 for (let op of operatorList.fnArray) {
                     if (paintImageOps.includes(op)) {
                         hasImages = true;
                         break;
                     }
                 }
            }

            if (hasImages) {
                blocks.push({
                    id: `pdf_img_ph_${Date.now()}_${i}`,
                    type: 'image',
                    content: 'https://placehold.co/600x400/png?text=Image+Detected+-+Replace+Me',
                    x: 25,
                    y: 30, // Position loosely in middle
                    width: 50,
                    height: 40,
                    style: {
                        borderColor: '#f57f20',
                        borderWidth: 2,
                        opacity: 0.9,
                        backgroundColor: '#f1f5f9'
                    }
                });
            }

            newSlides.push({
                id: `pdf_slide_${Date.now()}_${i}`,
                title: `Page ${i}`,
                layout: 'canvas',
                blocks: blocks,
                content: ''
            });
        }

        setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), ...newSlides] }));
    } catch (err) {
        console.error("PDF Error", err);
        alert("Could not process PDF. Ensure PDF.js is loaded correctly.");
    } finally {
        setIsProcessingPdf(false);
    }
};

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[0];
    setHistory(h => h.slice(1));
    setFuture(f => [safeClone(formData), ...f]);
    setFormData(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [safeClone(formData), ...h]);
    setFormData(next);
  };

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
    } catch (error: any) { alert("Failed to save: " + error.message); }
    finally { setIsSaving(false); }
  };

  const throttledMouseMove = useMemo(() => throttle((clientX: number, clientY: number) => {
    if ((!isDragging && !isResizing) || !selectedBlockId || !initialBlockState || !canvasRef.current) return;
    const containerRect = canvasRef.current.getBoundingClientRect();
    let deltaXPct = ((clientX - dragStart.x) / (containerRect.width || 1)) * 100;
    let deltaYPct = ((clientY - dragStart.y) / (containerRect.height || 1)) * 100;

    if (isDragging) {
      let nextX = initialBlockState.x + deltaXPct;
      let nextY = initialBlockState.y + deltaYPct;
      if (snapToGrid) {
        nextX = Math.round(nextX / (GRID_SIZE / 10)) * (GRID_SIZE / 10);
        nextY = Math.round(nextY / (GRID_SIZE / 10)) * (GRID_SIZE / 10);
      }
      updateBlock(selectedBlockId, { x: nextX, y: nextY });
    } else if (isResizing) {
      const handle = resizeHandleRef.current;
      let { x, y, w, h: hi } = initialBlockState;
      if (handle?.includes('e')) w += deltaXPct;
      if (handle?.includes('w')) { x += deltaXPct; w -= deltaXPct; }
      if (handle?.includes('s')) hi += deltaYPct;
      if (handle?.includes('n')) { y += deltaYPct; hi -= deltaYPct; }
      updateBlock(selectedBlockId, { x, y, width: Math.max(w, 2), height: Math.max(hi, 2) });
    }
  }, 16), [isDragging, isResizing, selectedBlockId, initialBlockState, dragStart, snapToGrid, updateBlock]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => throttledMouseMove(e.clientX, e.clientY);
    const onMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, isResizing, throttledMouseMove]);

  const addSlide = (template: typeof SLIDE_TEMPLATES[0] | 'blank') => {
    const newSlide: Slide = template === 'blank' 
      ? { id: generateId(), title: 'Blank Slide', layout: 'canvas', blocks: [], content: '' }
      : { 
          id: generateId(), title: template.label, layout: 'canvas', 
          blocks: template.blocks.map(b => ({ ...b, id: generateId(), type: b.type as BlockType })), 
          content: '' 
        };
    updateStateWithHistory(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
    setActiveSectionId(newSlide.id);
    setShowTemplateModal(false);
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string, handle?: string) => {
    if (handle) {
      e.stopPropagation();
      const block = activeSlide?.blocks?.find(b => b.id === blockId);
      if (!block || !canvasRef.current) return;
      setSelectedBlockId(blockId);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialBlockState({ x: block.x || 0, y: block.y || 0, w: block.width || 20, h: block.height || 20 });
      setIsResizing(true);
      resizeHandleRef.current = handle;
      return;
    }

    // Default behavior for selecting and dragging the block
    e.stopPropagation(); 
    const block = activeSlide?.blocks?.find(b => b.id === blockId);
    if (!block || !canvasRef.current) return;
    setSelectedBlockId(blockId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBlockState({ x: block.x || 0, y: block.y || 0, w: block.width || 20, h: block.height || 20 });
    setIsDragging(true);
  };

  const applyFontSize = (size: string) => {
    if (!size) return;
    restoreGlobalSelection(true);
    // Use execCommand with styleWithCSS for pixel-perfect results
    document.execCommand('styleWithCSS', false, 'true');
    // We use a dummy fontSize '7' then swap it for actual pixels in the active editor
    document.execCommand('fontSize', false, '7');
    
    // Get the editor instance to clean up the <font> tags it might have produced
    const editor = document.activeElement as HTMLDivElement;
    if (editor && editor.contentEditable === 'true') {
      const fonts = editor.getElementsByTagName('font');
      for (let i = 0; i < fonts.length; i++) {
        const font = fonts[i];
        if (font.getAttribute('size') === '7') {
          font.removeAttribute('size');
          font.style.fontSize = size + 'px';
        }
      }
      // Manually trigger 'input' so React state updates
      const event = new Event('input', { bubbles: true });
      editor.dispatchEvent(event);
    }
    saveGlobalSelection();
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateStateWithHistory({ ...formData, thumbnail: reader.result as string, thumbnailSlideId: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlockImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedBlockId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBlock(selectedBlockId, { content: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const RibbonButton = ({ icon, onClick, title, active = false }: any) => (
    <button
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${active ? 'bg-orange-100 text-[var(--primary)]' : 'hover:bg-gray-100 text-gray-500'}`}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-[#EBEDF0] select-none overflow-hidden font-sans text-left">
      <header className="h-14 bg-white border-b flex justify-between items-center px-4 z-[100] shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ArrowLeft size={18} /></button>
          <div className="h-6 w-px bg-gray-100" />
          <input 
            type="text" 
            value={formData.title || ''} 
            onChange={e => updateStateWithHistory({ ...formData, title: e.target.value })} 
            className="text-sm font-black bg-transparent outline-none w-full max-w-xs text-gray-900 placeholder:text-gray-300" 
            placeholder="Untitled Training Module" 
          />
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 mr-4">
              <button onClick={() => setCanvasScale(Math.max(0.25, canvasScale - 0.1))} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-gray-900 transition-all"><ZoomOut size={16} /></button>
              <div className="flex items-center gap-2 px-2 border-x border-gray-100">
                 <input 
                  type="range" 
                  min="25" max="200" 
                  value={canvasScale * 100} 
                  onChange={e => setCanvasScale(parseInt(e.target.value) / 100)} 
                  className="w-20 accent-[var(--primary)]"
                 />
                 <span className="text-[10px] font-black w-8 text-center text-gray-500">{Math.round(canvasScale * 100)}%</span>
              </div>
              <button onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-gray-900 transition-all"><ZoomIn size={16} /></button>
           </div>
           
           <button onClick={() => setShowPreview(true)} className="px-5 py-2 text-gray-500 hover:bg-gray-50 rounded-xl flex items-center gap-2 font-bold text-xs"><Eye size={16} /> Preview</button>
           <button onClick={handleSave} className="bg-[var(--primary)] text-white px-8 py-2 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-orange-100 text-xs transition-all">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
           </button>
        </div>
      </header>

      {/* Ribbon Bar (Formatting) */}
      <div className="h-14 bg-white border-b flex items-center px-6 gap-3 z-[90] shrink-0 shadow-sm overflow-x-auto custom-scrollbar">
         <div className="flex items-center gap-1.5 pr-4 border-r border-gray-100">
            <select 
              className="text-[11px] font-bold bg-gray-50 border border-gray-100 outline-none px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100"
              onChange={(e) => applyGlobalCommand('fontName', e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Font Family</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>

            <div className="relative flex items-center">
               <div className="relative">
                  <select 
                    className="appearance-none bg-gray-50 border border-gray-100 text-[11px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 pr-10 w-24"
                    onChange={(e) => {
                        setFontSizeInput(e.target.value);
                        applyFontSize(e.target.value);
                    }}
                    value={fontSizeInput}
                  >
                     <option value="" disabled>Size</option>
                     {[8,9,10,11,12,14,16,18,20,24,28,32,36,48,64,72,96,120,150,200].map(s => (
                        <option key={s} value={s}>{s}px</option>
                     ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
               </div>
            </div>
         </div>

         <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
            <RibbonButton icon={<Bold size={18} />} onClick={() => applyGlobalCommand('bold')} title="Bold" />
            <RibbonButton icon={<Italic size={18} />} onClick={() => applyGlobalCommand('italic')} title="Italic" />
            <RibbonButton icon={<Underline size={18} />} onClick={() => applyGlobalCommand('underline')} title="Underline" />
         </div>

         <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
            <RibbonButton icon={<AlignLeft size={18} />} onClick={() => applyGlobalCommand('justifyLeft')} title="Left" />
            <RibbonButton icon={<AlignCenter size={18} />} onClick={() => applyGlobalCommand('justifyCenter')} title="Center" />
            <RibbonButton icon={<AlignRight size={18} />} onClick={() => applyGlobalCommand('justifyRight')} title="Right" />
            <RibbonButton icon={<AlignJustify size={18} />} onClick={() => applyGlobalCommand('justifyFull')} title="Justify" />
         </div>

         <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
            <RibbonButton icon={<List size={18} />} onClick={() => applyGlobalCommand('insertUnorderedList')} title="Bullets" />
         </div>

         <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative">
                <input 
                type="color" 
                className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer border-none p-0"
                onChange={(e) => applyGlobalCommand('foreColor', e.target.value)}
                title="Text Color"
                />
            </div>
         </div>

         <div className="ml-auto flex items-center gap-3">
            <RibbonButton icon={<RotateCcw size={16} />} onClick={undo} title="Undo" />
            <RibbonButton icon={<RotateCw size={16} />} onClick={redo} title="Redo" />
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-16 bg-white border-r flex flex-col items-center py-6 gap-6 shrink-0 z-50 shadow-sm">
             <ToolButton icon={<Plus size={22} />} onClick={() => setShowTemplateModal(true)} title="Add Slide" />
             <div className="w-8 h-px bg-gray-100" />
             <input type="file" ref={pdfInputRef} className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
             <ToolButton icon={<FileUp size={22} />} onClick={() => pdfInputRef.current?.click()} title="Import PDF" />
             <ToolButton icon={<TypeIcon size={22} />} onClick={() => addBlock('text')} title="Text Block" />
             <ToolButton icon={<ImageIcon size={22} />} onClick={() => addBlock('image')} title="Image" />
             <ToolButton icon={<Shapes size={22} />} onClick={() => addBlock('svg')} title="Shape/SVG" />
             <ToolButton icon={<Square size={22} />} onClick={() => addBlock('shape')} title="Background Box" />
             <ToolButton icon={<Youtube size={22} />} onClick={() => addBlock('youtube')} title="Video Player" />
        </aside>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="h-6 flex shrink-0 bg-white z-20">
             <div className="w-6 shrink-0 border-b border-r border-gray-200 bg-gray-50" />
             <div className="flex-1 relative overflow-hidden bg-white border-b border-gray-100">
                <div 
                   className="absolute"
                   style={{ left: `calc(50% - ${(CANVAS_BASE_WIDTH * canvasScale) / 2}px)` }}
                >
                   <Ruler orientation="horizontal" scale={canvasScale} size={CANVAS_BASE_WIDTH} />
                </div>
             </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
             <div className="w-6 flex-col shrink-0 relative overflow-hidden bg-white border-r border-gray-100 z-20">
                <div 
                   className="absolute"
                   style={{ top: `calc(50% - ${(CANVAS_BASE_HEIGHT * canvasScale) / 2}px)` }}
                >
                   <Ruler orientation="vertical" scale={canvasScale} size={CANVAS_BASE_HEIGHT} />
                </div>
             </div>

             <main 
               className="flex-1 relative overflow-auto p-96 custom-scrollbar flex items-center justify-center bg-[#EBEDF0]" 
               onMouseDown={() => { setSelectedBlockId(null); }}
             >
                <div 
                   ref={canvasRef}
                   className="bg-white shadow-2xl relative shrink-0 transition-transform origin-center"
                   style={{ 
                     width: `${CANVAS_BASE_WIDTH}px`, 
                     height: `${CANVAS_BASE_HEIGHT}px`, 
                     transform: `scale(${canvasScale})`,
                     backgroundColor: activeSlide?.backgroundColor || '#ffffff'
                   }}
                >
                  {showGrid && <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />}
                  
                  {activeSlide?.blocks?.map(block => (
                    <div 
                      key={block.id} 
                      onMouseDown={(e) => handleMouseDown(e, block.id)} 
                      className={`absolute group ${selectedBlockId === block.id ? 'ring-2 ring-[var(--primary)] z-50 shadow-2xl' : 'hover:ring-1 hover:ring-gray-300'}`} 
                      style={{ 
                        left: `${block.x}%`, top: `${block.y}%`, width: `${block.width}%`, height: `${block.height}%`, 
                        zIndex: block.zIndex || 1, backgroundColor: block.style?.backgroundColor, borderRadius: `${block.style?.borderRadius || 0}px`, 
                        opacity: block.style?.opacity, color: block.style?.color || 'inherit',
                        textAlign: (block.style?.textAlign as any) || 'inherit'
                      }}
                    >
                        <div 
                          className="w-full h-full overflow-hidden text-left relative"
                          onMouseDown={e => {
                            // Only stop propagation if we click inside the text while the block is ALREADY selected
                            // This allows highlight logic to work without triggering drag
                            if (selectedBlockId === block.id) e.stopPropagation();
                          }}
                        >
                            {block.type === 'text' ? (
                                <RichTextEditor 
                                    isActive={selectedBlockId === block.id}
                                    initialContent={block.content} 
                                    onChange={html => updateBlock(block.id, { content: html })} 
                                    className={`p-2 h-full w-full ${selectedBlockId === block.id ? 'cursor-text' : 'cursor-move'}`}
                                />
                            ) : block.type === 'image' && block.content ? (
                                <img src={block.content} className="w-full h-full object-cover pointer-events-none" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                                    {block.type === 'image' ? <ImageIcon size={32} /> : block.type === 'youtube' ? <Youtube size={32} /> : block.type === 'svg' ? <Shapes size={32} /> : null}
                                </div>
                            )}
                        </div>

                        {selectedBlockId === block.id && (
                            <>
                                {['nw', 'ne', 'sw', 'se'].map(h => (
                                    <div 
                                      key={h} 
                                      className="absolute w-3 h-3 bg-white border-2 border-[var(--primary)] rounded shadow z-[60]" 
                                      style={{ 
                                        top: h.includes('n') ? -6 : 'auto', 
                                        bottom: h.includes('s') ? -6 : 'auto', 
                                        left: h.includes('w') ? -6 : 'auto', 
                                        right: h.includes('e') ? -6 : 'auto', 
                                        cursor: `${h}-resize` 
                                      }} 
                                      onMouseDown={e => handleMouseDown(e, block.id, h)} 
                                    />
                                ))}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl flex items-center gap-1 p-1 shadow-2xl z-[70]">
                                   <button onClick={(e) => {e.stopPropagation(); updateBlock(block.id, { zIndex: (block.zIndex || 1) + 1 });}} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Layers size={14} /></button>
                                   <button onClick={(e) => {e.stopPropagation(); deleteBlock(block.id);}} className="p-1.5 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all"><Trash2 size={14} /></button>
                                </div>
                            </>
                        )}
                    </div>
                  ))}
                  <SlideFooter leftText={formData.footerTextLeft} rightText={formData.footerTextRight} />
                </div>
             </main>
          </div>
        </div>

        <aside className="w-72 bg-white border-l p-6 shrink-0 z-50 text-left overflow-y-auto custom-scrollbar shadow-sm">
           {selectedBlockId && activeBlock ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                 <div className="flex items-center gap-3 text-gray-900 mb-6">
                    <Settings2 size={18} strokeWidth={3} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Properties</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Positioning</label>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="text-[8px] font-bold text-gray-400 uppercase">X Position</div>
                          <div className="text-sm font-black text-gray-900">{Math.round(activeBlock.x || 0)}%</div>
                       </div>
                       <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="text-[8px] font-bold text-gray-400 uppercase">Y Position</div>
                          <div className="text-sm font-black text-gray-900">{Math.round(activeBlock.y || 0)}%</div>
                       </div>
                    </div>
                 </div>

                 {activeBlock.type === 'image' && (
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Image Source</label>
                       
                       {activeBlock.content ? (
                        <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-gray-100 mb-3">
                          <img src={activeBlock.content} className="w-full h-full object-cover" alt="Selected" />
                          <button 
                            onClick={() => updateBlock(selectedBlockId, { content: '' })}
                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                          >
                            <Trash2 size={14} /> Remove Image
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => blockFileInputRef.current?.click()}
                          className="aspect-video rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 cursor-pointer transition-all gap-2 bg-gray-50 mb-3"
                        >
                          <ImagePlus size={24} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Upload from Device</span>
                        </div>
                      )}
                      
                      <input 
                        ref={blockFileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBlockImageUpload} 
                      />
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          value={activeBlock.content.startsWith('data:') ? 'Local Image' : activeBlock.content} 
                          onChange={e => updateBlock(selectedBlockId!, { content: e.target.value })} 
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100 transition-all pr-10" 
                          placeholder="Paste image URL here..." 
                        />
                        <ImageIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                    </div>
                 )}

                 <div className="pt-8 border-t border-gray-50 space-y-6">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Visual Style</label>
                    <div className="space-y-4">
                       <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Border Radius</span><span className="text-gray-900">{activeBlock.style?.borderRadius || 0}px</span></div>
                       <input type="range" min="0" max="100" value={activeBlock.style?.borderRadius || 0} onChange={e => updateBlock(selectedBlockId!, { style: { ...activeBlock.style, borderRadius: parseInt(e.target.value) } })} className="w-full accent-[var(--primary)]" />
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Opacity</span><span className="text-gray-900">{Math.round((activeBlock.style?.opacity || 1) * 100)}%</span></div>
                       <input type="range" min="0" max="100" value={(activeBlock.style?.opacity || 1) * 100} onChange={e => updateBlock(selectedBlockId!, { style: { ...activeBlock.style, opacity: parseInt(e.target.value) / 100 } })} className="w-full accent-[var(--primary)]" />
                    </div>
                 </div>
              </div>
           ) : (
              <div className="space-y-10 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 text-gray-300 mb-6">
                    <MousePointer2 size={18} strokeWidth={3} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Canvas Settings</h3>
                </div>
                
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Slide Category</label>
                   <select 
                    value={formData.category} 
                    onChange={e => updateStateWithHistory({ ...formData, category: e.target.value as ModuleCategory })} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none cursor-pointer hover:bg-white transition-colors"
                   >
                     <option value="UNCATEGORIZED">Uncategorized</option>
                     <option value="GVM">General Volunteer (GVM)</option>
                     <option value="CCVM">Convention Committee (CCVM)</option>
                     <option value="HCVM">Hospitality Committee (HCVM)</option>
                   </select>
                </div>

                <div className="pt-8 border-t border-gray-50 space-y-6">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Module Cover Image</label>
                   <div className="space-y-3">
                      {formData.thumbnail ? (
                        <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-gray-100">
                          <img src={formData.thumbnail} className="w-full h-full object-cover" alt="Cover" />
                          <button 
                            onClick={() => updateStateWithHistory({ ...formData, thumbnail: '' })}
                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                          >
                            <Trash2 size={14} /> Remove Cover
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 cursor-pointer transition-all gap-2 bg-gray-50"
                        >
                          <ImagePlus size={24} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Upload from Device</span>
                        </div>
                      )}
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleThumbnailUpload} 
                      />
                   </div>
                </div>

                <div className="pt-8 border-t border-gray-50 space-y-4">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Canvas View</label>
                   <div className="flex flex-col gap-3">
                      <button onClick={() => setShowGrid(!showGrid)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${showGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/10' : 'bg-white text-gray-400 border-gray-50'}`}>
                         <Grid3X3 size={16} /> Grid Visibility {showGrid ? 'On' : 'Off'}
                      </button>
                      <button onClick={() => setSnapToGrid(!snapToGrid)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${snapToGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/10' : 'bg-white text-gray-400 border-gray-50'}`}>
                         <Hash size={16} /> Snap-to-Grid {snapToGrid ? 'On' : 'Off'}
                      </button>
                   </div>
                </div>
              </div>
           )}
        </aside>
      </div>

      <footer className="h-44 bg-white border-t flex items-center px-10 gap-8 overflow-x-auto shrink-0 z-[60] shadow-inner custom-scrollbar">
          {formData.slides?.map((slide, idx) => (
             <div key={slide.id} onClick={() => setActiveSectionId(slide.id)} className={`w-52 h-32 border-4 rounded-[2rem] cursor-pointer relative shrink-0 overflow-hidden group transition-all duration-300 ${activeSectionId === slide.id ? 'border-[var(--primary)] shadow-2xl scale-110 -translate-y-2' : 'border-gray-50 opacity-60 hover:opacity-100'}`}>
                <SlideThumbnail slide={slide} footerTextLeft={formData.footerTextLeft} footerTextRight={formData.footerTextRight} />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[9px] font-black px-3 py-1.5 rounded-lg backdrop-blur-md tracking-widest shadow-lg">{idx + 1}</div>
             </div>
          ))}
          <button onClick={() => setShowTemplateModal(true)} className="w-52 h-32 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all shrink-0 font-black uppercase text-[10px] tracking-widest gap-3 group bg-white">
             <Plus size={24} />
          </button>
      </footer>

      {showTemplateModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-lg flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl p-16 relative">
             <button onClick={() => setShowTemplateModal(false)} className="absolute top-10 right-10 p-4 bg-gray-50 hover:bg-red-50 rounded-full transition-all">
                <X size={32} />
             </button>
             <h3 className="text-4xl font-black text-gray-900 mb-12">Select Slide Layout</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SLIDE_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => addSlide(t)} className="p-8 border-2 border-gray-100 rounded-[2.5rem] text-left hover:border-[var(--primary)]/30 hover:bg-orange-50 transition-all group">
                       <LayoutTemplate size={32} className="text-gray-300 group-hover:text-[var(--primary)] mb-6" />
                       <div className="font-black text-xl mb-2">{t.label}</div>
                       <div className="text-xs text-gray-400 font-medium">{t.description}</div>
                    </button>
                ))}
                <button onClick={() => addSlide('blank')} className="p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-widest hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all gap-6">
                   <Plus size={48} /> Blank Slide
                </button>
             </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[110] bg-white">
          <ModuleViewer previewModule={formData as Module} onExitPreview={() => setShowPreview(false)} />
        </div>
      )}

      {isProcessingPdf && (
          <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Loader2 size={48} className="animate-spin mb-4" />
              <h3 className="text-xl font-black uppercase tracking-widest">Converting PDF...</h3>
          </div>
      )}
    </div>
  );
};

const ToolButton = ({ icon, onClick, active, title }: any) => (
  <button 
    onClick={onClick} 
    title={title}
    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-orange-50 text-[var(--primary)] shadow-sm' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
  >
    {icon}
  </button>
);
