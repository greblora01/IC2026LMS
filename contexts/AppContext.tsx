import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Module, Theme } from '../types';
import { DEFAULT_THEME, MOCK_MODULES } from '../constants';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';

interface AppContextType {
  modules: Module[];
  theme: Theme;
  isCloud: boolean;
  isLoading: boolean;
  updateTheme: (newTheme: Partial<Theme>) => void;
  addModule: (module: Module) => Promise<void>;
  updateModule: (id: string, module: Partial<Module>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  getModule: (id: string) => Module | undefined;
  incrementModuleView: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isCloud = !!db; 
  
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('lms_theme');
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    setIsLoading(true);
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'modules'), (snapshot) => {
        const fetchedModules = snapshot.docs.map(doc => {
          // Ensure we only store plain object data
          const data = doc.data();
          return { ...data } as Module;
        });
        fetchedModules.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
        setModules(fetchedModules);
        setIsLoading(false);
      }, (error) => {
        console.error("Firebase connection error or timeout:", error);
        // On error, try to load from local storage if available
        const saved = localStorage.getItem('lms_modules');
        if (saved) setModules(JSON.parse(saved));
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('lms_modules');
      if (saved) {
        try {
          setModules(JSON.parse(saved));
        } catch (e) {
          setModules(MOCK_MODULES);
        }
      } else {
        setModules(MOCK_MODULES);
      }
      setIsLoading(false);
    }
  }, []);

  const saveToLocalStorage = (newModules: Module[]) => {
    setModules(newModules);
    localStorage.setItem('lms_modules', JSON.stringify(newModules));
  };

  useEffect(() => {
    localStorage.setItem('lms_theme', JSON.stringify(theme));
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

  const addModule = async (module: Module) => {
    if (db) {
      await setDoc(doc(db, 'modules', module.id), { ...module });
    } else {
      const newModules = [module, ...modules];
      saveToLocalStorage(newModules);
    }
  };

  const updateModule = async (id: string, updatedData: Partial<Module>) => {
    if (db) {
      const moduleRef = doc(db, 'modules', id);
      await updateDoc(moduleRef, {
        ...updatedData,
        lastUpdated: Date.now()
      });
    } else {
      const newModules = modules.map(m => 
        m.id === id ? { ...m, ...updatedData, lastUpdated: Date.now() } : m
      );
      saveToLocalStorage(newModules);
    }
  };

  const deleteModule = async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'modules', id));
      } catch (error) {
        console.error("Error deleting module:", error);
      }
    } else {
      const newModules = modules.filter(m => m.id !== id);
      saveToLocalStorage(newModules);
    }
  };

  const getModule = useCallback((id: string) => {
    return modules.find(m => m.id === id);
  }, [modules]);

  const incrementModuleView = async (id: string) => {
    if (db) {
      try {
        const moduleRef = doc(db, 'modules', id);
        await updateDoc(moduleRef, {
          'stats.views': increment(1)
        });
      } catch (error) {
        console.error("Error updating views:", error);
      }
    } else {
      const newModules = modules.map(m => 
        m.id === id 
          ? { ...m, stats: { ...m.stats, views: m.stats.views + 1 } } 
          : m
      );
      saveToLocalStorage(newModules);
    }
  };

  const resetToDefaults = async () => {
    if (db) {
      try {
        const batch = writeBatch(db);
        modules.forEach(m => {
          batch.delete(doc(db!, 'modules', m.id));
        });
        MOCK_MODULES.forEach(m => {
          batch.set(doc(db!, 'modules', m.id), { ...m });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error resetting DB:", error);
      }
    } else {
      saveToLocalStorage(MOCK_MODULES);
    }
  };

  return (
    <AppContext.Provider value={{
      modules,
      theme,
      isCloud,
      isLoading,
      updateTheme,
      addModule,
      updateModule,
      deleteModule,
      getModule,
      incrementModuleView,
      resetToDefaults
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
