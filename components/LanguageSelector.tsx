import React from 'react';
import { Check } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  selected: Language;
  onSelect: (lang: Language) => void;
}

export const getLanguageGreeting = (lang: Language): string => {
  switch (lang) {
    case Language.HINDI:
      return 'नमस्ते';
    case Language.MARATHI:
      return 'नमस्कार';
    case Language.TELUGU:
      return 'నమస్కారం';
    case Language.TAMIL:
      return 'வணக்கம்';
    case Language.BENGALI:
      return 'নমস্কার';
    case Language.KANNADA:
      return 'ನಮಸ್ಕಾರ';
    case Language.GUJARATI:
      return 'નમસ્તે';
    case Language.MALAYALAM:
      return 'നമസ്കാരം';
    default:
      return 'Hello';
  }
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect }) => {
  const getLanguageDetails = (lang: Language) => {
    switch (lang) {
      case Language.HINDI:
        return { native: 'हिंदी', eng: 'Hindi', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
      case Language.MARATHI:
        return { native: 'मराठी', eng: 'Marathi', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' };
      case Language.TELUGU:
        return { native: 'తెలుగు', eng: 'Telugu', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
      case Language.TAMIL:
        return { native: 'தமிழ்', eng: 'Tamil', badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400' };
      case Language.BENGALI:
        return { native: 'বাংলা', eng: 'Bengali', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
      case Language.KANNADA:
        return { native: 'ಕನ್ನಡ', eng: 'Kannada', badge: 'bg-lime-500/15 text-lime-700 dark:text-lime-400' };
      case Language.GUJARATI:
        return { native: 'ગુજરાતી', eng: 'Gujarati', badge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400' };
      case Language.MALAYALAM:
        return { native: 'മലയാളം', eng: 'Malayalam', badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' };
      default:
        return { native: 'English', eng: 'English', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' };
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.values(Language).map((lang) => {
        const { native, eng, badge } = getLanguageDetails(lang);
        const isSelected = selected === lang;
        return (
          <button
            type="button"
            key={lang}
            onClick={() => onSelect(lang)}
            aria-pressed={isSelected}
            className={`relative p-3.5 rounded-2xl transition-all duration-200 flex flex-col items-center justify-center gap-1 border-2 text-center ${
              isSelected
                ? 'bg-brand-50/90 dark:bg-brand-950/50 border-brand-500 shadow-md shadow-brand-500/10 -translate-y-0.5'
                : 'bg-white/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span
              className={`text-lg font-bold font-display ${
                isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {native}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isSelected ? badge : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {eng}
            </span>

            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
