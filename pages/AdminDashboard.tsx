import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ExternalLink, BarChart2, BookOpen, Copy, Eye, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { ThemeCustomizer } from '../components/ThemeCustomizer';

export const AdminDashboard: React.FC = () => {
  const { modules, deleteModule } = useAppContext();

  const copyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/view/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="opacity-70">Manage your learning modules and track progress.</p>
        </div>
        <div className="flex gap-3">
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
            <p>Click "Create Module" to get started.</p>
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
                    onClick={() => copyLink(module.id)}
                    className="p-2 text-gray-500 hover:text-[var(--primary)] transition-colors"
                    title="Copy Student Link"
                  >
                    <Copy size={18} />
                  </button>
                  <Link
                    to={`/view/${module.id}`}
                    className="p-2 text-gray-500 hover:text-[var(--primary)] transition-colors"
                    title="View as Student"
                  >
                    <Eye size={18} />
                  </Link>
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