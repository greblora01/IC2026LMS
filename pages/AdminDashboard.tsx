
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, BarChart2, BookOpen, Eye, 
  Cloud, HardDrive, Settings, PlayCircle, X, Home, Tag, ShieldCheck, LogOut, Trash2, Key, Users
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Module, Slide, AccessCode, UserRole } from '../types';

// Helper component to render a slide preview
const SlidePreview: React.FC<{ slide: Slide; footerLeft?: string; footerRight?: string }> = ({ slide, footerLeft, footerRight }) => {
  const BASE_WIDTH = 960;
  const BASE_HEIGHT = 540;
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div 
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(0.8)`, 
          transformOrigin: 'top left',
          backgroundColor: slide.backgroundColor || '#ffffff',
          backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: 'cover'
        }}
        className="absolute top-0 left-0 pointer-events-none"
      >
         {slide.blocks?.map(block => (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                zIndex: block.zIndex || 1,
                transform: block.rotation ? `rotate(${block.rotation}deg)` : 'none',
                backgroundColor: block.style?.backgroundColor,
                borderRadius: block.style?.borderRadius ? `${block.style.borderRadius * 3}px` : undefined,
                opacity: block.style?.opacity,
                border: block.style?.borderWidth ? `${block.style.borderWidth * 3}px solid ${block.style.borderColor || '#000'}` : 'none',
                color: block.style?.color || 'inherit',
                fontSize: block.style?.fontSize ? `${block.style.fontSize * 3}px` : '42px',
                fontWeight: block.style?.fontWeight || 'normal',
                fontStyle: block.style?.fontStyle || 'normal',
                textDecoration: block.style?.textDecoration || 'none',
                fontFamily: block.style?.fontFamily || 'inherit'
              }}
              className="overflow-hidden"
            >
               {block.type === 'text' && (
                  <div 
                    className="w-full h-full p-2" 
                    dangerouslySetInnerHTML={{ __html: block.content }} 
                  />
               )}
               {block.type === 'plain-text' && (
                  <div className="w-full h-full p-2 whitespace-pre-wrap">{block.content}</div>
               )}
               {block.type === 'image' && block.content && (
                  <img src={block.content} className="w-full h-full object-cover" alt="" />
               )}
            </div>
         ))}
         
         <div className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] h-[12%] flex items-center justify-between px-10">
            <span className="text-white font-bold uppercase tracking-widest text-2xl">
              {footerLeft || 'VOLUNTEER TRAINING'}
            </span>
            <span className="text-white font-bold uppercase tracking-widest text-2xl">
              {footerRight || '2026 IC'}
            </span>
         </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { modules, accessCodes, isCloud, auth, logout, addAccessCode, deleteAccessCode } = useAppContext();
  const navigate = useNavigate();
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [showCodesTab, setShowCodesTab] = useState(false);
  
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');

  const getThumbnailSlide = (module: Module) => {
    if (module.thumbnailSlideId) {
      return module.slides.find(s => s.id === module.thumbnailSlideId) || module.slides[0];
    }
    return module.slides[0];
  };

  const handleAddCode = async () => {
    if (!newCode || !newLabel) return;
    const ac: AccessCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: newCode.toUpperCase(),
      label: newLabel,
      role: newRole,
      createdAt: Date.now()
    };
    await addAccessCode(ac);
    setNewCode('');
    setNewLabel('');
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6 text-left">
        <div className="w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Admin Portal</h1>
            <div className="flex items-center gap-2">
              <Link to="/" className="p-2 md:p-3 bg-white border rounded-xl md:rounded-2xl text-gray-400 hover:text-[var(--primary)] shadow-sm transition-all flex items-center gap-2 font-bold text-xs">
                <Home size={16} /> <span className="hidden sm:inline">Student Site</span>
              </Link>
              <button 
                onClick={logout}
                className="p-2 md:p-3 bg-red-50 border border-red-100 rounded-xl md:rounded-2xl text-red-400 hover:bg-red-500 hover:text-white shadow-sm transition-all flex items-center gap-2 font-bold text-xs"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          <p className="text-base md:text-xl text-gray-500 font-medium leading-tight">
            Welcome back, <span className="text-gray-900 font-bold">{auth.label}</span>.
          </p>
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] ${isCloud ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isCloud ? <><Cloud size={12} /> Cloud Active</> : <><HardDrive size={12} /> Local Storage</>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowCodesTab(!showCodesTab)}
            className={`px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center gap-3 md:gap-4 font-black text-sm md:text-xl transition-all shadow-xl active:scale-95 border-2 md:border-4 ${showCodesTab ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100 hover:border-[var(--primary)]'}`}
          >
            <Key size={24} /> {showCodesTab ? 'Close Codes' : 'Manage Access'}
          </button>
          {!showCodesTab && (
            <Link
              to="/create"
              className="bg-[var(--primary)] text-white px-6 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center gap-3 md:gap-4 font-black text-sm md:text-xl hover:opacity-95 transition-all shadow-2xl shadow-orange-200 active:scale-95"
            >
              <Plus size={24} strokeWidth={3} /> Create New
            </Link>
          )}
        </div>
      </div>

      {showCodesTab ? (
        <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* New Code Form */}
           <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-100 text-left">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-6 md:mb-8 flex items-center gap-3">
                 {/* Fixed: Removed md:size prop */}
                 <Key className="text-[var(--primary)]" size={28} /> Generate Access Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
                 <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Team Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hospitality Team" 
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-2xl font-bold text-sm outline-none focus:border-[var(--primary)]"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unique Code</label>
                    <input 
                      type="text" 
                      placeholder="ICPH2026-CODE" 
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-sm outline-none focus:border-[var(--primary)]"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Level</label>
                    <select 
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-2xl font-bold text-sm outline-none focus:border-[var(--primary)] cursor-pointer"
                    >
                       <option value="student">Student (Standard)</option>
                       <option value="admin">Administrator (Full)</option>
                    </select>
                 </div>
                 <button 
                  onClick={handleAddCode}
                  disabled={!newCode || !newLabel}
                  className="bg-gray-900 text-white p-4 md:p-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 h-fit"
                 >
                    Create Access Code
                 </button>
              </div>
           </div>

           {/* Codes List */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessCodes.sort((a,b) => b.createdAt - a.createdAt).map(ac => (
                <div key={ac.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex flex-col relative group overflow-hidden">
                   <div className={`absolute top-0 right-0 px-3 py-1.5 md:px-4 md:py-2 rounded-bl-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest ${ac.role === 'admin' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {ac.role}
                   </div>
                   <div className="mb-4 md:mb-6">
                      <h4 className="font-black text-xl md:text-2xl text-gray-900 mb-1 truncate pr-16">{ac.label}</h4>
                      <p className="text-gray-400 text-[10px] font-medium">Created {new Date(ac.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-2xl mb-6 md:mb-8 border border-gray-100 flex items-center justify-center">
                      <code className="text-xl md:text-2xl font-black text-[var(--primary)] tracking-[0.2em]">{ac.code}</code>
                   </div>
                   <button 
                    onClick={() => { if(confirm('Permanently revoke this access code?')) deleteAccessCode(ac.id); }}
                    className="w-full py-3 md:py-4 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 mt-auto"
                   >
                      Revoke Access
                   </button>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Analytics Summary */}
          <div className="col-span-full bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-12 shadow-xl border-2 md:border-4 border-[var(--primary)]/10 mb-4 md:mb-6 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-[var(--primary)]/5 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl"></div>
              <div className="flex-1 relative z-10 w-full">
                <h2 className="text-[9px] md:text-xs font-black text-[var(--primary)] uppercase tracking-[0.3em] md:tracking-[0.4em] mb-4 md:mb-6">Engagement Overview</h2>
                <div className="flex flex-wrap gap-8 md:gap-20">
                  <div>
                    <div className="text-4xl md:text-6xl font-black text-gray-900 tabular-nums">{modules.length}</div>
                    <div className="text-[9px] md:text-[11px] font-black text-gray-400 uppercase mt-1 tracking-widest">Total Modules</div>
                  </div>
                  <div className="w-px h-12 md:h-16 bg-gray-100 hidden sm:block"></div>
                  <div>
                    <div className="text-4xl md:text-6xl font-black text-gray-900 tabular-nums">{modules.reduce((acc, m) => acc + (m.stats?.completions || 0), 0)}</div>
                    <div className="text-[9px] md:text-[11px] font-black text-gray-400 uppercase mt-1 tracking-widest">Completions</div>
                  </div>
                </div>
              </div>
              <div className="w-20 h-20 md:w-28 md:h-28 bg-[var(--primary)] text-white rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-200 relative z-10 shrink-0">
                 <BarChart2 className="w-10 h-10 md:w-14 md:h-14" />
              </div>
          </div>

          {modules.length === 0 ? (
            <div className="col-span-full text-center py-20 md:py-40 bg-white rounded-3xl md:rounded-[4rem] border-4 border-dashed border-gray-100 px-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                 {/* Fixed: Removed md:size prop */}
                 <BookOpen size={32} className="text-gray-200" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-gray-800 mb-2 md:mb-4">Your library is empty</h3>
              <p className="text-sm md:text-xl text-gray-400 mb-8 md:mb-12 max-w-md mx-auto font-medium leading-relaxed">Ready to build something amazing? Start with a template or a blank canvas.</p>
              <Link to="/create" className="inline-flex bg-[var(--primary)] text-white px-10 md:px-14 py-4 md:py-6 rounded-xl md:rounded-[2.5rem] font-black text-base md:text-xl hover:opacity-95 shadow-2xl active:scale-95 transition-all">Get Started</Link>
            </div>
          ) : (
            modules.map((module) => (
              <div 
                key={module.id} 
                className="bg-white rounded-2xl md:rounded-[3rem] border-2 md:border-4 border-transparent hover:border-[var(--primary)]/20 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group relative transform hover:-translate-y-2 cursor-pointer"
                onClick={() => setActiveOverlayId(module.id)}
              >
                {/* Cover Image Area */}
                <div className="h-64 sm:h-80 md:h-96 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
                  {module.thumbnail ? (
                    <div className="w-full h-full overflow-hidden">
                      <img 
                        src={module.thumbnail} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={module.title} 
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full scale-[1.0] transition-transform duration-700 group-hover:scale-[1.02]">
                      <SlidePreview 
                          slide={getThumbnailSlide(module)} 
                          footerLeft={module.footerTextLeft} 
                          footerRight={module.footerTextRight} 
                      />
                    </div>
                  )}

                  {/* Integrated Card Overlay */}
                  <div className={`absolute inset-0 bg-black/60 backdrop-blur-md md:backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center p-6 md:p-12 gap-4 md:gap-6 z-40 ${activeOverlayId === module.id ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0'}`}>
                     <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/view/${module.id}`); }}
                        className="w-full max-w-[220px] md:max-w-xs bg-[var(--primary)] text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black flex items-center justify-center gap-2 md:gap-4 shadow-2xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-[0.1em] md:tracking-[0.2em] text-sm md:text-lg"
                     >
                        <PlayCircle className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} /> Preview
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/edit/${module.id}`); }}
                        className="w-full max-w-[220px] md:max-w-xs bg-white text-gray-900 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black flex items-center justify-center gap-2 md:gap-4 shadow-2xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-[0.1em] md:tracking-[0.2em] text-sm md:text-lg"
                     >
                        <Settings className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} /> Edit
                     </button>
                     
                     <button 
                        onClick={(e) => { e.stopPropagation(); setActiveOverlayId(null); }}
                        className="absolute top-4 md:top-8 right-4 md:right-8 text-white/40 hover:text-white transition-colors p-2"
                     >
                        {/* Fixed: Removed md:size prop */}
                        <X size={28} strokeWidth={3} />
                     </button>
                  </div>

                  <div className="absolute top-4 md:top-8 left-4 md:left-8 bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl px-3 py-1.5 md:px-5 md:py-2.5 text-[9px] md:text-[11px] font-black text-gray-800 shadow-2xl uppercase tracking-[0.2em] border border-white/50 border-l-4 border-l-[var(--primary)] z-10 flex items-center gap-1 md:gap-2">
                     <Tag size={10} className="text-[var(--primary)]" /> {module.category || 'UNCATEGORIZED'}
                  </div>
                </div>

                {/* Card Footer Content */}
                <div className="p-6 md:p-10 flex-1 text-left flex flex-col relative bg-white">
                  <div className="absolute top-0 right-6 md:right-10 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center text-[var(--primary)] border-2 border-gray-50 z-10">
                     <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="font-black text-xl md:text-3xl leading-tight text-gray-900 mb-2 md:mb-4 line-clamp-2 pr-10">{module.title}</h3>
                  <p className="text-gray-500 line-clamp-2 mb-6 md:mb-10 font-medium text-sm md:text-lg leading-relaxed flex-1">{module.description || 'Custom interactive training program'}</p>
                  <div className="flex items-center gap-4 md:gap-8 text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-auto">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                      <Eye size={14} className="text-[var(--primary)]" /> <span>{(module.stats?.views || 0)} <span className="hidden sm:inline">Views</span></span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl">
                      <Users size={14} className="text-[var(--primary)]" /> <span>{module.slides.length} <span className="hidden sm:inline">Lessons</span></span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
