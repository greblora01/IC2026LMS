
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
      /* Fixed: Removed md:size prop */
      icon: <Users className="text-blue-600" size={28} />,
      bgColor: 'bg-blue-50',
      accentColor: 'border-blue-200'
    },
    { 
      code: 'CCVM', 
      title: 'Convention Committee Volunteers', 
      description: 'Specific training for committee members handling operational logistics.',
      /* Fixed: Removed md:size prop */
      icon: <Building2 className="text-purple-600" size={28} />,
      bgColor: 'bg-purple-50',
      accentColor: 'border-purple-200'
    },
    { 
      code: 'HCVM', 
      title: 'Hospitality Committee Volunteers', 
      description: 'Specialized training for providing exceptional care and support to delegates.',
      /* Fixed: Removed md:size prop */
      icon: <HeartHandshake className="text-orange-600" size={28} />,
      bgColor: 'bg-orange-50',
      accentColor: 'border-orange-200'
    }
  ];

  const filterModules = (code: string) => modules.filter(m => m.category === code);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-white border-b px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg">I</div>
          <span className="font-black text-lg md:text-xl tracking-tighter text-gray-900">ICPH2026</span>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="p-2 md:p-2.5 text-gray-400 hover:text-[var(--primary)] hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 font-bold text-xs md:text-sm"
        >
          <Settings size={16} /> <span className="hidden sm:inline">Admin Portal</span>
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10">
        {/* Welcome Hero */}
        <div className="text-center mb-12 md:mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex items-center justify-center mx-auto mb-6 md:mb-10 border border-gray-100 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)]">
               <ShieldCheck className="w-10 h-10 md:w-12 md:h-12" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-4 md:mb-6 leading-[1.2] md:leading-[1.1] px-2">
            Welcome to <br className="sm:hidden" /> <span className="text-[var(--primary)]">ICPH2026 LMS</span>
          </h1>
          <p className="text-base md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed px-4">
            Your centralized gateway for volunteer excellence. Access specialized training modules tailored to your specific role and team.
          </p>
        </div>

        {/* Category Containers */}
        <div className="space-y-20 md:space-y-32">
          {categories.map((cat) => {
            const catModules = filterModules(cat.code);
            return (
              <section key={cat.code} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6 border-b border-gray-100 pb-8 md:pb-10">
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-4 mb-3 md:mb-4">
                      <div className={`p-3 md:p-4 ${cat.bgColor} rounded-xl md:rounded-2xl shadow-sm border ${cat.accentColor}`}>
                        {cat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-[9px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] text-[var(--primary)]">Category Code</span>
                        <span className="font-black text-xl md:text-2xl text-gray-900">{cat.code}</span>
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tight mb-2 md:mb-4">{cat.title}</h2>
                    <p className="text-sm md:text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">{cat.description}</p>
                  </div>
                  <div className="bg-white px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl shadow-md border border-gray-100 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-1 min-w-[140px] md:min-w-[180px]">
                    <span className="text-xl md:text-3xl font-black text-[var(--primary)]">{catModules.length}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Modules Available</span>
                  </div>
                </div>

                {catModules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {catModules.map((module) => (
                      <div 
                        key={module.id} 
                        onClick={() => navigate(`/view/${module.id}`)}
                        className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-transparent hover:border-[var(--primary)]/30 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden transform hover:-translate-y-2 flex flex-col h-full"
                      >
                        <div className="aspect-[16/10] relative overflow-hidden bg-gray-50 border-b border-gray-50">
                          {module.thumbnail ? (
                            <img src={module.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={module.title} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2 md:gap-4">
                              <PlayCircle className="w-12 h-12 md:w-20 md:h-20" strokeWidth={1} />
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-50">Launch Module</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                            <div className="bg-white text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-base flex items-center gap-2 md:gap-3 shadow-2xl transform translate-y-4 md:translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                              <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" /> START LEARNING
                            </div>
                          </div>
                        </div>
                        <div className="p-6 md:p-10 text-left flex-1 flex flex-col">
                          <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-2 md:mb-4 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors duration-300">{module.title}</h3>
                          <p className="text-sm md:text-lg text-gray-500 font-medium line-clamp-2 mb-6 md:mb-8 leading-relaxed flex-1">
                            {module.description || 'No specialized description provided for this module.'}
                          </p>
                          <div className="flex items-center justify-between text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-t border-gray-50 pt-6 md:pt-8">
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--primary)]"></div>
                               <span>{module.slides.length} Lessons</span>
                            </div>
                            <span>Updated {new Date(module.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-4 border-dashed border-gray-100 rounded-[2.5rem] md:rounded-[4rem] py-16 md:py-32 flex flex-col items-center justify-center text-center px-6 md:px-10">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 md:mb-8">
                        {/* Fixed: Removed md:size prop */}
                        <BookOpen size={32} className="text-gray-100" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-gray-200 tracking-tighter mb-2 md:mb-4 uppercase">No Modules Categorized</h3>
                    <p className="text-sm md:text-xl text-gray-400 font-medium max-w-sm mx-auto">Courses for the <span className="text-[var(--primary)]">{cat.code}</span> category will appear here once published.</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20 md:mt-40 py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12 mb-10 md:mb-16">
            <div className="flex flex-col items-center md:items-start gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl">I</div>
                <span className="font-black text-xl md:text-2xl tracking-tighter text-gray-900">ICPH2026 LMS</span>
              </div>
              <p className="text-gray-400 font-medium text-center md:text-left max-w-xs text-sm md:text-base">Dedicated training platform for the International Convention Volunteers.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-10">
              <div className="flex flex-col gap-2 md:gap-4">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Navigation</span>
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-[var(--primary)] font-bold text-xs md:text-sm text-left">Admin Portal</button>
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-gray-600 hover:text-[var(--primary)] font-bold text-xs md:text-sm text-left">Top of Page</button>
              </div>
              <div className="flex flex-col gap-2 md:gap-4">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Resources</span>
                <a href="#" className="text-gray-600 hover:text-[var(--primary)] font-bold text-xs md:text-sm">Volunteer Guide</a>
                <a href="#" className="text-gray-600 hover:text-[var(--primary)] font-bold text-xs md:text-sm">Technical Support</a>
              </div>
            </div>
          </div>
          <div className="pt-8 md:pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              © 2026 International Convention Committee
            </div>
            <div className="flex gap-6 md:gap-8">
              {/* Fixed: Removed md:size prop */}
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Users size={18} /></a>
              {/* Fixed: Removed md:size prop */}
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><ShieldCheck size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
