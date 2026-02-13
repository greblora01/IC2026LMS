import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Upload, Plus, Trash, CheckCircle, 
  FileText, Settings, Eye, 
  MonitorPlay, Image as ImageIcon, FileUp, Loader2, Link as LinkIcon,
  GripVertical, Type, Youtube, Move, X, Paperclip, Code, Columns
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { Module, Question, AttachedFile, Slide, SlideMedia, SlideBlock, BlockType } from '../types';
import { ModuleViewer } from './ModuleViewer';
import { NEW_MODULE_TEMPLATE_SLIDES } from '../constants';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

type EditorSection = 'quiz' | string; // 'quiz' or slide ID

export const ModuleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addModule, updateModule, getModule } = useAppContext();
  
  const isEditMode = !!id;
  // Default to empty, will be set by useEffect
  const [activeSection, setActiveSection] = useState<EditorSection>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and Drop State
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [draggedToolType, setDraggedToolType] = useState<BlockType | null>(null);
  
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
        // Set first slide active if available
        if (existing.slides && existing.slides.length > 0) {
           setActiveSection(existing.slides[0].id);
        } else {
           setActiveSection('quiz');
        }
      } else {
        navigate('/');
      }
    } else if (!isEditMode && (!formData.slides || formData.slides.length === 0)) {
       // Initialize with Default Template
       const templateSlides = NEW_MODULE_TEMPLATE_SLIDES.map(s => ({
         ...s,
         id: generateId(),
         blocks: s.blocks.map(b => ({ ...b, id: generateId() }))
       }));
       
       setFormData(prev => ({
         ...prev,
         title: 'New Volunteer Training Module',
         slides: templateSlides as Slide[]
       }));
       setActiveSection(templateSlides[0].id);
    }
  }, [id, isEditMode, getModule, navigate]);

  // Migrate legacy slides to blocks on the fly when accessed
  useEffect(() => {
    if (!formData.slides) return;
    
    // Check if current active slide needs migration
    const activeSlide = formData.slides.find(s => s.id === activeSection);
    if (activeSlide && (!activeSlide.blocks || activeSlide.blocks.length === 0)) {
       const newBlocks: SlideBlock[] = [];
       
       // Add Media Block if exists
       if (activeSlide.media) {
         if (activeSlide.media.url.includes('youtube')) {
            newBlocks.push({ id: generateId(), type: 'youtube', content: activeSlide.media.url, width: 100 });
         } else {
            newBlocks.push({ id: generateId(), type: activeSlide.media.type, content: activeSlide.media.url, width: 100 });
         }
       }
       
       // Add Text Content
       if (activeSlide.content) {
         newBlocks.push({ id: generateId(), type: 'text', content: activeSlide.content, width: 100 });
       }
       
       // If empty, add placeholder
       if (newBlocks.length === 0) {
         newBlocks.push({ id: generateId(), type: 'text', content: '<p>Start typing here...</p>', width: 100 });
       }

       // Update state
       setFormData(prev => ({
         ...prev,
         slides: prev.slides?.map(s => s.id === activeSection ? { ...s, blocks: newBlocks } : s)
       }));
    }
  }, [activeSection, formData.slides]);

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

  const handleCopyJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    navigator.clipboard.writeText(dataStr);
    alert('Module JSON copied to clipboard! You can paste this into constants.ts.');
  };

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

  const processLineItems = (items: any[], bodyHeight: number, styles: any) => {
    if (!items || items.length === 0) return '';
    
    // Sort left to right
    items.sort((a, b) => a.transform[4] - b.transform[4]);

    // Reconstruct string with basic formatting awareness
    let lineHtmlParts: string[] = [];
    
    items.forEach((item, idx) => {
        let text = item.str;
        // Basic spacing: check gap from previous item
        if (idx > 0) {
            const prev = items[idx-1];
            const gap = item.transform[4] - (prev.transform[4] + prev.width);
            if (gap > (item.height * 0.2)) { // if gap > 20% of font size, add space
                 text = ' ' + text;
            }
        }

        // Check for Bold/Italic
        const fontName = item.fontName;
        const fontInfo = styles[fontName];
        const fontFace = fontInfo ? (fontInfo.fontFamily || fontName).toLowerCase() : '';
        
        let isBold = fontFace.includes('bold') || fontFace.includes('black') || item.fontName.includes('Bold');
        let isItalic = fontFace.includes('italic') || fontFace.includes('oblique') || item.fontName.includes('Italic');

        if (isBold) text = `<strong>${text}</strong>`;
        if (isItalic) text = `<em>${text}</em>`;
        
        lineHtmlParts.push(text);
    });

    const fullLineHtml = lineHtmlParts.join('');
    const cleanText = fullLineHtml.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return '';

    // Detect structural type
    const maxHeight = Math.max(...items.map(i => i.height));
    const isTitle = maxHeight > bodyHeight * 1.5;
    const isHeader = !isTitle && maxHeight > bodyHeight * 1.1;
    const isList = /^[•\-\u2022\u25CF]\s/.test(cleanText) || /^(\d+\.)\s/.test(cleanText);

    if (isTitle) return `<h1 class="text-4xl font-bold mb-6 text-[var(--primary)]">${fullLineHtml}</h1>`;
    if (isHeader) return `<h2 class="text-2xl font-bold text-[var(--text-color)] mb-4 mt-6">${fullLineHtml}</h2>`;
    if (isList) return `<li class="ml-4 list-disc text-[var(--text-color)] mb-2 text-lg">${fullLineHtml.replace(/^[•\-\u2022\u25CF]\s*/, '')}</li>`;
    
    return `<p class="mb-2 text-lg leading-relaxed text-[var(--text-color)]">${fullLineHtml}</p>`;
  };

  const handleImportPdfSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Access default export or named export for robustness
      // @ts-ignore
      const pdfjs = pdfjsLib.default || pdfjsLib;

      // Initialize worker if needed
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        // Use unpkg.com to ensure we get a worker script compatible with importScripts
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const newSlides: Slide[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];
        
        if (items.length === 0) continue;

        // 1. Calculate Body Font Size (Mode of heights)
        const heightCounts: Record<number, number> = {};
        items.forEach((item: any) => {
            const h = Math.round(item.height || 0);
            if (h > 0) heightCounts[h] = (heightCounts[h] || 0) + 1;
        });
        
        let bodyHeight = 12; // Default fallback
        let maxCount = 0;
        for (const [h, c] of Object.entries(heightCounts)) {
            if (c > maxCount) {
                maxCount = c;
                bodyHeight = parseInt(h);
            }
        }

        // 2. Sort items top-down, then left-right
        items.sort((a: any, b: any) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            // Significant Y difference defines a "line" visually
            if (Math.abs(yA - yB) > (Math.min(a.height, b.height) * 0.5)) {
                return yB - yA; // Top down (PDF origin is bottom-left)
            }
            return a.transform[4] - b.transform[4]; // Left right
        });

        // 3. Group into lines and Process
        let pageHtml = '';
        let currentLineItems: any[] = [];
        let lastY = items[0].transform[5];
        let wasList = false;
        let slideTitle = `Slide ${(formData.slides?.length || 0) + i}`;
        let titleFound = false;

        items.forEach((item: any) => {
            const y = item.transform[5];
            
            // If new line detected (significant Y jump)
            if (Math.abs(y - lastY) > (item.height * 0.5)) {
                 if (currentLineItems.length > 0) {
                     const lineHtml = processLineItems(currentLineItems, bodyHeight, textContent.styles);
                     
                     // Handle List Grouping (`<ul>` wrapper)
                     const isListLine = lineHtml.includes('<li');
                     if (isListLine && !wasList) {
                         pageHtml += '<ul class="list-disc pl-5 mb-6 space-y-2">';
                         wasList = true;
                     } else if (!isListLine && wasList) {
                         pageHtml += '</ul>';
                         wasList = false;
                     }

                     // Heuristic: First Header is Slide Title
                     if (!titleFound && (lineHtml.includes('<h1') || lineHtml.includes('<h2'))) {
                         const match = lineHtml.match(/>([^<]+)</);
                         if (match && match[1].length < 100) {
                             slideTitle = match[1];
                             titleFound = true;
                         }
                     }

                     pageHtml += lineHtml;
                     currentLineItems = [];
                 }
            }
            currentLineItems.push(item);
            lastY = y;
        });

        // Flush last line
        if (currentLineItems.length > 0) {
            const lineHtml = processLineItems(currentLineItems, bodyHeight, textContent.styles);
            const isListLine = lineHtml.includes('<li');
             if (isListLine && !wasList) {
                 pageHtml += '<ul class="list-disc pl-5 mb-6 space-y-2">';
                 wasList = true;
             }
             pageHtml += lineHtml;
             if (wasList || isListLine) pageHtml += '</ul>';
        }

        if (pageHtml) {
            const slideBlocks: SlideBlock[] = [
               { id: generateId(), type: 'text', content: pageHtml, width: 100 }
            ];

            newSlides.push({
               id: generateId(),
               title: slideTitle,
               content: '',
               layout: 'text-only',
               blocks: slideBlocks
            });
        }
      }

      setFormData(prev => ({
        ...prev,
        slides: [...(prev.slides || []), ...newSlides]
      }));
      
      alert(`Successfully imported ${newSlides.length} pages. Layout, formatting (bold/italic), and lists have been preserved.`);
    } catch (err) {
      console.error(err);
      alert("Failed to import PDF. " + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessingPdf(false);
      e.target.value = '';
    }
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: generateId(),
      title: `Slide ${(formData.slides?.length || 0) + 1}`,
      content: '',
      layout: 'text-only',
      blocks: [
        { id: generateId(), type: 'text', content: '<p>Start typing or drag a component here...</p>', width: 100 }
      ]
    };
    setFormData(prev => ({ ...prev, slides: [...(prev.slides || []), newSlide] }));
    setActiveSection(newSlide.id);
  };

  const deleteSlide = (slideId: string) => {
    if ((formData.slides?.length || 0) <= 1) return alert("You must have at least one slide.");
    const newSlides = formData.slides?.filter(s => s.id !== slideId) || [];
    setFormData(prev => ({ ...prev, slides: newSlides }));
    // If we deleted the active slide, jump to the first one available or the quiz
    if (activeSection === slideId) {
        setActiveSection(newSlides.length > 0 ? newSlides[0].id : 'quiz');
    }
  };

  const updateSlideTitle = (slideId: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides?.map(s => s.id === slideId ? { ...s, title } : s)
    }));
  };

  // --- Block Management ---

  const addBlock = (slideId: string, type: BlockType, index?: number) => {
    const newBlock: SlideBlock = {
      id: generateId(),
      type,
      content: type === 'text' ? '<p>Edit this text...</p>' : '',
      width: 100
    };
    
    setFormData(prev => {
      const slides = [...(prev.slides || [])];
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prev;
      
      const blocks = [...(slides[slideIndex].blocks || [])];
      if (typeof index === 'number') {
        blocks.splice(index, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }
      
      slides[slideIndex] = { ...slides[slideIndex], blocks };
      return { ...prev, slides };
    });
  };

  const updateBlock = (slideId: string, blockId: string, content: string) => {
    setFormData(prev => {
      const slides = [...(prev.slides || [])];
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prev;
      
      const blocks = slides[slideIndex].blocks?.map(b => 
        b.id === blockId ? { ...b, content } : b
      ) || [];
      
      slides[slideIndex] = { ...slides[slideIndex], blocks };
      return { ...prev, slides };
    });
  };

  const updateBlockWidth = (slideId: string, blockId: string, width: number) => {
    setFormData(prev => {
      const slides = [...(prev.slides || [])];
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prev;
      
      const blocks = slides[slideIndex].blocks?.map(b => 
        b.id === blockId ? { ...b, width } : b
      ) || [];
      
      slides[slideIndex] = { ...slides[slideIndex], blocks };
      return { ...prev, slides };
    });
  };

  const removeBlock = (slideId: string, blockId: string) => {
    setFormData(prev => {
      const slides = [...(prev.slides || [])];
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prev;
      
      const blocks = slides[slideIndex].blocks?.filter(b => b.id !== blockId) || [];
      slides[slideIndex] = { ...slides[slideIndex], blocks };
      return { ...prev, slides };
    });
  };

  const moveBlock = (slideId: string, fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const slides = [...(prev.slides || [])];
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prev;
      
      const blocks = [...(slides[slideIndex].blocks || [])];
      const [movedBlock] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, movedBlock);
      
      slides[slideIndex] = { ...slides[slideIndex], blocks };
      return { ...prev, slides };
    });
  };

  // --- Drag and Drop Handlers for Slides ---
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

  // --- Drag and Drop Handlers for Blocks ---
  const handleBlockDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedBlockIndex(index);
    setDraggedToolType(null); // Ensure we aren't dragging a tool
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleToolDragStart = (e: React.DragEvent, type: BlockType) => {
    e.stopPropagation();
    setDraggedToolType(type);
    setDraggedBlockIndex(null);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBlockDrop = (e: React.DragEvent, dropIndex: number, slideId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Handling Tool Drop (New Block)
    if (draggedToolType) {
      addBlock(slideId, draggedToolType, dropIndex);
      setDraggedToolType(null);
      return;
    }

    // Handling Block Reorder
    if (draggedBlockIndex !== null && draggedBlockIndex !== dropIndex) {
      moveBlock(slideId, draggedBlockIndex, dropIndex);
      setDraggedBlockIndex(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, blockId: string, currentWidth: number = 100) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent drag start on container
    const startX = e.clientX;
    const container = e.currentTarget.closest('.blocks-container') as HTMLElement;
    if (!container) return;
    const parentWidth = container.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - startX;
      // Calculate new width in pixels
      const startWidthPx = (currentWidth / 100) * parentWidth;
      const newWidthPx = startWidthPx + delta;
      
      // Convert to percentage
      let newWidthPercent = (newWidthPx / parentWidth) * 100;
      
      // Constraints
      newWidthPercent = Math.max(20, Math.min(100, newWidthPercent));
      
      // Snap to common grids (25, 33, 50, 66, 75) with 3% threshold
      const snapPoints = [25, 33.33, 50, 66.66, 75, 100];
      const closest = snapPoints.find(p => Math.abs(p - newWidthPercent) < 3);
      if (closest) newWidthPercent = closest;

      updateBlockWidth(activeSection, blockId, newWidthPercent);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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

  // --- Components ---

  const BlockEditor = ({ block, slideId }: { block: SlideBlock, slideId: string }) => {
    const handleMediaUpload = async (file: File) => {
       try {
         const base64 = await readFileAsBase64(file);
         updateBlock(slideId, block.id, base64);
       } catch (error) {
         console.error(error);
       }
    };

    const handleUrlUpdate = (val: string) => {
       const url = block.type === 'youtube' ? getEmbedUrl(val) : val;
       updateBlock(slideId, block.id, url);
    };

    return (
      <div className="w-full">
        {block.type === 'text' && (
          <RichTextEditor 
            initialContent={block.content} 
            onChange={(html) => updateBlock(slideId, block.id, html)} 
          />
        )}

        {(block.type === 'image' || block.type === 'video') && (
           <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
              {block.content ? (
                 <div className="relative group">
                    {block.type === 'image' ? (
                       <img src={block.content} alt="Block" className="max-w-full h-auto rounded max-h-[400px] mx-auto" />
                    ) : (
                       <video src={block.content} controls className="max-w-full h-auto rounded max-h-[400px] mx-auto" />
                    )}
                    <button 
                       onClick={() => updateBlock(slideId, block.id, '')}
                       className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <Trash size={16} />
                    </button>
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors relative">
                    <input 
                      type="file" 
                      accept={block.type === 'image' ? "image/*" : "video/*"}
                      onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {block.type === 'image' ? <ImageIcon size={32} className="mb-2 text-gray-400" /> : <MonitorPlay size={32} className="mb-2 text-gray-400" />}
                    <span className="text-sm text-gray-500 font-medium">Click or Drag to Upload {block.type === 'image' ? 'Image' : 'Video'}</span>
                </div>
              )}
           </div>
        )}

        {block.type === 'youtube' && (
           <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
              {block.content ? (
                <div className="relative group aspect-video">
                   <iframe src={block.content} className="w-full h-full rounded" title="YouTube" />
                   <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => {
                            const newUrl = prompt("Enter new YouTube URL:", block.content);
                            if (newUrl) handleUrlUpdate(newUrl);
                         }}
                         className="bg-white p-1.5 rounded-full text-gray-600 shadow-sm"
                      >
                         <Settings size={16} />
                      </button>
                      <button 
                         onClick={() => updateBlock(slideId, block.id, '')}
                         className="bg-white p-1.5 rounded-full text-red-500 shadow-sm"
                      >
                         <Trash size={16} />
                      </button>
                   </div>
                </div>
              ) : (
                 <div className="flex items-center gap-2 p-4 bg-white rounded border border-gray-300">
                    <Youtube size={24} className="text-red-600" />
                    <input 
                      type="text" 
                      placeholder="Paste YouTube URL here..." 
                      className="flex-1 p-2 outline-none text-sm"
                      onBlur={(e) => handleUrlUpdate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlUpdate(e.currentTarget.value)}
                    />
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
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <input
             type="text"
             value={formData.title}
             onChange={e => setFormData({ ...formData, title: e.target.value })}
             className="text-xl font-bold bg-transparent border-none focus:ring-0 outline-none w-full max-w-md placeholder-gray-400 text-[var(--primary)]"
             placeholder="Untitled Module"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJSON}
            className="p-2 text-gray-500 hover:text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors"
            title="Copy JSON (for constants.ts)"
          >
            <Code size={18} />
          </button>
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
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Tools Sidebar */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-20 shadow-sm shrink-0 overflow-y-auto custom-scrollbar">
             {/* Hidden PDF Input */}
             <input
              type="file"
              accept=".pdf"
              ref={pdfInputRef}
              onChange={handleImportPdfSlides}
              className="hidden"
              disabled={isProcessingPdf}
            />

             {activeSection !== 'quiz' && (
               <>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Insert</div>
                 {[
                   { type: 'text', icon: <Type size={20} />, label: 'Text' },
                   { type: 'image', icon: <ImageIcon size={20} />, label: 'Image' },
                   { type: 'video', icon: <MonitorPlay size={20} />, label: 'Video' },
                   { type: 'youtube', icon: <Youtube size={20} />, label: 'YouTube' },
                 ].map(tool => (
                   <div 
                      key={tool.type}
                      draggable
                      onDragStart={(e) => handleToolDragStart(e, tool.type as BlockType)}
                      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 p-2 rounded-lg transition-colors w-16"
                   >
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                        {tool.icon}
                      </div>
                      <span className="text-[9px] font-medium text-gray-500">{tool.label}</span>
                   </div>
                 ))}
                 <div className="w-10 h-px bg-gray-200 my-2"></div>
               </>
             )}
             
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Actions</div>
             
             <button 
               onClick={() => addSlide()}
               className="flex flex-col items-center gap-1 hover:bg-gray-100 p-2 rounded-lg transition-colors w-16 text-gray-700"
               title="Add New Slide"
             >
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-[var(--primary)]">
                  <Plus size={20} />
                </div>
                <span className="text-[9px] font-medium text-gray-500">Add Slide</span>
             </button>
             
             <button 
               onClick={() => setShowResourceModal(true)}
               className="flex flex-col items-center gap-1 hover:bg-gray-100 p-2 rounded-lg transition-colors w-16 text-gray-700"
               title="Module Resources / Attach PDF"
             >
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  <Paperclip size={20} />
                </div>
                <span className="text-[9px] font-medium text-gray-500">Resources</span>
             </button>

             <button 
               onClick={() => pdfInputRef.current?.click()}
               className="flex flex-col items-center gap-1 hover:bg-gray-100 p-2 rounded-lg transition-colors w-16 text-gray-700"
               title="Import PDF Slides"
               disabled={isProcessingPdf}
             >
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {isProcessingPdf ? <Loader2 size={20} className="animate-spin" /> : <FileUp size={20} />}
                </div>
                <span className="text-[9px] font-medium text-gray-500">Import</span>
             </button>

             <button 
               onClick={() => setActiveSection('quiz')}
               className={`flex flex-col items-center gap-1 hover:bg-gray-100 p-2 rounded-lg transition-colors w-16 ${activeSection === 'quiz' ? 'bg-blue-50' : ''}`}
               title="Edit Quiz"
             >
                <div className={`p-2 rounded-lg border ${activeSection === 'quiz' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <CheckCircle size={20} />
                </div>
                <span className="text-[9px] font-medium text-gray-500">Quiz</span>
             </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
          <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-5xl mx-auto pb-20 w-full">

              {/* Slide Canvas Editor */}
              {activeSection !== 'quiz' && activeSlide && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white min-h-[800px] w-full shadow-lg border border-gray-200 rounded-lg flex flex-col relative overflow-hidden" onDragOver={handleCanvasDragOver}>
                    
                    <div className="p-8 md:p-12 flex-1">
                      {/* Slide Header */}
                      <div className="mb-8 pb-4 border-b border-gray-100">
                         <input
                            type="text"
                            value={activeSlide.title}
                            onChange={(e) => updateSlideTitle(activeSection, e.target.value)}
                            className="text-3xl font-bold bg-transparent border-none focus:ring-0 outline-none w-full placeholder-gray-300 text-[var(--primary)]"
                            placeholder="Untitled Slide"
                          />
                          <p className="text-xs text-gray-400 mt-2">Drag and drop components from the left sidebar to build your slide. Drag the right edge of a component to resize it.</p>
                      </div>

                      {/* Blocks Canvas */}
                      <div className="blocks-container flex flex-wrap items-start content-start min-h-[400px] -mx-2">
                        {activeSlide.blocks?.map((block, idx) => (
                          <div 
                            key={block.id}
                            style={{ width: `${block.width || 100}%` }}
                            className={`relative group border-2 border-transparent rounded-lg transition-all px-2 mb-4 ${draggedBlockIndex === idx ? 'opacity-40 border-dashed border-gray-300' : 'hover:border-blue-50'}`}
                            draggable
                            onDragStart={(e) => handleBlockDragStart(e, idx)}
                            onDragOver={(e) => { e.preventDefault(); /* Allow dropping */ }}
                            onDrop={(e) => handleBlockDrop(e, idx, activeSection)}
                          >
                            {/* Drag Handle & Controls */}
                            <div className="absolute -left-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                               <div className="cursor-grab p-1.5 bg-white border border-gray-200 rounded text-gray-400 hover:text-gray-600 shadow-sm" title="Drag to reorder">
                                  <GripVertical size={16} />
                               </div>
                               <button 
                                 onClick={() => removeBlock(activeSection, block.id)}
                                 className="p-1.5 bg-white border border-gray-200 rounded text-gray-400 hover:text-red-500 shadow-sm"
                                 title="Delete block"
                               >
                                  <X size={16} />
                               </button>
                            </div>

                            {/* Block Content */}
                            <div className="h-full">
                               <BlockEditor block={block} slideId={activeSection} />
                            </div>

                            {/* Resize Handle */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-20 flex items-center justify-center group/resize hover:bg-blue-500/10 rounded-r-lg"
                              onMouseDown={(e) => handleResizeStart(e, block.id, block.width || 100)}
                              onClick={(e) => e.stopPropagation()}
                            >
                               <div className="w-1 h-8 bg-gray-300 rounded-full group-hover/resize:bg-[var(--primary)] transition-colors" />
                            </div>

                            {/* Drop Zone Indicator (Bottom) - Only show if not last */}
                            {idx < (activeSlide.blocks?.length || 0) - 1 && (
                              <div 
                                className="h-2 w-full absolute -bottom-3 left-0 z-10"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleBlockDrop(e, idx + 1, activeSection)}
                              />
                            )}
                          </div>
                        ))}

                        {/* Empty State / Bottom Drop Zone */}
                        {(activeSlide.blocks || []).length === 0 && (
                          <div 
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleBlockDrop(e, 0, activeSection)}
                          >
                             <p>Drag tools from the left sidebar here</p>
                          </div>
                        )}
                        
                        {/* Final Drop Zone at the very bottom */}
                        <div 
                           className="w-full h-20 flex items-center justify-center transition-colors"
                           onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50/50'); }}
                           onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50/50')}
                           onDrop={(e) => {
                              e.currentTarget.classList.remove('bg-blue-50/50');
                              handleBlockDrop(e, (activeSlide.blocks || []).length, activeSection);
                           }}
                        >
                           <div className="text-gray-300 text-sm opacity-0 hover:opacity-100 transition-opacity flex items-center gap-2">
                              <Plus size={16} /> Drop here to add to bottom
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="h-8 bg-[var(--primary)] text-white flex justify-between items-center px-6 text-xs font-bold uppercase tracking-wider shrink-0 select-none z-10">
                        <span>VOLUNTEER TRAINING</span>
                        <span>2026 IC</span>
                    </div>

                  </div>
                </div>
              )}

              {/* Quiz Editor */}
              {activeSection === 'quiz' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white min-h-[800px] w-full shadow-lg border border-gray-200 rounded-lg p-8 md:p-12 relative">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                      <h2 className="text-3xl font-bold">Quiz Questions</h2>
                      <button
                        onClick={addQuestion}
                        className="text-sm bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2 font-medium shadow-sm transition-all"
                      >
                        <Plus size={16} /> Add Question
                      </button>
                    </div>

                    <div className="space-y-6 max-w-3xl mx-auto">
                      {formData.quiz?.questions.map((q, qIndex) => (
                        <div key={q.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative group hover:border-gray-300 transition-colors">
                          <button
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              quiz: { ...prev.quiz!, questions: prev.quiz!.questions.filter((_, i) => i !== qIndex) }
                            }))}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2"
                            title="Delete Question"
                          >
                            <Trash size={18} />
                          </button>

                          <div className="mb-6 pr-10">
                            <label className="text-xs uppercase font-bold text-gray-400 mb-2 block tracking-wider">Question {qIndex + 1}</label>
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none font-medium"
                              placeholder="Enter question text..."
                            />
                          </div>

                          <div className="space-y-3">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-3">
                                <button
                                  onClick={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    q.correctOptionIndex === oIndex
                                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                      : 'border-gray-300 text-transparent hover:border-gray-400'
                                  }`}
                                  title="Mark as correct answer"
                                >
                                  <CheckCircle size={14} fill="currentColor" />
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-[var(--primary)] outline-none"
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const newQuestions = [...formData.quiz!.questions];
                                    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
                                    if (q.correctOptionIndex >= oIndex && q.correctOptionIndex > 0) newQuestions[qIndex].correctOptionIndex--;
                                    setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1"
                                  disabled={q.options.length <= 2}
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newQuestions = [...formData.quiz!.questions];
                                newQuestions[qIndex].options.push('');
                                setFormData(prev => ({ ...prev, quiz: { ...prev.quiz!, questions: newQuestions } }));
                              }}
                              className="text-xs text-[var(--primary)] font-bold ml-9 mt-2 hover:underline flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Option
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!formData.quiz?.questions || formData.quiz.questions.length === 0) && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                          <p className="mb-2">No questions yet.</p>
                          <p className="text-sm">Click "Add Question" above to start creating your quiz.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
           {/* Bottom Slide Navigation Bar */}
           <div className="h-24 bg-white border-t border-gray-200 flex items-center px-4 gap-4 overflow-x-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
                {formData.slides?.map((slide, idx) => (
                  <div 
                    key={slide.id}
                    onClick={() => setActiveSection(slide.id)}
                    draggable
                    onDragStart={(e) => handleSlideDragStart(e, idx)}
                    onDragOver={(e) => handleSlideDragOver(e, idx)}
                    onDragEnd={handleSlideDragEnd}
                    className={`flex-shrink-0 w-32 h-16 rounded-lg border-2 cursor-pointer relative group transition-all flex items-center justify-center p-2 text-xs text-center select-none ${
                        activeSection === slide.id 
                        ? 'border-[var(--primary)] bg-blue-50 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    } ${draggedSlideIndex === idx ? 'opacity-50' : ''}`}
                  >
                     <span className="line-clamp-2 font-medium text-gray-600">{slide.title || `Slide ${idx + 1}`}</span>
                     <div className="absolute top-1 left-1 text-[10px] font-bold text-gray-400 bg-white/50 px-1 rounded">{idx + 1}</div>
                     
                     {formData.slides && formData.slides.length > 1 && (
                       <button
                         onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                         className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         title="Delete Slide"
                       >
                         <X size={12} />
                       </button>
                     )}
                  </div>
                ))}
                
                <button
                  onClick={addSlide}
                  className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-blue-50 flex items-center justify-center text-gray-400 transition-colors"
                  title="Add New Slide"
                >
                  <Plus size={24} />
                </button>
             </div>
        </div>
      </div>
      
      {/* Resource Management Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Paperclip size={18} /> Module Materials
                </h3>
                <button onClick={() => setShowResourceModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                   {formData.files?.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-[var(--primary)] transition-colors">
                         <div className="flex items-center gap-3 truncate">
                            <div className="p-2 bg-white rounded border border-gray-100 text-gray-500">
                              <FileText size={16} />
                            </div>
                            <div>
                               <div className="text-sm font-medium truncate max-w-[180px] text-gray-700">{file.name}</div>
                               <div className="text-[10px] text-gray-400">{file.size}</div>
                            </div>
                         </div>
                         <button onClick={() => setFormData(prev => ({...prev, files: prev.files?.filter(f => f.id !== file.id)}))} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash size={16} />
                         </button>
                      </div>
                   ))}
                   {(!formData.files || formData.files.length === 0) && (
                     <div className="text-center py-6 text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No materials attached yet.
                     </div>
                   )}
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 hover:border-[var(--primary)] transition-all relative cursor-pointer group">
                   <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-blue-50 text-[var(--primary)] rounded-full group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Click to upload PDF or File</span>
                      <span className="text-xs text-gray-400">These will be available in the resources drawer.</span>
                   </div>
                </div>
             </div>
             <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-100"
                >
                  Done
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};