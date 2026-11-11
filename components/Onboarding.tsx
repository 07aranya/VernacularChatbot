import React, { useState, useEffect } from 'react';
import { UserContext, Language } from '../types';
import LanguageSelector, { getLanguageGreeting } from './LanguageSelector';
import { GraduationCap, User, ArrowRight, ArrowLeft, Sun, Moon, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: (context: UserContext) => void;
  onBack?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBack, isDarkMode, toggleTheme }) => {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name: name.trim(), language });
    }
  };

  const greetingPreview = getLanguageGreeting(language);
  const displayName = name.trim() || 'Student';

  return (
    <div className="min-h-screen relative overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[480px] bg-brand-400/15 dark:bg-brand-500/10 rounded-full blur-[110px]" />
      </div>

      {/* Top Controls */}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between z-50 pointer-events-none">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="pointer-events-auto p-2.5 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div
        className={`w-full max-w-xl my-14 transition-all duration-500 transform relative z-10 ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="glass-panel p-6 sm:p-10 rounded-[2rem] relative">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-500 to-teal-600 rounded-2xl shadow-lg shadow-brand-500/30 mb-4 animate-float">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1.5 font-display">
              Set Up Your Study Profile
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Personalize your tutor language — you can pick your grade and board inside chat.
            </p>
          </div>

          {/* Live Greeting Preview */}
          <div className="mb-7 p-3.5 rounded-2xl bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/40 dark:to-slate-900/60 border border-brand-200/70 dark:border-brand-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  YourBuddy Greeting Preview
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {greetingPreview}, {displayName}! Ready to study in {language}?
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Name Input */}
            <div className="space-y-2.5">
              <label
                htmlFor="student-name"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Your Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  id="student-name"
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul, Priya, Aarav..."
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-semibold text-base"
                />
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Preferred Language
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  Selected: {language}
                </span>
              </div>
              <LanguageSelector selected={language} onSelect={setLanguage} />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full group flex items-center justify-center py-4 px-6 rounded-2xl text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg shadow-lg shadow-brand-600/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span className="mr-2">Start Learning</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
