
import React, { useRef, useEffect } from 'react';

// Global registry for the active rich text editor instance to facilitate Ribbon communication
let activeEditorElement: HTMLDivElement | null = null;
let lastStoredRange: Range | null = null;

/**
 * Saves the current selection in the globally active editor
 */
export const saveGlobalSelection = () => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (activeEditorElement && activeEditorElement.contains(range.commonAncestorContainer)) {
      lastStoredRange = range.cloneRange();
    }
  }
};

/**
 * Restores selection to the globally active editor
 */
export const restoreGlobalSelection = (shouldFocus = true) => {
  if (activeEditorElement) {
    if (shouldFocus) activeEditorElement.focus();
    if (lastStoredRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(lastStoredRange);
      }
    }
  }
};

/**
 * Applies a formatting command to the active text selection
 */
export const applyGlobalCommand = (command: string, value: string | undefined = undefined) => {
  restoreGlobalSelection(true);
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand(command, false, value);
  saveGlobalSelection();
};

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isActive?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, className, style, isActive }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      const isFocused = document.activeElement === editorRef.current;
      // Update HTML only if not focused to avoid cursor jumping
      if (editorRef.current.innerHTML !== initialContent && !isFocused && !isEditingRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
    }
  }, [initialContent]);

  // If the block is active, we ensure this instance is the globally active one
  useEffect(() => {
    if (isActive && editorRef.current) {
      activeEditorElement = editorRef.current;
      // When explicitly set to active (selected), focus it if nothing else is focused
      if (document.activeElement !== editorRef.current) {
         editorRef.current.focus();
      }
    }
  }, [isActive]);

  const handleInput = () => {
    if (editorRef.current) {
      isEditingRef.current = true;
      onChange(editorRef.current.innerHTML);
      saveGlobalSelection();
      setTimeout(() => { isEditingRef.current = false; }, 50);
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onMouseUp={() => { activeEditorElement = editorRef.current; saveGlobalSelection(); }}
      onKeyUp={() => { activeEditorElement = editorRef.current; saveGlobalSelection(); }}
      onFocus={() => { activeEditorElement = editorRef.current; saveGlobalSelection(); }}
      onBlur={saveGlobalSelection}
      className={`outline-none prose max-w-none text-inherit cursor-text select-text ${className || ''}`}
      style={{ ...style, minHeight: '1em' }}
    />
  );
};
