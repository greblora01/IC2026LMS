
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { ModuleEditor } from './pages/ModuleEditor';
import { ModuleViewer } from './pages/ModuleViewer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { auth } = useAppContext();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && auth.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen theme-transition">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/create" element={
              <ProtectedRoute adminOnly>
                <ModuleEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/edit/:id" element={
              <ProtectedRoute adminOnly>
                <ModuleEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/view/:id" element={
              <ProtectedRoute>
                <ModuleViewer />
              </ProtectedRoute>
            } />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
