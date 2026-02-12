import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Module, Theme } from '../types';
import { DEFAULT_THEME, MOCK_MODULES } from '../constants';

interface AppContextType {
  modules: Module[];
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
  addModule: (module: Module) => void;
  updateModule: (id: string, module: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  getModule: (id: string) => Module | undefined;
  incrementModuleView: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('lms_modules');
    return saved ? JSON.parse(saved) : MOCK_MODULES;
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('lms_theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem('lms_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('lms_theme', JSON.stringify(theme));
    // Apply theme to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--bg-color', theme.background);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);
  }, [theme]);

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  const addModule = (module: Module) => {
    setModules(prev => [module, ...prev]);
  };

  const updateModule = (id: string, updatedData: Partial<Module>) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...updatedData, lastUpdated: Date.now() } : m));
  };

  const deleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const getModule = (id: string) => {
    return modules.find(m => m.id === id);
  };

  const incrementModuleView = (id: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, stats: { ...m.stats, views: m.stats.views + 1 } };
      }
      return m;
    }));
  };

  return (
    <AppContext.Provider value={{
      modules,
      theme,
      updateTheme,
      addModule,
      updateModule,
      deleteModule,
      getModule,
      incrementModuleView
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
