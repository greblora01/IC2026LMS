import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash, CheckCircle, 
  Settings, Eye, MonitorPlay, Image as ImageIcon, 
  Loader2, Type, Youtube, GripVertical, MousePointer2,
  Bold, AlignLeft, AlignCenter, AlignRight, BringToFront, SendToBack,
  Palette, Square, Undo2, Redo2, Printer, Search, 
  ZoomIn, ChevronDown, LayoutTemplate, PaintBucket, Circle, Type as TypeIcon
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, Question, SlideBlock, BlockType, BlockStyle } from '../types';
import { ModuleViewer } from './ModuleViewer';

// Canvas Constants
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Helpers
const generateId = () => Math.random().toString(36).substr(2, 9);
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Components ---

interface CanvasBlockProps {
  block: SlideBlock;
  isSelected: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, blockId: string, handle?: string | null) => void;
  onUpdate: (blockId: string, changes: Partial<SlideBlock>) => void;
}

const CanvasBlock: React.FC<CanvasBlockProps> = ({ block, isSelected, zoom, onMouseDown, onUpdate }) => {
  const handleContentChange = (e: React.FocusEvent<HTMLDivElement>) => {
     if (block.type === 'text') {
       onUpdate(block.id, { content: e.currentTarget.innerHTML });
     }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files?.[0]) {
       const file = e.target.files[0];
       if (file.size > 800 * 1024) {
          alert(`File too large. Max size is 800KB. Use URL for larger files.`);
          return;
       }
       const base64 = await readFileAsBase64(file);
       onUpdate(block.id, { content: base64 });
     }
  };

  return (
    <div
      className={`absolute group ${isSelected ? 'z-50' : 'z-10'} ${block.type === 'text' ? 'cursor-text' : 'cursor-move'}`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        zIndex: block.style?.zIndex || 1,
        backgroundColor: block.style?.backgroundColor,
        borderRadius: block.style?.borderRadius,
        // Outline for selection
        outline: isSelected ? '2px solid #4285F4' : 'none', // Google Blue
        overflow: 'hidden'
      }}
      onMouseDown={(e) => {
         // Only trigger drag if not editing text or if clicking border
         if (block.type !== 'text' || e.target === e.currentTarget) {
            onMouseDown(e, block.id);
         }
      }}
    >
      <div className="w-full h-full relative">
         {block.type === 'text' && (
           <div
             contentEditable
             suppressContentEditableWarning
             className="w-full h-full outline-none p-2 cursor-text"
             style={{
               fontSize: block.style?.fontSize || 16,
               color: block.style?.color,
               textAlign: block.style?.textAlign,
               fontWeight: block.style?.fontWeight,
               fontFamily: 'Arial, sans-serif'
             }}
             onBlur={handleContentChange}
             onMouseDown={(e) => {
                // If clicking text, ensure we select the block too
                onMouseDown(e, block.id);
                e.stopPropagation(); 
             }} 
             dangerouslySetInnerHTML={{ __html: block.content }}
           />
         )}
         
         {block.type === 'image' && (
            block.content ? (
              <img src={block.content} className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-dashed border-gray-300">
                 <ImageIcon size={32} />
                 <span className="text-[10px] mt-1">Image</span>
                 <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            )
         )}

         {block.type === 'video' && (
            block.content ? (
               <div className="w-full h-full bg-black flex items-center justify-center text-white relative group">
                  <MonitorPlay size={32} />
                  <span className="absolute bottom-2 text-xs">Video Placeholder</span>
               </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-dashed border-gray-300">
                 <MonitorPlay size={32} />
                 <span className="text-[10px] mt-1">Video</span>
                 <button 
                    className="mt-1 px-2 py-0.5 bg-white border rounded text-xs z-20 hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = prompt("Video URL:");
                      if (url) onUpdate(block.id, { content: url });
                    }}
                 >URL</button>
              </div>
            )
         )}

         {block.type === 'youtube' && (
            block.content ? (
               <iframe src={block.content} className="w-full h-full pointer-events-none" />
            ) : (
               <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center text-red-500 border border-dashed border-red-200">
                  <Youtube size={32} />
                  <button 
                    className="text-xs mt-2 underline"
                    onClick={(e) => {
                       e.stopPropagation();
                       const url = prompt("YouTube URL:");
                       if (url) {
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                          const match = url.match(regExp);
                          const embed = (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
                          onUpdate(block.id, { content: embed });
                       }
                    }}
                  >
                    Set URL
                  </button>
               </div>
            )
         )}

         {block.type === 'shape' && <div className="w-full h-full" />}
      </div>

      {isSelected && (
        <>
          {/* Resize Handles - Styled like Google Slides (Blue squares) */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mt-1.5 -ml-1.5 cursor-nw-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'nw')} />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mt-1.5 -mr-1.5 cursor-ne-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'ne')} />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mb-1.5 -ml-1.5 cursor-sw-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'sw')} />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mb-1.5 -mr-1.5 cursor-se-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'se')} />
          {/* Midpoint Handles */}
          <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-[#4285F4] border border-white -mt-1.5 -ml-1.5 cursor-n-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'n')} />
          <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 bg-[#4285F4] border border-white -mb-1.5 -ml-1.5 cursor-s-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 's')} />
          <div className="absolute top-1/2 left-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mt-1.5 -ml-1.5 cursor-w-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'w')} />
          <div className="absolute top-1/2 right-0 w-2.5 h-2.5 bg-[#4285F4] border border-white -mt-1.5 -mr-1.5 cursor-e-resize z-50" onMouseDown={(e) => onMouseDown(e, block.id, 'e')} />
        </>
      )}
    </div>
  );
};

