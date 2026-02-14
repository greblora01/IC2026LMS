
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash, CheckCircle, 
  Eye, Image as ImageIcon, Loader2, Type as TypeIcon, 
  Youtube, X, Grid3X3, Hash, Star, Settings2, Trash2, 
  MousePointer2, Square, Layers, LayoutTemplate, ChevronRight
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor, TextToolbar } from '../components/RichTextEditor';
import { Module, Slide, SlideBlock, BlockType } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { NEW_MODULE_TEMPLATE_SLIDES, SLIDE_TEMPLATES } from '../constants';

const generateId = () => Math.random().toString(36).substr(2, 9);
const GRID_SIZE = 2; // 2% grid for snapping
const CANVAS_BASE_WIDTH = 960;
const CANVAS_BASE_HEIGHT = 540;

const safeClone = <T,>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return { ...obj };
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
  const { addModule, updateModule, getModule } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    description: '',
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

  // Initialize Data
  useEffect(() => {
    if (id) {
      const existing = getModule(id);
      if (existing) {
        setFormData(safeClone(existing));
        if (existing.slides.length > 0) setActiveSectionId(existing.slides[0].id);
      } else navigate('/');
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
         slides: templateSlides as Slide[], 
         thumbnailSlideId: templateSlides[0].id 
       }));
       setActiveSectionId(templateSlides[0].id);
    }
  }, [id, getModule]);

  // Responsive Canvas Scaling
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
      navigate('/');
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
      {/* Top Header */}
      <header className="h-16 bg-white border-b flex justify-between items-center px-6 z-[60] shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => navigate('/')} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-[var(--primary)] transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="h-8 w-px bg-gray-100" />
          <input 
            type="text" 
            value={formData.title} 
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
        {/* Left Toolbar */}
        <aside className="w-24 bg-white border-r flex flex-col items-center py-6 gap-6 shrink-0 z-50 overflow-y-auto custom-scrollbar shadow-sm">
             <ToolButton icon={<Plus size={24} />} label="Add Slide" onClick={() => setShowTemplateModal(true)} />
             <div className="w-12 h-px bg-gray-100" />
             <ToolButton icon={<TypeIcon size={24} />} label="Text" onClick={() => addBlock('text')} />
             <ToolButton icon={<ImageIcon size={24} />} label="Image" onClick={() => addBlock('image')} />
             <ToolButton icon={<Square size={24} />} label="Shape" onClick={() => addBlock('shape')} />
             <ToolButton icon={<Youtube size={24} />} label="Video" onClick={() => addBlock('youtube')} />
             <ToolButton icon={<CheckCircle size={24} />} label="Quiz" onClick={() => setActiveSectionId('quiz')} active={activeSectionId === 'quiz'} />
        </aside>

        {/* Center Workspace */}
        <main 
          ref={canvasContainerRef}
          className="flex-1 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center p-4 transition-all"
        >
          {activeSectionId === 'quiz' ? (
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl h-fit border border-gray-100 overflow-y-auto max-h-full custom-scrollbar animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Knowledge Check</h3>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.quiz?.enabled} 
                      onChange={e => setFormData(p => ({...p, quiz: {...p.quiz!, enabled: e.target.checked}}))} 
                      className="accent-[var(--primary)] w-6 h-6 rounded-lg transition-all group-hover:scale-110" 
                    />
                    <span className="font-black text-gray-500 group-hover:text-gray-900 uppercase tracking-widest text-xs transition-colors">Enabled</span>
                  </label>
                </div>
                
                {formData.quiz?.enabled ? (
                  <div className="space-y-8">
                    {formData.quiz.questions.map((q, qi) => (
                      <div key={q.id} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 relative group transition-all hover:bg-white hover:shadow-xl">
                        <button 
                          onClick={() => setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.filter(qu => qu.id !== q.id)}}))} 
                          className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                        <div className="mb-6">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-[0.2em]">Question {qi+1}</label>
                          <input 
                            value={q.text} 
                            onChange={e => setFormData(p => ({...p, quiz: {...p.quiz!, questions: p.quiz!.questions.map(qu => qu.id === q.id ? {...qu, text: e.target.value} : qu)}}))} 
                            className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-100 focus:ring-4 focus:ring-orange-100 bg-white font-bold text-lg outline-none transition-all shadow-sm" 
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
                    <button 
                      onClick={() => setFormData(p => ({...p, quiz: {...p.quiz!, questions: [...p.quiz!.questions, {id: generateId(), text: '', options: ['','','',''], correctOptionIndex: 0}]}}))} 
                      className="w-full py-10 border-4 border-dashed border-gray-100 rounded-[3rem] text-gray-300 font-black uppercase tracking-widest hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-orange-50 transition-all active:scale-[0.98]"
                    >
                      + Add Question
                    </button>
                  </div>
                ) : (
                  <div className="py-32 flex flex-col items-center justify-center text-gray-200 gap-6">
                    <Award size={80} className="opacity-20" />
                    <p className="font-black uppercase tracking-[0.4em] text-2xl">Quiz is Disabled</p>
                  </div>
                )}
             </div>
          ) : activeSlide ? (
            <div 
              className="relative shadow-2xl bg-white border border-gray-100 animate-in fade-in zoom-in-95 duration-500"
              style={{
                width: `${CANVAS_BASE_WIDTH}px`,
                height: `${CANVAS_BASE_HEIGHT}px`,
                transform: `scale(${canvasScale})`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
               <div 
                 ref={canvasRef} 
                 className="w-full h-full relative overflow-hidden" 
                 style={{ backgroundColor: activeSlide.backgroundColor || '#ffffff' }}
                 onMouseDown={() => { setSelectedBlockId(null); setEditingTextId(null); }}
               >
                  {showGrid && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                      style={{ 
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', 
                        backgroundSize: `${GRID_SIZE}% ${GRID_SIZE * (16/9)}%` 
                      }} 
                    />
                  )}
                  
                  {activeSlide.blocks?.map(block => (
                    <div 
                      key={block.id} 
                      onMouseDown={(e) => handleMouseDown(e, block.id)} 
                      onDoubleClick={(e) => { e.stopPropagation(); block.type === 'text' && setEditingTextId(block.id); }}
                      className={`absolute group cursor-move transition-shadow ${selectedBlockId === block.id ? 'ring-2 ring-[var(--primary)] z-50 shadow-2xl' : 'hover:ring-1 hover:ring-gray-300'}`} 
                      style={{ 
                        left: `${block.x}%`, 
                        top: `${block.y}%`, 
                        width: `${block.width}%`, 
                        height: `${block.height}%`, 
                        zIndex: block.zIndex || 1, 
                        backgroundColor: block.style?.backgroundColor, 
                        borderRadius: `${block.style?.borderRadius || 0}px`, 
                        opacity: block.style?.opacity 
                      }}
                    >
                        <div className="w-full h-full overflow-hidden">
                            {block.type === 'text' ? (
                              editingTextId === block.id ? (
                                <div 
                                  className="h-full bg-white ring-4 ring-[var(--primary)] shadow-2xl overflow-hidden animate-in fade-in duration-200"
                                  onMouseDown={e => e.stopPropagation()} // CRITICAL: Stop propagation here to prevent canvas close on highlight
                                >
                                  <RichTextEditor 
                                    initialContent={block.content} 
                                    onChange={html => updateBlock(block.id, { content: html })} 
                                    onClose={() => setEditingTextId(null)}
                                  />
                                </div>
                              ) : (
                                <div className="p-4 prose max-w-none text-inherit pointer-events-none select-none slide-typography" dangerouslySetInnerHTML={{ __html: block.content }} />
                              )
                            ) : block.type === 'image' && block.content ? (
                                <img src={block.content} className="w-full h-full object-cover pointer-events-none" />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                                    {block.type === 'image' ? <ImageIcon size={48} /> : block.type === 'youtube' ? <Youtube size={48} /> : null}
                                </div>
                            )}
                        </div>

                        {selectedBlockId === block.id && !editingTextId && (
                            <>
                                {['nw', 'ne', 'sw', 'se'].map(h => (
                                    <div 
                                      key={h} 
                                      className="absolute w-5 h-5 bg-white border-2 border-[var(--primary)] rounded-md shadow-xl z-[60]" 
                                      style={{ 
                                        top: h.includes('n') ? -8 : 'auto', 
                                        bottom: h.includes('s') ? -8 : 'auto', 
                                        left: h.includes('w') ? -8 : 'auto', 
                                        right: h.includes('e') ? -8 : 'auto', 
                                        cursor: `${h}-resize` 
                                      }} 
                                      onMouseDown={e => handleMouseDown(e, block.id, h)} 
                                    />
                                ))}
                                {/* Fast Actions Bar */}
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl flex items-center gap-2 p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
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
              <p className="font-black uppercase tracking-widest text-sm">Initializing Workspace...</p>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-white border-l p-8 shrink-0 z-50 text-left overflow-y-auto custom-scrollbar shadow-sm">
          {editingTextId ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-400">
               <div className="flex items-center gap-3 text-[var(--primary)] mb-8">
                  <TypeIcon size={22} strokeWidth={3} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Text Formatting</h3>
              </div>
              <TextToolbar onClose={() => setEditingTextId(null)} />
            </div>
          ) : selectedBlockId && activeSlide?.blocks?.find(b => b.id === selectedBlockId) ? (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-400">
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
                          onChange={e => updateBlock(selectedBlockId, { content: e.target.value })} 
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-orange-100 transition-all font-medium" 
                          placeholder="Paste image URL here..." 
                        />
                    </div>
                )}

                <div className="pt-8 border-t border-gray-50">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 block">Appearance</label>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">Fill Color</span>
                            <input 
                              type="color" 
                              value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.backgroundColor || '#ffffff'} 
                              onChange={e => updateBlock(selectedBlockId, { style: { ...activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style, backgroundColor: e.target.value } })} 
                              className="w-12 h-9 rounded-lg cursor-pointer border-2 border-gray-50 p-0" 
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>Rounded Corners</span>
                                <span>{activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.borderRadius || 0}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" 
                              value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.borderRadius || 0} 
                              onChange={e => updateBlock(selectedBlockId, { style: { ...activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style, borderRadius: parseInt(e.target.value) } })} 
                              className="w-full accent-[var(--primary)]" 
                            />
                        </div>
                        <div className="space-y-3">
                             <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>Transparency</span>
                                <span>{Math.round((activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.opacity ?? 1) * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.01" 
                              value={activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style?.opacity ?? 1} 
                              onChange={e => updateBlock(selectedBlockId, { style: { ...activeSlide?.blocks?.find(b => b.id === selectedBlockId)?.style, opacity: parseFloat(e.target.value) } })} 
                              className="w-full accent-[var(--primary)]" 
                            />
                        </div>
                    </div>
                </div>

                <button 
                  onClick={() => deleteBlock(selectedBlockId)} 
                  className="w-full py-5 text-red-500 font-black text-xs uppercase tracking-widest bg-red-50 rounded-[2rem] mt-12 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                >
                  Remove Element
                </button>
             </div>
          ) : (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-400">
                <div className="flex items-center gap-3 text-gray-300 mb-8">
                    <MousePointer2 size={22} strokeWidth={3} />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Editor</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setShowGrid(!showGrid)} 
                      className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-2 transition-all ${showGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/30 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <Grid3X3 size={18} /> {showGrid ? 'Hide Grid' : 'Show Grid'}
                    </button>
                    <button 
                      onClick={() => setSnapToGrid(!snapToGrid)} 
                      className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-2 transition-all ${snapToGrid ? 'bg-orange-50 text-[var(--primary)] border-[var(--primary)]/30 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <Hash size={18} /> {snapToGrid ? 'Snapping On' : 'Snapping Off'}
                    </button>
                </div>
                <div className="pt-10 border-t border-gray-50">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase mb-8 tracking-[0.2em]">Footer Branding</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase mb-3 block tracking-widest">Left Branding</label>
                      <input 
                        value={formData.footerTextLeft} 
                        onChange={e => setFormData({...formData, footerTextLeft: e.target.value})} 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-black uppercase mb-3 block tracking-widest">Right Branding</label>
                      <input 
                        value={formData.footerTextRight} 
                        onChange={e => setFormData({...formData, footerTextRight: e.target.value})} 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100 transition-all" 
                      />
                    </div>
                  </div>
                </div>
             </div>
          )}
        </aside>
      </div>

      {/* Bottom Slide Tray */}
      <footer className="h-48 bg-white border-t flex items-center px-10 gap-10 overflow-x-auto shrink-0 z-[60] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.08)] custom-scrollbar">
          {formData.slides?.map((slide, idx) => (
             <div 
               key={slide.id} 
               onClick={() => setActiveSectionId(slide.id)} 
               className={`w-64 h-36 border-[4px] rounded-[2.5rem] cursor-pointer relative shrink-0 overflow-hidden group transition-all duration-500 ${activeSectionId === slide.id ? 'border-[var(--primary)] shadow-2xl scale-110 -translate-y-2' : 'border-gray-50 opacity-60 hover:opacity-100'}`}
             >
                <SlideThumbnail slide={slide} footerTextLeft={formData.footerTextLeft} footerTextRight={formData.footerTextRight} />
                <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-black px-4 py-1.5 rounded-xl backdrop-blur-md z-10 tracking-[0.2em]">{idx + 1}</div>
                
                {formData.thumbnailSlideId === slide.id && (
                  <div className="absolute top-4 right-4 bg-[var(--primary)] text-white p-2.5 rounded-full shadow-2xl z-20 ring-4 ring-white" title="Primary Cover Slide">
                    <Star size={14} fill="currentColor" />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-30">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, thumbnailSlideId: slide.id })); }} 
                        className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border-2 transition-all ${formData.thumbnailSlideId === slide.id ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-white text-gray-900 border-gray-100 hover:bg-orange-50'}`}
                    >
                        {formData.thumbnailSlideId === slide.id ? 'COVER' : 'SET COVER'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="bg-white rounded-2xl p-2.5 shadow-2xl border-2 border-gray-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                      <Trash size={18} />
                    </button>
                </div>
             </div>
          ))}
          <button 
            onClick={() => setShowTemplateModal(true)} 
            className="w-64 h-36 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-orange-50 transition-all shrink-0 font-black uppercase text-xs tracking-[0.3em] gap-4 group"
          >
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-xl transition-all">
              <Plus size={36} strokeWidth={3} />
            </div>
            New Slide
          </button>
      </footer>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl p-20 animate-in zoom-in-95 duration-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-50 rounded-full -mr-[20rem] -mt-[20rem] blur-[10rem] opacity-40"></div>
             
             <div className="flex justify-between items-center mb-16 relative z-10">
                <div>
                  <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Select Layout</h3>
                  <p className="text-gray-400 font-medium text-lg">Choose a starting point for your new slide.</p>
                </div>
                <button onClick={() => setShowTemplateModal(false)} className="p-5 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                  <X size={40} />
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {SLIDE_TEMPLATES.map((t, i) => (
                    <button 
                        key={i} 
                        onClick={() => addSlide(t)} 
                        className="p-10 border-4 border-gray-50 rounded-[3rem] text-left hover:border-[var(--primary)]/30 hover:bg-orange-50/20 transition-all group relative h-full flex flex-col"
                    >
                        <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center text-gray-200 group-hover:text-[var(--primary)] mb-10 transition-colors">
                          <LayoutTemplate size={40} />
                        </div>
                        <div className="font-black text-2xl text-gray-900 mb-4 group-hover:text-[var(--primary)] transition-colors">{t.label}</div>
                        <div className="text-sm text-gray-400 font-medium leading-relaxed flex-1">{t.description}</div>
                        <ChevronRight className="mt-6 text-gray-200 group-hover:text-[var(--primary)] transition-colors" />
                    </button>
                ))}
                <button 
                    onClick={() => addSlide('blank')} 
                    className="p-10 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-[0.2em] hover:border-[var(--primary)]/40 hover:bg-orange-50/20 hover:text-[var(--primary)] transition-all gap-6 group"
                >
                    <div className="p-8 bg-gray-50 rounded-3xl group-hover:bg-white group-hover:shadow-2xl transition-all">
                      <Plus size={64} strokeWidth={3} />
                    </div>
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
     <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-[var(--primary)]' : 'text-gray-400 group-hover:text-gray-600'}`}>{label}</span>
  </button>
);

const Award = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
