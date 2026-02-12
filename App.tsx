import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { ModuleEditor } from './pages/ModuleEditor';
import { ModuleViewer } from './pages/ModuleViewer';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen theme-transition">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/create" element={<ModuleEditor />} />
            <Route path="/edit/:id" element={<ModuleEditor />} />
            <Route path="/view/:id" element={<ModuleViewer />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
