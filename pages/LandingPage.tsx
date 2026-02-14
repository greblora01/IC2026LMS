
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { BookOpen, Users, Building2, HeartHandshake, Settings, PlayCircle } from 'lucide-react';
import { Module } from '../types';

export const LandingPage: React.FC = () => {
  const { modules } = useAppContext();
  const navigate = useNavigate();

  const categories = [
    { 
      code: 'GVM', 
      title: 'General Volunteers Modules', 
      description: 'Foundational training for all volunteers participating in ICPH2026.',
      icon: <Users className="text-blue-500" size={32} />,
      bgColor: 'bg-blue-50'
    },
    { 
      code: 'CCVM', 
      title: 'Convention Committee Volunteers', 
      description: 'Specific training for committee members handling operational logistics.',
      icon: <Building2 className="text-purple-500" size={32} />,
      bgColor: 'bg-purple-50'
    },
    { 
      code: 'HCVM', 
      title: 'Hospitality Committee Volunteers', 
      description: 'Specialized training for providing exceptional care and support to delegates.',
      icon: <HeartHandshake className="text-orange-500" size={32} />,
      bgColor: 'bg-orange-50'
    }
  ];

  const filterModules = (code: string) => modules.filter(m => m.category === code);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">L</div>
          <span className="font-black text-xl tracking-tighter text-gray-900">ICPH2026 LMS</span>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="p-2 text-gray-400 hover:text-[var(--primary)] hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
        >
          <Settings size={18} /> Admin Access
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        {/* Welcome Hero */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
            {/* Logo Placeholder */}
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
              <BookOpen size={32} />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4">
            Welcome to <span className="text-[var(--primary)]">ICPH2026 LMS</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Empowering our volunteers with the knowledge and skills to make the 2026 International Convention a world-class success.
          </p>
        </div>

        {/* Category Containers */}
        <div className="space-y-20">
          {categories.map((cat) => {
            const catModules = filterModules(cat.code);
            return (
              <section key={cat.code} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-4 ${cat.bgColor} rounded-2xl shadow-sm`}>
                        {cat.icon}
                      </div>
                      <span className="font-black text-sm uppercase tracking-[0.3em] text-[var(--primary)]">{cat.code}</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{cat.title}</h2>
                    <p className="text-gray-500 font-medium text-lg max-w-xl">{cat.description}</p>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 font-black text-sm text-gray-400">
                    {catModules.length} AVAILABLE COURSES
                  </div>
                </div>

                {catModules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {catModules.map((module) => (
                      <div 
                        key={module.id} 
                        onClick={() => navigate(`/view/${module.id}`)}
                        className="bg-white rounded-[2.5rem] border-2 border-transparent hover:border-[var(--primary)]/20 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col h-full"
                      >
                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                          {module.thumbnail ? (
                            <img src={module.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={module.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <PlayCircle size={64} strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white text-[var(--primary)] px-6 py-3 rounded-2xl font-black flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              <PlayCircle size={20} /> START LEARNING
                            </div>
                          </div>
                        </div>
                        <div className="p-8 text-left flex-1 flex flex-col">
                          <h3 className="text-2xl font-black text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors">{module.title}</h3>
                          <p className="text-gray-500 font-medium text-base line-clamp-2 mb-6 leading-relaxed flex-1">
                            {module.description || 'No description provided for this module.'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 border-t pt-6">
                            <span>{module.slides.length} SLIDES</span>
                            <span>LAST UPDATED {new Date(module.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-4 border-dashed border-gray-100 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center">
                    <BookOpen size={64} className="text-gray-100 mb-6" />
                    <h3 className="text-2xl font-black text-gray-300">NO MODULES YET</h3>
                    <p className="text-gray-400 font-medium mt-2">New courses for this category are coming soon.</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-32 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-black text-base">L</div>
            <span className="font-black text-lg tracking-tighter text-gray-400">ICPH2026 LMS</span>
          </div>
          <div className="text-gray-400 text-sm font-medium">
            © 2026 ICPH. All rights reserved. Professional Learning Management System.
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-[var(--primary)] font-bold text-sm">Admin Portal</button>
            <a href="#" className="text-gray-400 hover:text-[var(--primary)] font-bold text-sm">Support</a>
            <a href="#" className="text-gray-400 hover:text-[var(--primary)] font-bold text-sm">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
