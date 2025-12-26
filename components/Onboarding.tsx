import React, { useState, useEffect } from 'react';
import { UserContext, Language } from '../types';
import LanguageSelector from './LanguageSelector';
import { GraduationCap, User, ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: (context: UserContext) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDarkMode, toggleTheme }) => {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name, language });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-brand-50 dark:bg-slate-950 transition-colors duration-300">
       <div className="fixed inset-0 bg-grid-pattern opacity-[0.3]" />
      
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full glass-card hover:scale-110 transition-transform z-50 text-slate-600 dark:text-slate-300"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-brand-500/30 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>

      <div className={`relative w-full max-w-2xl transition-all duration-700 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] relative">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-brand-500 to-fuchsia-600 rounded-3xl shadow-lg shadow-brand-500/40 mb-6 animate-float">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Create Profile</h1>
            <p className="text-slate-500 dark:text-slate-400">Let's personalize your learning journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Language Selection */}
            <div className="space-y-2">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-brand-500" />
                 <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Choose Language</label>
               </div>
              <LanguageSelector selected={language} onSelect={setLanguage} />
            </div>

            {/* Name Input */}
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 text-center">What should we call you?</label>
              <div className="relative group max-w-sm mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-center font-bold text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full group relative flex items-center justify-center py-5 px-6 border border-transparent rounded-2xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 mt-4"
            >
              <span className="mr-2">Start Adventure</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;