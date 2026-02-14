import React, { useState, useRef, useEffect } from 'react';
import { Palette, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { DEFAULT_THEME, DARK_THEME } from '../constants';

export const ThemeCustomizer: React.FC = () => {
  const { theme, updateTheme } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colors = [
    { label: 'Primary', key: 'primary' as const },
    { label: 'Background', key: 'background' as const },
    { label: 'Text', key: 'text' as const },
    { label: 'Card BG', key: 'cardBg' as const },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[var(--primary)] transition-colors"
        title="Customize Theme"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-[var(--card-bg)] p-4 rounded-xl shadow-2xl border border-gray-200 w-72 z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[var(--text-color)]">Theme Settings</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {colors.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-80 text-[var(--text-color)]">{c.label}</span>
                <input
                  type="color"
                  value={theme[c.key]}
                  onChange={(e) => updateTheme({ [c.key]: e.target.value })}
                  className="h-8 w-14 rounded cursor-pointer border-0 p-0"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <button
              onClick={() => updateTheme(DEFAULT_THEME)}
              className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-800 font-medium transition-colors"
            >
              Light Default
            </button>
            <button
              onClick={() => updateTheme(DARK_THEME)}
              className="flex-1 text-xs py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded text-white font-medium transition-colors"
            >
              Dark Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};