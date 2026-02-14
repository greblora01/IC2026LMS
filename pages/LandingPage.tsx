
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { BookOpen, Users, Building2, HeartHandshake, Settings, PlayCircle, ShieldCheck } from 'lucide-react';
import { Module } from '../types';

export const LandingPage: React.FC = () => {
  const { modules } = useAppContext();
  const navigate = useNavigate();

  const categories = [
    { 
      code: 'GVM', 
      title: 'General Volunteers Modules', 
      description: 'Foundational training for all volunteers participating in ICPH2026.',
      icon: <Users className="text-blue-600" size={32} />,
      bgColor: 'bg-blue-50',
      accentColor: 'border-blue-200'
    },
    { 
      code: 'CCVM', 
      title: 'Convention Committee Volunteers', 
      description: 'Specific training for committee members handling operational logistics.',
      icon: <Building2 className="text-purple-600" size={32} />,
      bgColor: 'bg-purple-50',
      accentColor: 'border-purple-200'
    },
    { 
      code: 'HCVM', 
      title: 'Hospitality Committee Volunteers', 
      description: 'Specialized training for providing exceptional care and support to delegates.',
      icon: <HeartHandshake className="text-orange-600" size={32} />,
      bgColor: 'bg-orange-50',
      accentColor: 'border-orange-200'
    }
  ];

  const filterModules = (code: string) => modules.filter(m => m.category === code);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">I</div>
          <span className="font-black text-xl tracking-tighter text-gray-900">ICPH2026</span>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="p-2.5 text-gray-400 hover:text-[var(--primary)] hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
        >
          <Settings size={18} /> Admin Portal
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        {/* Welcome Hero */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mx-auto mb-10 border border-gray-100 relative group overflow-hidden">
            {/* Logo Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 w-20 h-20 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)]">
               <ShieldCheck size={48} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-[1.1]">
            Welcome to <span className="text-[var(--primary)]">ICPH2026 LMS</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Your centralized gateway for volunteer excellence. Access specialized training modules tailored to your specific role and team.
          </p>
        </div>

        {/* Category Containers */}
        <div className="space-y-32">
          {categories.map((cat) => {
            const catModules = filterModules(cat.code);
            return (
              <section key={cat.code} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-gray-100 pb-10">
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-4 ${cat.bgColor} rounded-2xl shadow-sm border ${cat.accentColor}`}>
                        {cat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-[0.4em] text-[var(--primary)]">Category Code</span>
                        <span className="font-black text-2xl text-gray-900">{cat.code}</span>
                      </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">{cat.title}</h2>
                    <p className="text-gray-500 font-medium text-xl max-w-2xl leading-relaxed">{cat.description}</p>
                  </div>
                  <div className="bg-white px-8 py-4 rounded-3xl shadow-md border border-gray-100 flex flex-col items-center justify-center min-w-[180px]">
                    <span className="text-3xl font-black text-[var(--primary)]">{catModules.length}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Modules Available</span>
                  </div>
                </div>

                {catModules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {catModules.map((module) => (
                      <div 
                        key={module.id} 
                        onClick={() => navigate(`/view/${module.id}`)}
                        className="bg-white rounded-[3rem] border-2 border-transparent hover:border-[var(--primary)]/30 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden transform hover:-translate-y-3 flex flex-col h-full"
                      >
                        <div className="aspect-[16/10] relative overflow-hidden bg-gray-50 border-b border-gray-50">
                          {module.thumbnail ? (
                            <img src={module.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={module.title} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-4">
                              <PlayCircle size={80} strokeWidth={1} />
                              <span className="text-xs font-black uppercase tracking-widest opacity-50">Launch Module</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                            <div className="bg-white text-gray-900 px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-3 shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                              <PlayCircle size={24} className="text-[var(--primary)]" /> START LEARNING
                            </div>
                          </div>
                        </div>
                        <div className="p-10 text-left flex-1 flex flex-col">
                          <h3 className="text-2xl font-black text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors duration-300">{module.title}</h3>
                          <p className="text-gray-500 font-medium text-lg line-clamp-2 mb-8 leading-relaxed flex-1">
                            {module.description || 'No specialized description provided for this module.'}
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-t border-gray-50 pt-8">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
                               <span>{module.slides.length} Lessons</span>
                            </div>
                            <span>Updated {new Date(module.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-4 border-dashed border-gray-100 rounded-[4rem] py-32 flex flex-col items-center justify-center text-center px-10">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                        <BookOpen size={48} className="text-gray-100" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-200 tracking-tighter mb-4 uppercase">No Modules Categorized</h3>
                    <p className="text-gray-400 font-medium text-xl max-w-sm mx-auto">Courses for the <span className="text-[var(--primary)]">{cat.code}</span> category will appear here once published by the administrator.</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-40 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xl">I</div>
                <span className="font-black text-2xl tracking-tighter text-gray-900">ICPH2026 LMS</span>
              </div>
              <p className="text-gray-400 font-medium text-center md:text-left max-w-xs">Dedicated training platform for the International Convention Volunteers.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Navigation</span>
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-[var(--primary)] font-bold text-sm text-left">Admin Portal</button>
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-gray-600 hover:text-[var(--primary)] font-bold text-sm text-left">Top of Page</button>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Resources</span>
                <a href="#" className="text-gray-600 hover:text-[var(--primary)] font-bold text-sm">Volunteer Guide</a>
                <a href="#" className="text-gray-600 hover:text-[var(--primary)] font-bold text-sm">Technical Support</a>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-400 text-xs font-black uppercase tracking-widest">
              © 2026 International Convention Committee
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Users size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><ShieldCheck size={20} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
