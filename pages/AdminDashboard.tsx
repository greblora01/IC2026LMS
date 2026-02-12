import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ExternalLink, BarChart2, BookOpen, Share2, Eye, Image as ImageIcon, Download, Globe, ArrowRight, RefreshCw, Import, Cloud, HardDrive, UploadCloud, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import { Module } from '../types';

export const AdminDashboard: React.FC = () => {
  const { modules, deleteModule, resetToDefaults, addModule, isCloud } = useAppContext();
  const navigate = useNavigate();
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [shareModuleId, setShareModuleId] = useState<string | null>(null);

  const handleExport = (module: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(module, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${module.title.replace(/\s+/g, '_')}_module.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadRemote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl) return;
    navigate(`/view/external?url=${encodeURIComponent(remoteUrl)}`);
  };

  const handleImportRemote = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!remoteUrl) return;
    
    setIsImporting(true);
    try {
      const response = await fetch(remoteUrl);
      if (!response.ok) throw new Error('Failed to fetch module');
      
      const moduleData: Module = await response.json();
      
      // Basic validation
      if (!moduleData.id || !moduleData.title || !moduleData.slides) {
        throw new Error('Invalid module format. JSON must contain id, title, and slides.');
      }
      
      // Ensure ID is unique or regenerate it
      const existing = modules.find(m => m.id === moduleData.id);
      if (existing) {
        if (!confirm(`A module with ID "${moduleData.id}" already exists. Overwrite?`)) {
          setIsImporting(false);
          return;
        }
      }
      
      // Update timestamp
      moduleData.lastUpdated = Date.now();
      
      await addModule(moduleData);
      alert('Module imported successfully!');
      setRemoteUrl(''); // Clear input
    } catch (error) {
      console.error(error);
      alert('Error importing module: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to generate the student link
  const getStudentLink = (id: string) => {
    return `${window.location.origin}/view/${id}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Share Dialog */}
      {shareModuleId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><Share2 size={20} /> Share Module</h3>
              <button onClick={() => setShareModuleId(null)} className="text-gray-400 hover:text-gray-800"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Share this link with your students. They can access the module directly.</p>
            
            <div className="flex gap-2 mb-6">
              <input 
                readOnly 
                value={getStudentLink(shareModuleId)} 
                className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getStudentLink(shareModuleId));
                  alert('Copied to clipboard!');
                }}
                className="bg-[var(--primary)] text-white px-4 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                Copy
              </button>
            </div>
            
            <div className="flex justify-end">
                <button onClick={() => setShareModuleId(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="opacity-70">Manage your learning modules and track progress.</p>
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-bold ${isCloud ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {isCloud ? (
              <>
                <Cloud size={14} /> Connected to Cloud (Shared)
              </>
            ) : (
              <>
                <HardDrive size={14} /> Local Storage (Private)
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => { if(confirm('This will replace all current modules with the default set from the code. Continue?')) resetToDefaults() }}
            className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-300 transition-colors"
            title="Reset/Initialize with Default Modules"
          >
            <RefreshCw size={20} />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <ThemeCustomizer />
          <Link
            to="/create"
            className="bg-[var(--primary)] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={20} />
            Create Module
          </Link>
        </div>
      </div>

      {/* Load Remote Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Globe size={20} className="text-[var(--primary)]" /> 
          Load External Module from GitHub
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste a <strong>Raw JSON URL</strong> from GitHub (click "Raw" on the file in GitHub) to view or import.
        </p>
        <form onSubmit={handleLoadRemote} className="flex gap-2 flex-col md:flex-row">
          <input 
            type="url" 
            placeholder="https://raw.githubusercontent.com/username/repo/main/module.json" 
            className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)]"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2 whitespace-nowrap">
              View Only <ArrowRight size={16} />
            </button>
            <button 
              type="button" 
              onClick={handleImportRemote}
              disabled={isImporting || !remoteUrl}
              className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import to Library'} <Import size={16} />
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Stats Card */}
        <div className="col-span-1 md:col-span-2 bg-[var(--primary)] text-white rounded-xl p-6 shadow-lg mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold opacity-90">Overview</h2>
              <div className="flex gap-8 mt-4">
                <div>
                  <div className="text-3xl font-bold">{modules.length}</div>
                  <div className="text-sm opacity-80">Total Modules</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{modules.reduce((acc, m) => acc + m.stats.views, 0)}</div>
                  <div className="text-sm opacity-80">Total Views</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{modules.reduce((acc, m) => acc + m.stats.completions, 0)}</div>
                  <div className="text-sm opacity-80">Completions</div>
                </div>
              </div>
            </div>
            <BarChart2 size={64} className="opacity-20" />
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-60">
            <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-medium">No modules yet</h3>
            <p className="mb-6">Your library is empty. You can create a new module or load the default examples.</p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={resetToDefaults}
                className="bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 shadow-lg flex items-center gap-2 animate-bounce"
              >
                <UploadCloud size={20} />
                Upload Default Courses {isCloud ? 'to Firebase' : 'to Local'}
              </button>
              <Link
                to="/create"
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={20} />
                Create New
              </Link>
            </div>
          </div>
        ) : (
          modules.map((module) => (
            <div key={module.id} className="bg-[var(--card-bg)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
              {/* Thumbnail Image */}
              <div className="h-48 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
                {module.thumbnail ? (
                  <img 
                    src={module.thumbnail} 
                    alt={module.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={48} className="opacity-30" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-mono text-gray-600 shadow-sm">
                   {new Date(module.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">{module.title}</h3>
                </div>
                <p className="text-sm opacity-70 line-clamp-3 mb-4">{module.description}</p>
                
                <div className="flex gap-4 text-xs opacity-60 font-medium">
                  <span className="flex items-center gap-1">
                    <ExternalLink size={12} /> {module.stats.views} Views
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart2 size={12} /> {module.stats.completions} Completed
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex gap-1">
                  <button
                    onClick={() => setShareModuleId(module.id)}
                    className="p-2 text-gray-500 hover:text-[var(--primary)] transition-colors"
                    title="Share Link"
                  >
                    <Share2 size={18} />
                  </button>
                  <Link
                    to={`/view/${module.id}`}
                    className="p-2 text-gray-500 hover:text-[var(--primary)] transition-colors"
                    title="View as Student"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => handleExport(module)}
                    className="p-2 text-gray-500 hover:text-[var(--primary)] transition-colors"
                    title="Export JSON"
                  >
                    <Download size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/edit/${module.id}`}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this module?')) deleteModule(module.id);
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};