type EditorSection = 'general' | 'quiz' | string;

export const ModuleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addModule, updateModule, getModule } = useAppContext();
  
  const isEditMode = !!id;
  const [activeSection, setActiveSection] = useState<EditorSection>('general');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(0.75); // Default zoom 75%

  // History State
  const [history, setHistory] = useState<Module[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);
  
  // Selection & Manipulation
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBlockState, setInitialBlockState] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag Reorder
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Module>({
    id: generateId(),
    title: 'Untitled Presentation',
    description: '',
    thumbnail: '',
    slides: [],
    files: [],
    quiz: { enabled: false, questions: [] },
    stats: { views: 0, completions: 0 },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  });

  // Initialization
  useEffect(() => {
    if (isEditMode && id) {
      const existing = getModule(id);
      if (existing) {
        const data = JSON.parse(JSON.stringify(existing));
        setFormData(data);
        setHistory([data]);
        setHistoryIndex(0);
      } else {
        navigate('/');
      }
    } else if (!isEditMode && history.length === 0) {
       const initial: Module = {
         ...formData,
         slides: [{ 
           id: generateId(), 
           title: 'Title Slide', 
           content: '',
           layout: 'freeform',
           blocks: [
             { id: generateId(), type: 'text', content: '<h1 style="text-align: center">Click to add title</h1>', x: 80, y: 150, width: 800, height: 100, style: { fontSize: 36, textAlign: 'center' } },
             { id: generateId(), type: 'text', content: '<p style="text-align: center">Click to add subtitle</p>', x: 180, y: 260, width: 600, height: 60, style: { fontSize: 18, textAlign: 'center', color: '#666' } }
           ]
         }]
       };
       setFormData(initial);
       setHistory([initial]);
       setHistoryIndex(0);
    }
  }, [id, isEditMode]);

  // Push to History on Change
  const pushToHistory = (newData: Module) => {
    if (isUndoing) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    if (newHistory.length > 20) newHistory.shift(); // Limit history depth
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setFormData(newData);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoing(true);
      const prev = history[historyIndex - 1];
      setFormData(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => setIsUndoing(false), 0);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoing(true);
      const next = history[historyIndex + 1];
      setFormData(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => setIsUndoing(false), 0);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return alert('Title is required');
    setIsSaving(true);
    const moduleData = { ...formData, lastUpdated: Date.now() };
    try {
      if (isEditMode && id) await updateModule(id, moduleData);
      else await addModule(moduleData);
      // alert("Saved successfully!");
      navigate('/'); // Go back to dashboard on save
    } catch (error) {
      alert("Error saving module.");
    } finally {
      setIsSaving(false);
    }
  };

  const getActiveSlide = () => formData.slides?.find(s => s.id === activeSection);

  // --- Block Manipulation ---

  const addBlock = (type: BlockType, defaults: Partial<SlideBlock> = {}) => {
    if (activeSection === 'general' || activeSection === 'quiz') return;
    
    const defaultStyles: Record<string, Partial<BlockStyle>> = {
      text: { fontSize: 14, color: '#333333', textAlign: 'left' },
      shape: { backgroundColor: '#a0c4ff', borderRadius: 0 },
    };
    
    // Default center placement logic
    const viewportCenter = { x: CANVAS_WIDTH / 2 - 150, y: CANVAS_HEIGHT / 2 - 100 };

    const newBlock: SlideBlock = {
      id: generateId(),
      type,
      content: type === 'text' ? 'New Text Box' : '',
      x: viewportCenter.x,
      y: viewportCenter.y,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 50 : 200,
      style: defaultStyles[type] || {},
      ...defaults
    };

    const newSlides = formData.slides.map(s => 
      s.id === activeSection ? { ...s, blocks: [...(s.blocks || []), newBlock] } : s
    );
    
    pushToHistory({ ...formData, slides: newSlides });
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (slideId: string, blockId: string, changes: Partial<SlideBlock>) => {
    const newSlides = formData.slides.map(s => {
      if (s.id !== slideId) return s;
      return {
        ...s,
        blocks: s.blocks?.map(b => b.id === blockId ? { ...b, ...changes } : b)
      };
    });
    // For drag/resize we update state directly to avoid history spam, 
    // but for content updates we might want history. 
    // For now, simple direct update for responsiveness.
    setFormData({ ...formData, slides: newSlides });
  };
  
  // Commit to history after drag/resize ends
  const commitChange = () => {
    pushToHistory(formData);
  };

  const deleteBlock = (slideId: string, blockId: string) => {
    const newSlides = formData.slides.map(s => {
      if (s.id !== slideId) return s;
      return { ...s, blocks: s.blocks?.filter(b => b.id !== blockId) };
    });
    pushToHistory({ ...formData, slides: newSlides });
    setSelectedBlockId(null);
  };

  const updateBlockStyle = (slideId: string, blockId: string, styleChanges: Partial<BlockStyle>) => {
     const slide = formData.slides.find(s => s.id === slideId);
     const block = slide?.blocks?.find(b => b.id === blockId);
     if(block) updateBlock(slideId, blockId, { style: { ...block.style, ...styleChanges } });
  };

  // --- Mouse Handlers ---

  const handleMouseDown = (e: React.MouseEvent, blockId: string, handle: string | null = null) => {
    e.stopPropagation(); // Stop from clearing selection
    const slide = getActiveSlide();
    const block = slide?.blocks?.find(b => b.id === blockId);
    if (!block) return;

    setSelectedBlockId(blockId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBlockState({ x: block.x, y: block.y, w: block.width, h: block.height });

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!selectedBlockId || !initialBlockState) return;

    // Apply Zoom Correction to Delta
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    if (isDragging) {
      updateBlock(activeSection, selectedBlockId, {
        x: initialBlockState.x + dx,
        y: initialBlockState.y + dy
      });
    } else if (isResizing) {
       let { x, y, w, h } = initialBlockState;
       
       if (resizeHandle?.includes('e')) w += dx;
       if (resizeHandle?.includes('w')) { x += dx; w -= dx; }
       if (resizeHandle?.includes('s')) h += dy;
       if (resizeHandle?.includes('n')) { y += dy; h -= dy; }

       if (w < 20) w = 20;
       if (h < 20) h = 20;

       updateBlock(activeSection, selectedBlockId, { x, y, width: w, height: h });
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      commitChange();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // --- UI Components for Ribbon ---

  const RibbonButton = ({ icon, label, onClick, active = false }: { icon: React.ReactNode, label?: string, onClick?: () => void, active?: boolean }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1.5 rounded min-w-[32px] h-[32px] md:h-auto md:min-w-0 md:p-1.5 transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'}`}
      title={label}
    >
      {icon}
      {label && <span className="text-[10px] mt-0.5 hidden md:block">{label}</span>}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1 self-center" />;

  const slide = getActiveSlide();
  const selectedBlock = slide?.blocks?.find(b => b.id === selectedBlockId);

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="fixed top-4 right-4 z-50">
          <button onClick={() => setShowPreview(false)} className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">Exit Preview</button>
        </div>
        <ModuleViewer previewModule={formData} onExitPreview={() => setShowPreview(false)} />
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col bg-[#F9FBFD] text-sm overflow-hidden" 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp}
    >
      {/* --- GOOGLE SLIDES STYLE HEADER --- */}
      
      {/* Row 1: Top Bar (Logo, Title, Share/Account) */}
      <div className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-100 shrink-0">
         <div className="flex items-center gap-3 flex-1">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-[#F4B400]">
               <Settings size={24} fill="#F4B400" className="text-white" /> {/* Placeholder Logo */}
            </button>
            <div className="flex flex-col">
               <input 
                 value={formData.title} 
                 onChange={e => setFormData({ ...formData, title: e.target.value })}
                 className="font-medium text-lg text-gray-800 bg-transparent border border-transparent hover:border-gray-300 rounded px-1.5 py-0.5 outline-none focus:border-blue-500 transition-colors w-64 truncate"
                 placeholder="Untitled Module"
               />
               {/* Menu Bar */}
               <div className="flex text-xs text-gray-600 gap-3 px-2 mt-0.5 select-none">
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">File</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Edit</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">View</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Insert</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Format</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Slide</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Arrange</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Tools</span>
                  <span className="cursor-pointer hover:bg-gray-100 px-1 rounded">Help</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full border border-gray-300 font-medium">
               <Eye size={16} /> <span className="hidden md:inline">Preview</span>
            </button>
            <button onClick={handleSave} disabled={isSaving} className="bg-[#1A73E8] text-white px-6 py-2 rounded-full font-medium hover:shadow-md hover:bg-[#1557B0] transition-all flex items-center gap-2">
               {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
               <span>Save</span>
            </button>
         </div>
      </div>

      {/* Row 2: The Ribbon Toolbar */}
      <div className="h-10 bg-[#EDF2FA] border-b border-gray-300 flex items-center px-4 gap-1 shrink-0 overflow-x-auto select-none">
         {/* History */}
         <div className="flex gap-0.5">
           <RibbonButton icon={<Undo2 size={16} />} onClick={undo} label="" />
           <RibbonButton icon={<Redo2 size={16} />} onClick={redo} label="" />
           <RibbonButton icon={<Printer size={16} />} onClick={() => window.print()} label="" />
           {/* Paint format placeholder */}
           <RibbonButton icon={<PaintBucket size={16} />} label="" /> 
         </div>
         <Divider />
         
         {/* Zoom */}
         <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
            <ZoomIn size={14} className="text-gray-500" />
            <select 
              value={Math.round(zoom * 100)} 
              onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer w-16"
            >
               <option value="50">50%</option>
               <option value="75">75%</option>
               <option value="100">100%</option>
               <option value="150">150%</option>
               <option value="200">200%</option>
            </select>
         </div>
         <Divider />

         {/* Selection Mode */}
         <RibbonButton icon={<MousePointer2 size={16} />} active={!draggedSlideIndex} label="" />
         <Divider />

         {/* Insert Tools */}
         <div className="flex gap-0.5">
           <RibbonButton icon={<div className="font-serif font-bold border border-gray-600 rounded px-1 text-[10px] bg-white">T</div>} onClick={() => addBlock('text')} label="" />
           <RibbonButton icon={<ImageIcon size={16} />} onClick={() => addBlock('image')} label="" />
           <RibbonButton icon={<Square size={16} />} onClick={() => addBlock('shape')} label="" />
           <RibbonButton icon={<Circle size={16} />} onClick={() => addBlock('shape', { style: { borderRadius: 100, backgroundColor: '#FF8A80' } })} label="" />
           <RibbonButton icon={<MonitorPlay size={16} />} onClick={() => addBlock('video')} label="" />
           <RibbonButton icon={<Youtube size={16} />} onClick={() => addBlock('youtube')} label="" />
         </div>
         <Divider />

         {/* Contextual Tools (Text/Shape Styling) */}
         {selectedBlock && (
           <div className="flex gap-0.5 items-center animate-in fade-in slide-in-from-top-1 duration-200">
             {selectedBlock.type === 'text' && (
               <>
                 <select 
                   className="h-7 border border-gray-300 rounded text-xs bg-white px-1"
                   value={selectedBlock.style?.fontFamily || 'Arial'}
                   onChange={(e) => updateBlockStyle(activeSection, selectedBlock.id, { fontFamily: e.target.value })}
                 >
                   <option value="Arial">Arial</option>
                   <option value="Georgia">Georgia</option>
                   <option value="Times New Roman">Times New Roman</option>
                   <option value="Courier New">Courier New</option>
                 </select>
                 <Divider />
                 <select 
                   className="h-7 border border-gray-300 rounded text-xs bg-white px-1 w-12"
                   value={selectedBlock.style?.fontSize || 16}
                   onChange={(e) => updateBlockStyle(activeSection, selectedBlock.id, { fontSize: parseInt(e.target.value) })}
                 >
                   {[10,12,14,16,18,24,30,36,48,60,72].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <Divider />
                 <RibbonButton icon={<Bold size={14} />} onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { fontWeight: selectedBlock.style?.fontWeight === 'bold' ? 'normal' : 'bold' })} active={selectedBlock.style?.fontWeight === 'bold'} />
                 <RibbonButton icon={<div className="w-3 h-3 rounded-full border border-gray-400" style={{background: selectedBlock.style?.color || '#000'}}></div>} onClick={() => { /* Quick color toggle for demo */ updateBlockStyle(activeSection, selectedBlock.id, { color: selectedBlock.style?.color === '#FF0000' ? '#000000' : '#FF0000' }) }} label="" />
                 <Divider />
                 <RibbonButton icon={<AlignLeft size={14} />} onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { textAlign: 'left' })} active={selectedBlock.style?.textAlign === 'left'} />
                 <RibbonButton icon={<AlignCenter size={14} />} onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { textAlign: 'center' })} active={selectedBlock.style?.textAlign === 'center'} />
                 <RibbonButton icon={<AlignRight size={14} />} onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { textAlign: 'right' })} active={selectedBlock.style?.textAlign === 'right'} />
               </>
             )}
             {(selectedBlock.type === 'shape' || selectedBlock.type === 'text') && (
                <>
                  <Divider />
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-gray-500 mb-0.5">Fill</span>
                    <input type="color" className="w-5 h-5 p-0 border-0 rounded cursor-pointer" value={selectedBlock.style?.backgroundColor || '#ffffff'} onChange={(e) => updateBlockStyle(activeSection, selectedBlock.id, { backgroundColor: e.target.value })} />
                  </div>
                </>
             )}
             <Divider />
             <RibbonButton icon={<Trash size={14} className="text-red-500" />} onClick={() => deleteBlock(activeSection, selectedBlock.id)} label="" />
             <div className="flex flex-col ml-1">
               <button onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { zIndex: (selectedBlock.style?.zIndex || 0) + 1 })} className="text-[10px] hover:bg-gray-200 px-1 rounded">Forward</button>
               <button onClick={() => updateBlockStyle(activeSection, selectedBlock.id, { zIndex: Math.max(0, (selectedBlock.style?.zIndex || 0) - 1) })} className="text-[10px] hover:bg-gray-200 px-1 rounded">Back</button>
             </div>
           </div>
         )}

         {/* Right Side Buttons */}
         <div className="ml-auto flex items-center gap-2">
            <button className="text-xs font-medium px-2 py-1 hover:bg-gray-200 rounded transition-colors text-gray-600">Background</button>
            <button className="text-xs font-medium px-2 py-1 hover:bg-gray-200 rounded transition-colors text-gray-600">Layout</button>
            <button className="text-xs font-medium px-2 py-1 hover:bg-gray-200 rounded transition-colors text-gray-600">Theme</button>
            <button className="text-xs font-medium px-2 py-1 hover:bg-gray-200 rounded transition-colors text-gray-600">Transition</button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Slide List */}
        <div className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
          <div className="p-2 overflow-y-auto flex-1 space-y-2">
             <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Slides</span>
                <button onClick={() => {
                   const id = generateId();
                   const newSlide = { id, title: `Slide ${(formData.slides?.length||0)+1}`, content: '', layout: 'freeform', blocks: [] };
                   const newSlides = [...formData.slides, newSlide];
                   setFormData({ ...formData, slides: newSlides });
                   pushToHistory({ ...formData, slides: newSlides });
                   setActiveSection(id);
                 }} className="p-1 hover:bg-gray-100 rounded text-blue-600"><Plus size={16}/></button>
             </div>
             
             {formData.slides.map((s, idx) => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSection(s.id)}
                  className={`relative p-2 rounded cursor-pointer border-2 transition-all group ${activeSection === s.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                >
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                      <div className="aspect-video bg-white border border-gray-200 flex-1 relative overflow-hidden shadow-sm">
                          {/* Mini Preview */}
                          {s.blocks?.map(b => (
                             <div key={b.id} className="absolute bg-gray-200 opacity-50" 
                                  style={{ 
                                    left: `${(b.x / CANVAS_WIDTH) * 100}%`, top: `${(b.y / CANVAS_HEIGHT) * 100}%`, 
                                    width: `${(b.width / CANVAS_WIDTH) * 100}%`, height: `${(b.height / CANVAS_HEIGHT) * 100}%` 
                                  }} 
                             />
                          ))}
                      </div>
                   </div>
                   <button 
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       const newSlides = formData.slides.filter(slide => slide.id !== s.id);
                       setFormData({ ...formData, slides: newSlides });
                       pushToHistory({ ...formData, slides: newSlides });
                       if (activeSection === s.id) setActiveSection('general');
                     }}
                     className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash size={12} />
                   </button>
                </div>
             ))}

             <div className="border-t border-gray-200 mt-4 pt-2">
               <button onClick={() => setActiveSection('general')} className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium flex gap-2 items-center ${activeSection === 'general' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                 <Settings size={14}/> General Info
               </button>
               <button onClick={() => setActiveSection('quiz')} className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium flex gap-2 items-center ${activeSection === 'quiz' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                 <CheckCircle size={14}/> Quiz Editor
               </button>
             </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-[#F1F3F4] flex flex-col relative overflow-hidden">
           {activeSection !== 'general' && activeSection !== 'quiz' && slide ? (
             <div 
               className="flex-1 overflow-auto flex items-center justify-center p-8 outline-none" 
               onClick={() => setSelectedBlockId(null)}
             >
                <div 
                   className="bg-white shadow-lg relative transition-transform duration-75 origin-center"
                   style={{ 
                     width: CANVAS_WIDTH, 
                     height: CANVAS_HEIGHT, 
                     transform: `scale(${zoom})`,
                     // We use transform scale, but ensure margin accounts for the scaled size so it doesn't clip
                     margin: `${(CANVAS_HEIGHT * (zoom - 1)) / 2}px ${(CANVAS_WIDTH * (zoom - 1)) / 2}px` 
                   }}
                   ref={canvasRef}
                   onDragOver={(e) => e.preventDefault()}
                >
                   {/* Background Grid (Optional) */}
                   {/* <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} /> */}
                   
                   {slide.blocks?.map(block => (
                      <CanvasBlock 
                        key={block.id} 
                        block={block} 
                        isSelected={selectedBlockId === block.id}
                        zoom={zoom}
                        onMouseDown={handleMouseDown}
                        onUpdate={(blockId, changes) => updateBlock(activeSection, blockId, changes)}
                      />
                   ))}
                </div>
             </div>
           ) : (
              // Form View for General/Quiz
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                 <div className="max-w-2xl mx-auto">
                    {activeSection === 'general' && (
                       <div className="space-y-6">
                          <h2 className="text-xl font-bold border-b pb-2">Module Settings</h2>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                             <input className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                             <textarea rows={4} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Title</label>
                             <input className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.certificateTitle || ''} onChange={e => setFormData({...formData, certificateTitle: e.target.value})} placeholder="e.g. Certified Volunteer" />
                          </div>
                       </div>
                    )}
                    {activeSection === 'quiz' && (
                       <div className="space-y-6">
                          <div className="flex justify-between items-center border-b pb-2">
                             <h2 className="text-xl font-bold">Quiz Questions</h2>
                             <button 
                               onClick={() => {
                                  const newQ: Question = { id: generateId(), text: 'New Question', options: ['Option 1', 'Option 2'], correctOptionIndex: 0 };
                                  const newQuiz = { ...formData.quiz, enabled: true, questions: [...formData.quiz.questions, newQ] };
                                  setFormData({ ...formData, quiz: newQuiz });
                                  pushToHistory({ ...formData, quiz: newQuiz });
                               }}
                               className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                             >
                                <Plus size={16}/> Add Question
                             </button>
                          </div>
                          
                          {formData.quiz.questions.length === 0 && <div className="text-center text-gray-400 py-10">No questions yet. Click "Add Question" to start.</div>}

                          {formData.quiz.questions.map((q, i) => (
                             <div key={q.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                <div className="flex justify-between mb-2">
                                   <span className="font-bold text-gray-500">Question {i+1}</span>
                                   <button className="text-red-500 hover:text-red-700" onClick={() => {
                                      const newQs = formData.quiz.questions.filter(qu => qu.id !== q.id);
                                      setFormData({ ...formData, quiz: { ...formData.quiz, questions: newQs } });
                                   }}><Trash size={16}/></button>
                                </div>
                                <input 
                                  className="w-full p-2 mb-3 border border-gray-300 rounded text-sm font-medium" 
                                  value={q.text} 
                                  onChange={(e) => {
                                     const newQs = [...formData.quiz.questions];
                                     newQs[i].text = e.target.value;
                                     setFormData({ ...formData, quiz: { ...formData.quiz, questions: newQs } });
                                  }}
                                  placeholder="Enter question text..."
                                />
                                <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                   {q.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-2">
                                         <input 
                                           type="radio" 
                                           name={`correct-${q.id}`} 
                                           checked={q.correctOptionIndex === optIdx} 
                                           onChange={() => {
                                              const newQs = [...formData.quiz.questions];
                                              newQs[i].correctOptionIndex = optIdx;
                                              setFormData({ ...formData, quiz: { ...formData.quiz, questions: newQs } });
                                           }}
                                         />
                                         <input 
                                           className="flex-1 p-1 border border-gray-300 rounded text-sm" 
                                           value={opt} 
                                           onChange={(e) => {
                                              const newQs = [...formData.quiz.questions];
                                              newQs[i].options[optIdx] = e.target.value;
                                              setFormData({ ...formData, quiz: { ...formData.quiz, questions: newQs } });
                                           }}
                                         />
                                      </div>
                                   ))}
                                   <button className="text-xs text-blue-500 hover:underline pl-6" onClick={() => {
                                      const newQs = [...formData.quiz.questions];
                                      newQs[i].options.push(`Option ${newQs[i].options.length + 1}`);
                                      setFormData({ ...formData, quiz: { ...formData.quiz, questions: newQs } });
                                   }}>+ Add Option</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};