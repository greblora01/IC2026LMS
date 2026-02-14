
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-100/30 rounded-full -mr-[20rem] -mt-[20rem] blur-[10rem] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-100/20 rounded-full -ml-[15rem] -mb-[15rem] blur-[8rem]"></div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] p-10 md:p-16 border border-gray-100 text-center">
          <div className="w-24 h-24 bg-[var(--primary)] rounded-[2rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-orange-200">
            <ShieldCheck size={48} strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
            Authorized Access
          </h1>
          <p className="text-gray-500 font-medium text-lg mb-12 max-w-xs mx-auto leading-relaxed">
            Please enter your unique access code to enter the ICPH2026 Learning Portal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input 
                type="text" 
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="Enter Access Code"
                className={`w-full p-6 bg-gray-50 border-2 rounded-3xl text-center text-xl font-black uppercase tracking-[0.2em] outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-[var(--primary)] focus:bg-white focus:shadow-xl'}`}
              />
              {error && (
                <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-500 font-bold text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} /> Invalid or Expired Access Code
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full bg-gray-900 text-white p-6 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Verify Access <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 pt-10 border-t border-gray-50 flex items-center justify-center gap-3 text-gray-300">
             <BookOpen size={20} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">ICPH2026 Secure Learning</span>
          </div>
        </div>
        
        <p className="mt-10 text-center text-gray-400 font-medium">
          Forgot your code? Contact your team lead or the ICPH support desk.
        </p>
      </div>
    </div>
  );
};
