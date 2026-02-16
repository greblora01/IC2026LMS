
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ArrowRight, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { Philippines2026Logo } from './LandingPage';

export const LoginPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const success = await login(code);
      if (success) {
        navigate('/');
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6 relative overflow-hidden text-left">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[20rem] md:w-[40rem] h-[20rem] md:h-[40rem] bg-orange-100/30 rounded-full -mr-[10rem] md:-mr-[20rem] -mt-[10rem] md:-mt-[20rem] blur-[5rem] md:blur-[10rem] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[15rem] md:w-[30rem] h-[15rem] md:h-[30rem] bg-blue-100/20 rounded-full -ml-[8rem] md:-ml-[15rem] -mb-[8rem] md:-mb-[15rem] blur-[4rem] md:blur-[8rem]"></div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] p-8 md:p-16 border border-gray-100 text-center">
          <div className="w-24 h-24 md:w-36 md:h-36 bg-white rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl border border-gray-50 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-white opacity-50"></div>
             <Philippines2026Logo className="w-20 h-20 md:w-32 md:h-32 relative z-10" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-3 md:mb-4">
            Authorized Access
          </h1>
          <p className="text-sm md:text-lg text-gray-500 font-medium mb-8 md:mb-12 max-w-xs mx-auto leading-relaxed">
            Please enter your unique access code to enter the ICPH2026 Learning Portal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="relative group">
              <input 
                type="text" 
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="Enter Code"
                className={`w-full p-5 md:p-6 bg-gray-50 border-2 rounded-2xl md:rounded-3xl text-center text-lg md:text-xl font-black uppercase tracking-[0.2em] outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-[var(--primary)] focus:bg-white focus:shadow-xl'}`}
              />
              {error && (
                <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 text-red-500 font-bold text-xs animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={14} /> Invalid or Expired Access Code
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full bg-gray-900 text-white p-5 md:p-6 rounded-2xl md:rounded-3xl font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Verify Access <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-gray-50 flex items-center justify-center gap-3 text-gray-300">
             <BookOpen size={16} />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">ICPH2026 Secure Learning</span>
          </div>
        </div>
        
        <p className="mt-8 md:mt-10 text-center text-gray-400 font-medium text-xs md:text-base">
          Forgot your code? Contact your team lead.
        </p>
      </div>
    </div>
  );
};
