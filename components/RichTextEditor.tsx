import React, { useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Type 
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to set initial content to avoid cursor jumping

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    // Attempt to execute command on current selection
    document.execCommand(command, false, value);
    // Ensure focus returns to editor
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)] transition-shadow bg-[var(--card-bg)]">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        {/* Font Family Dropdown */}
        <select 
          onChange={(e) => {
            execCommand('fontName', e.target.value);
            e.target.value = ""; // Reset selection to allow re-selecting same font later
          }}
          className="h-8 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-[var(--primary)] mr-2 px-1 bg-white"
          defaultValue=""
        >
            <option value="" disabled>Font Family</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Verdana">Verdana</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Trebuchet MS">Trebuchet MS</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <ToolButton onClick={() => execCommand('bold')} icon={<Bold size={16} />} title="Bold" />
        <ToolButton onClick={() => execCommand('italic')} icon={<Italic size={16} />} title="Italic" />
        <ToolButton onClick={() => execCommand('underline')} icon={<Underline size={16} />} title="Underline" />
        <ToolButton onClick={() => execCommand('strikeThrough')} icon={<Strikethrough size={16} />} title="Strikethrough" />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolButton onClick={() => execCommand('formatBlock', 'H3')} icon={<Type size={16} />} title="Heading" />
        <ToolButton onClick={() => execCommand('formatBlock', 'P')} icon={<span className="text-xs font-bold">P</span>} title="Paragraph" />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolButton onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} title="Bullet List" />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <ToolButton onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} title="Align Left" />
        <ToolButton onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16} />} title="Align Center" />
        <ToolButton onClick={() => execCommand('justifyRight')} icon={<AlignRight size={16} />} title="Align Right" />
        <ToolButton onClick={() => execCommand('justifyFull')} icon={<AlignJustify size={16} />} title="Justify" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[200px] outline-none prose max-w-none text-[var(--text-color)]"
        style={{ color: 'var(--text-color)' }}
      />
    </div>
  );
};

const ToolButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string }> = ({ onClick, icon, title }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // Prevent button from stealing focus
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
    title={title}
  >
    {icon}
  </button>
);