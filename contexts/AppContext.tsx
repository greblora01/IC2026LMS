
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Module, Theme, AccessCode, AuthStatus, UserRole } from '../types';
import { DEFAULT_THEME, MOCK_MODULES } from '../constants';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';

interface AppContextType {
  modules: Module[];
  accessCodes: AccessCode[];
  theme: Theme;
  isCloud: boolean;
  isLoading: boolean;
  auth: AuthStatus;
  updateTheme: (newTheme: Partial<Theme>) => void;
  addModule: (module: Module) => Promise<void>;
  updateModule: (id: string, module: Partial<Module>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  getModule: (id: string) => Module | undefined;
  incrementModuleView: (id: string) => Promise<void>;
  incrementModuleCompletion: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  // Auth & Access Code Methods
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  addAccessCode: (accessCode: AccessCode) => Promise<void>;
  deleteAccessCode: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isCloud = !!db; 
  
  const [auth, setAuth] = useState<AuthStatus>(() => {
    try {
      const saved = localStorage.getItem('icph_auth');
      return saved ? JSON.parse(saved) : { isAuthenticated: false, role: null, label: null };
    } catch (e) {
      return { isAuthenticated: false, role: null, label: null };
    }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('lms_theme');
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
    } catch (e) {
      return DEFAULT_THEME;
    }
  });

  // Fetch Modules
  useEffect(() => {
    setIsLoading(true);
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'modules'), (snapshot) => {
        const fetchedModules = snapshot.docs.map(doc => ({ ...doc.data() } as Module));
        fetchedModules.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
        setModules(fetchedModules);
        setIsLoading(false);
      }, (error) => {
        console.error("Firebase connection error or timeout:", error);
        const saved = localStorage.getItem('lms_modules');
        if (saved) setModules(JSON.parse(saved));
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('lms_modules');
      setModules(saved ? JSON.parse(saved) : MOCK_MODULES);
      setIsLoading(false);
    }
  }, []);

  // Fetch Access Codes
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, 'access_codes'), (snapshot) => {
        const fetchedCodes = snapshot.docs.map(doc => ({ ...doc.data() } as AccessCode));
        // Ensure default admin code exists in cloud if list is empty
        if (fetchedCodes.length === 0) {
           const defaultAdmin = { id: 'admin-root', code: 'SAVMT001', role: 'admin' as UserRole, label: 'Super Admin', createdAt: Date.now() };
           setDoc(doc(db, 'access_codes', defaultAdmin.id), defaultAdmin);
        }
        setAccessCodes(fetchedCodes);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('icph_access_codes');
      if (saved) {
        setAccessCodes(JSON.parse(saved));
      } else {
        // Default admin code for local testing if none exists
        const defaultAdmin = { id: 'admin-root', code: 'SAVMT001', role: 'admin' as UserRole, label: 'Super Admin', createdAt: Date.now() };
        setAccessCodes([defaultAdmin]);
        localStorage.setItem('icph_access_codes', JSON.stringify([defaultAdmin]));
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('icph_auth', JSON.stringify(auth));
  }, [auth]);

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
    if (db) await setDoc(doc(db, 'modules', module.id), { ...module });
    else {
      const next = [module, ...modules];
      setModules(next);
      localStorage.setItem('lms_modules', JSON.stringify(next));
    }
  };

  const updateModule = async (id: string, updatedData: Partial<Module>) => {
    if (db) await updateDoc(doc(db, 'modules', id), { ...updatedData, lastUpdated: Date.now() });
    else {
      const next = modules.map(m => m.id === id ? { ...m, ...updatedData, lastUpdated: Date.now() } : m);
      setModules(next);
      localStorage.setItem('lms_modules', JSON.stringify(next));
    }
  };

  const deleteModule = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'modules', id));
    else {
      const next = modules.filter(m => m.id !== id);
      setModules(next);
      localStorage.setItem('lms_modules', JSON.stringify(next));
    }
  };

  const login = async (inputCode: string): Promise<boolean> => {
    const match = accessCodes.find(ac => ac.code === inputCode.trim());
    if (match) {
      setAuth({
        isAuthenticated: true,
        role: match.role,
        label: match.label
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, label: null });
  };

  const addAccessCode = async (accessCode: AccessCode) => {
    if (db) await setDoc(doc(db, 'access_codes', accessCode.id), { ...accessCode });
    else {
      const next = [...accessCodes, accessCode];
      setAccessCodes(next);
      localStorage.setItem('icph_access_codes', JSON.stringify(next));
    }
  };

  const deleteAccessCode = async (id: string) => {
    if (db) await deleteDoc(doc(db, 'access_codes', id));
    else {
      const next = accessCodes.filter(ac => ac.id !== id);
      setAccessCodes(next);
      localStorage.setItem('icph_access_codes', JSON.stringify(next));
    }
  };

  const getModule = useCallback((id: string) => modules.find(m => m.id === id), [modules]);

  const incrementModuleView = async (id: string) => {
    if (db) await updateDoc(doc(db, 'modules', id), { 'stats.views': increment(1) });
    else {
      const next = modules.map(m => m.id === id ? { ...m, stats: { ...m.stats, views: (m.stats.views || 0) + 1 } } : m);
      setModules(next);
      localStorage.setItem('lms_modules', JSON.stringify(next));
    }
  };

  const incrementModuleCompletion = async (id: string) => {
    if (db) await updateDoc(doc(db, 'modules', id), { 'stats.completions': increment(1) });
    else {
      const next = modules.map(m => m.id === id ? { ...m, stats: { ...m.stats, completions: (m.stats.completions || 0) + 1 } } : m);
      setModules(next);
      localStorage.setItem('lms_modules', JSON.stringify(next));
    }
  };

  const resetToDefaults = async () => {
    if (db) {
      const batch = writeBatch(db);
      modules.forEach(m => batch.delete(doc(db!, 'modules', m.id)));
      MOCK_MODULES.forEach(m => batch.set(doc(db!, 'modules', m.id), { ...m }));
      await batch.commit();
    } else {
      setModules(MOCK_MODULES);
      localStorage.setItem('lms_modules', JSON.stringify(MOCK_MODULES));
    }
  };

  return (
    <AppContext.Provider value={{
      modules,
      accessCodes,
      theme,
      isCloud,
      isLoading,
      auth,
      updateTheme,
      addModule,
      updateModule,
      deleteModule,
      getModule,
      incrementModuleView,
      incrementModuleCompletion,
      resetToDefaults,
      login,
      logout,
      addAccessCode,
      deleteAccessCode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
