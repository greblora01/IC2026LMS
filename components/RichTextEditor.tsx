import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, Type } from 'lucide-react';

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
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)] transition-shadow bg-[var(--card-bg)]">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <ToolButton onClick={() => execCommand('bold')} icon={<Bold size={16} />} title="Bold" />
        <ToolButton onClick={() => execCommand('italic')} icon={<Italic size={16} />} title="Italic" />
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <ToolButton onClick={() => execCommand('formatBlock', 'H3')} icon={<Type size={16} />} title="Heading" />
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <ToolButton onClick={() => execCommand('insertUnorderedList')} icon={<List size={16} />} title="Bullet List" />
        <ToolButton onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} title="Align Left" />
        <ToolButton onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16} />} title="Align Center" />
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
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
    title={title}
  >
    {icon}
  </button>
);
