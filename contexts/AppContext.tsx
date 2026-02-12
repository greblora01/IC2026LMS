import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  
  // Theme state is kept in localStorage to avoid unnecessary DB reads/writes for user preference
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('lms_theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  // Load Modules (Firebase or LocalStorage)
  useEffect(() => {
    setIsLoading(true);
    if (db) {
      // Firebase Mode
      try {
        const unsubscribe = onSnapshot(collection(db, 'modules'), (snapshot) => {
          const fetchedModules = snapshot.docs.map(doc => doc.data() as Module);
          fetchedModules.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
          setModules(fetchedModules);
          setIsLoading(false);
        }, (error) => {
          console.error("Error connecting to Firebase:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Firebase connection failed", err);
        setIsLoading(false);
      }
    } else {
      // LocalStorage Fallback
      const saved = localStorage.getItem('lms_modules');
      if (saved) {
        setModules(JSON.parse(saved));
      } else {
        setModules(MOCK_MODULES);
      }
      setIsLoading(false);
    }
  }, []);

  // Helper to persist to LocalStorage (only used when db is null)
  const saveToLocalStorage = (newModules: Module[]) => {
    setModules(newModules);
    localStorage.setItem('lms_modules', JSON.stringify(newModules));
  };

  // Persist theme to CSS vars
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
      // Let error propagate to component for handling
      await setDoc(doc(db, 'modules', module.id), module);
    } else {
      const newModules = [module, ...modules];
      saveToLocalStorage(newModules);
    }
  };

  const updateModule = async (id: string, updatedData: Partial<Module>) => {
    if (db) {
      // Let error propagate to component for handling
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
        console.error("Error deleting module: ", error);
        alert("Failed to delete module.");
      }
    } else {
      const newModules = modules.filter(m => m.id !== id);
      saveToLocalStorage(newModules);
    }
  };

  const getModule = (id: string) => {
    return modules.find(m => m.id === id);
  };

  const incrementModuleView = async (id: string) => {
    if (db) {
      try {
        const moduleRef = doc(db, 'modules', id);
        await updateDoc(moduleRef, {
          'stats.views': increment(1)
        });
      } catch (error) {
        console.error("Error updating stats: ", error);
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
        // Delete existing
        modules.forEach(m => {
          const ref = doc(db!, 'modules', m.id);
          batch.delete(ref);
        });
        // Add Defaults
        MOCK_MODULES.forEach(m => {
          const ref = doc(db!, 'modules', m.id);
          batch.set(ref, m);
        });
        await batch.commit();
        alert("Database reset to default modules successfully.");
      } catch (error) {
        console.error("Error resetting database: ", error);
        alert("Failed to reset database.");
      }
    } else {
      saveToLocalStorage(MOCK_MODULES);
      alert("Local storage reset to default modules.");
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