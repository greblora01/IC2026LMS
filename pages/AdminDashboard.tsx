
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
    <div className="w-full h-full relative overflow-hidden bg-white text-left">
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
               {block.type === 'svg' && block.content && (
                  <div className="w-full h-full flex items-center justify-center p-2" dangerouslySetInnerHTML={{ __html: block.content }} />
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
    <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen text-left">
      {/* Header Row */}
      <div className="flex flex-row justify-between items-center mb-2">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter whitespace-nowrap">Admin Portal</h1>
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 md:p-3 bg-white border rounded-xl md:rounded-2xl text-gray-400 hover:text-[var(--primary)] shadow-sm transition-all flex items-center gap-2 font-bold text-xs whitespace-nowrap">
            <Home size={14} /> <span className="hidden sm:inline">Student Site</span>
          </Link>
          <button 
            onClick={() => setShowCodesTab(!showCodesTab)}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all shadow-sm border-2 ${showCodesTab ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-100 hover:border-[var(--primary)]'}`}
          >
            <Key size={14} /> {showCodesTab ? 'Close Access' : 'Access Codes'}
          </button>
          <button 
            onClick={logout}
            className="p-2 md:p-3 bg-red-50 border border-red-100 rounded-xl md:rounded-2xl text-red-400 hover:bg-red-500 hover:text-white shadow-sm transition-all flex items-center gap-2 font-bold text-xs whitespace-nowrap"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Welcome Row */}
      <div className="flex items-center gap-3 mb-8 md:mb-12">
        <p className="text-sm md:text-lg text-gray-400 font-medium whitespace-nowrap">
          Welcome, <span className="text-gray-900 font-bold">{auth.label}</span>
        </p>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${isCloud ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isCloud ? <Cloud size={10} /> : <HardDrive size={10} />} {isCloud ? 'Cloud' : 'Local'}
        </div>
      </div>

      {showCodesTab ? (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* New Code Form */}
           <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100 text-left">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter mb-4 md:mb-6 flex items-center gap-3">
                 <Key className="text-[var(--primary)]" size={24} /> Generate Access Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                 <div className="space-y-1">
                    <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Team Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hospitality Team" 
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      className="w-full p-2.5 md:p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-xs outline-none focus:border-[var(--primary)]"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Unique Code</label>
                    <input 
                      type="text" 
                      placeholder="ICPH2026-CODE" 
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      className="w-full p-2.5 md:p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-black uppercase tracking-widest text-xs outline-none focus:border-[var(--primary)]"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Level</label>
                    <select 
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as UserRole)}
                      className="w-full p-2.5 md:p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-xs outline-none focus:border-[var(--primary)] cursor-pointer"
                    >
                       <option value="student">Student (Standard)</option>
                       <option value="admin">Administrator (Full)</option>
                    </select>
                 </div>
                 <button 
                  onClick={handleAddCode}
                  disabled={!newCode || !newLabel}
                  className="bg-gray-900 text-white p-3 md:p-4 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 h-fit"
                 >
                    Create Access Code
                 </button>
              </div>
           </div>

           {/* Codes List */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessCodes.sort((a,b) => b.createdAt - a.createdAt).map(ac => (
                <div key={ac.id} className="bg-white p-5 md:p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col relative group overflow-hidden">
                   <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl font-black text-[7px] md:text-[8px] uppercase tracking-widest ${ac.role === 'admin' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {ac.role}
                   </div>
                   <div className="mb-3 md:mb-4">
                      <h4 className="font-black text-lg md:text-xl text-gray-900 mb-0.5 truncate pr-12">{ac.label}</h4>
                      <p className="text-gray-400 text-[8px] font-medium uppercase">Created {new Date(ac.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div className="bg-gray-50 p-3 md:p-4 rounded-xl mb-4 md:mb-5 border border-gray-100 flex items-center justify-center">
                      <code className="text-lg md:text-xl font-black text-[var(--primary)] tracking-[0.2em]">{ac.code}</code>
                   </div>
                   <button 
                    onClick={() => { if(confirm('Permanently revoke this access code?')) deleteAccessCode(ac.id); }}
                    className="w-full py-2.5 text-red-500 font-black text-[9px] uppercase tracking-widest bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                   >
                      Revoke Access
                   </button>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Analytics & Creation Combined Row */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mb-4">
              {/* Analytics Summary */}
              <div className="flex-1 bg-white rounded-3xl p-6 md:p-10 shadow-xl border-2 md:border-4 border-[var(--primary)]/10 text-left relative overflow-hidden flex flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-[var(--primary)]/5 rounded-full -mr-16 md:-mr-32 -mt-16 md:-mt-32 blur-3xl"></div>
                  <div className="flex-1 relative z-10 w-full">
                    <h2 className="text-[8px] md:text-xs font-black text-[var(--primary)] uppercase tracking-[0.2em] md:tracking-[0.4em] mb-3 md:mb-4">Engagement Overview</h2>
                    <div className="flex flex-row gap-6 md:gap-12">
                      <div>
                        <div className="text-3xl md:text-5xl font-black text-gray-900 tabular-nums">{modules.length}</div>
                        <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Modules</div>
                      </div>
                      <div className="w-px h-10 md:h-12 bg-gray-100"></div>
                      <div>
                        <div className="text-3xl md:text-5xl font-black text-gray-900 tabular-nums">{modules.reduce((acc, m) => acc + (m.stats?.completions || 0), 0)}</div>
                        <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Completions</div>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl md:rounded-[2rem] flex items-center justify-center relative z-10 shrink-0">
                    <BarChart2 className="w-8 h-8 md:w-12 md:h-12" />
                  </div>
              </div>

              {/* Create New Action Card */}
              <Link
                to="/create"
                className="lg:w-80 bg-[var(--primary)] text-white p-6 md:p-10 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Plus size={36} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <span className="block font-black text-lg uppercase tracking-[0.1em]">Create New</span>
                  <span className="block text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Add Training Module</span>
                </div>
              </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {modules.length === 0 ? (
              <div className="col-span-full text-center py-20 md:py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 px-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <BookOpen size={28} className="text-gray-200" />
                </div>
                <h3 className="text-xl md:text-3xl font-black text-gray-800 mb-2">Your library is empty</h3>
                <p className="text-xs md:text-lg text-gray-400 mb-8 max-w-sm mx-auto font-medium leading-relaxed">Ready to build something amazing? Start with a template or a blank canvas.</p>
                <Link to="/create" className="inline-flex bg-[var(--primary)] text-white px-10 py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:opacity-95 shadow-xl active:scale-95 transition-all">Get Started</Link>
              </div>
            ) : (
              modules.map((module) => (
                <div 
                  key={module.id} 
                  className="bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 md:border-4 border-transparent hover:border-[var(--primary)]/20 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col overflow-hidden group relative transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => setActiveOverlayId(module.id)}
                >
                  {/* Cover Image Area */}
                  <div className="h-56 sm:h-64 md:h-72 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
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
                    <div className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 flex flex-col items-center justify-center p-6 gap-3 md:gap-4 z-40 ${activeOverlayId === module.id ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0'}`}>
                       <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/view/${module.id}`); }}
                          className="w-full max-w-[180px] md:max-w-[220px] bg-[var(--primary)] text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 md:gap-3 shadow-xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest text-xs md:text-sm"
                       >
                          <PlayCircle className="w-5 h-5 md:w-6 md:h-6" /> Preview
                       </button>
                       <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/edit/${module.id}`); }}
                          className="w-full max-w-[180px] md:max-w-[220px] bg-white text-gray-900 py-3 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 md:gap-3 shadow-xl hover:scale-[1.05] active:scale-95 transition-all uppercase tracking-widest text-xs md:text-sm"
                       >
                          <Settings className="w-5 h-5 md:w-6 md:h-6" /> Edit
                       </button>
                       
                       <button 
                          onClick={(e) => { e.stopPropagation(); setActiveOverlayId(null); }}
                          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
                       >
                          <X size={20} strokeWidth={3} />
                       </button>
                    </div>

                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-lg md:rounded-xl px-2.5 py-1.5 text-[8px] md:text-[9px] font-black text-gray-800 shadow-xl uppercase tracking-widest border border-white/50 border-l-4 border-l-[var(--primary)] z-10 flex items-center gap-1.5">
                       <Tag size={10} className="text-[var(--primary)]" /> {module.category || 'UNCATEGORIZED'}
                    </div>
                  </div>

                  {/* Card Footer Content */}
                  <div className="p-5 md:p-8 flex-1 text-left flex flex-col relative bg-white">
                    <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-[var(--primary)] border-2 border-gray-50 z-10">
                       <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="font-black text-lg md:text-2xl leading-tight text-gray-900 mb-2 line-clamp-2 pr-8">{module.title}</h3>
                    <p className="text-gray-500 line-clamp-2 mb-4 md:mb-6 font-medium text-xs md:text-base leading-relaxed flex-1">{module.description || 'Custom interactive training program'}</p>
                    <div className="flex items-center gap-4 md:gap-6 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 mt-auto">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg">
                        <Eye size={12} className="text-[var(--primary)]" /> <span>{(module.stats?.views || 0)} <span className="hidden sm:inline">Views</span></span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg">
                        <Users size={12} className="text-[var(--primary)]" /> <span>{module.slides.length} <span className="hidden sm:inline">Lessons</span></span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
