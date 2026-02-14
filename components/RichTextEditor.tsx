
import React, { useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, 
  List, 
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

// Shared state for the active editor and its selection
let lastStoredRange: Range | null = null;
let activeEditorElement: HTMLDivElement | null = null;

const saveSelection = () => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    // Only save if the selection is inside our active editor
    if (activeEditorElement && activeEditorElement.contains(range.commonAncestorContainer)) {
      lastStoredRange = range.cloneRange();
    }
  }
};

const restoreSelection = () => {
  if (activeEditorElement) {
    activeEditorElement.focus();
    if (lastStoredRange) {
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(lastStoredRange);
        }
    }
  }
};

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onClose?: () => void;
}

export const TextToolbar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const handleCommand = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
  };

  const applyInlineStyle = (property: string, value: string) => {
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    document.execCommand('styleWithCSS', false, 'true');
    
    if (property === 'font-family') {
        document.execCommand('fontName', false, value);
    } else if (property === 'font-size') {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = value;
        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } catch (e) {
            console.warn("Could not apply font size", e);
        }
    } else if (property === 'color') {
        document.execCommand('foreColor', false, value);
    }
    
    saveSelection();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Typography</label>
        
        <div className="flex flex-col gap-3">
          <select 
            onChange={(e) => applyInlineStyle('font-family', e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-orange-100"
            defaultValue=""
          >
              <option value="" disabled>Select Font</option>
              <option value="'Poppins', sans-serif">Poppins (Sans)</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="'Courier New', monospace">Courier (Mono)</option>
          </select>

          <div className="flex items-center gap-2">
            <input 
              type="number"
              className="w-20 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none text-center"
              onChange={(e) => {
                const val = e.target.value;
                if (val) applyInlineStyle('font-size', val + 'px');
              }}
              placeholder="Size"
            />
            <div className="flex-1 flex items-center justify-end px-3 bg-gray-50 border border-gray-100 rounded-xl h-[42px]">
               <input 
                  type="color" 
                  onChange={(e) => applyInlineStyle('color', e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 bg-transparent overflow-hidden" 
                />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-50">
        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Styling</label>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton onClick={() => handleCommand('bold')} icon={<Bold size={18} />} title="Bold" />
          <ToolButton onClick={() => handleCommand('italic')} icon={<Italic size={18} />} title="Italic" />
          <ToolButton onClick={() => handleCommand('underline')} icon={<Underline size={18} />} title="Underline" />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-50">
        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Alignment</label>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton onClick={() => handleCommand('justifyLeft')} icon={<AlignLeft size={18} />} title="Left" />
          <ToolButton onClick={() => handleCommand('justifyCenter')} icon={<AlignCenter size={18} />} title="Center" />
          <ToolButton onClick={() => handleCommand('justifyRight')} icon={<AlignRight size={18} />} title="Right" />
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-50">
        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Lists</label>
        <div className="grid grid-cols-2 gap-2">
          <ToolButton onClick={() => handleCommand('insertUnorderedList')} icon={<List size={18} />} title="Bullets" />
          <ToolButton onClick={() => handleCommand('insertOrderedList')} icon={<div className="font-bold text-xs">1.</div>} title="Numbered" />
        </div>
      </div>
      
      {onClose && (
          <button 
              onClick={onClose}
              className="w-full mt-8 bg-[var(--primary)] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 hover:opacity-90 transition-all active:scale-95"
          >
              Done Editing
          </button>
      )}
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, onClose }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== initialContent) {
        editorRef.current.innerHTML = initialContent;
      }
      activeEditorElement = editorRef.current;
      editorRef.current.focus();
      saveSelection();
    }
    
    return () => {
      activeEditorElement = null;
      lastStoredRange = null;
    };
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      saveSelection();
    }
  };

  const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    // We let the browser finish the selection before we save it
    setTimeout(saveSelection, 0);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      onMouseUp={handleInteraction}
      onKeyUp={handleInteraction}
      onBlur={() => setTimeout(saveSelection, 0)}
      className="h-full w-full outline-none prose max-w-none text-inherit p-4 overflow-y-auto cursor-text select-text slide-typography"
      style={{ fontSize: 'inherit' }}
    />
  );
};

const ToolButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string }> = ({ onClick, icon, title }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => { 
      e.preventDefault(); 
      onClick(); 
    }}
    className="h-12 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 text-gray-700 transition-all flex items-center justify-center"
    title={title}
  >
    {icon}
  </button>
);
