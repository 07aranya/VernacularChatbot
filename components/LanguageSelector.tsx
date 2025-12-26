import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  selected: Language;
  onSelect: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect }) => {
  const getNativeName = (lang: Language) => {
    switch (lang) {
      case Language.HINDI: return { native: 'हिंदी', eng: 'Hindi' };
      case Language.MARATHI: return { native: 'मराठी', eng: 'Marathi' };
      case Language.TELUGU: return { native: 'తెలుగు', eng: 'Telugu' };
      case Language.TAMIL: return { native: 'தமிழ்', eng: 'Tamil' };
      case Language.BENGALI: return { native: 'বাংলা', eng: 'Bengali' };
      case Language.KANNADA: return { native: 'ಕನ್ನಡ', eng: 'Kannada' };
      case Language.GUJARATI: return { native: 'ગુજરાતી', eng: 'Gujarati' };
      case Language.MALAYALAM: return { native: 'മലയാളം', eng: 'Malayalam' };
      default: return { native: 'English', eng: 'English' };
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
      {Object.values(Language).map((lang) => {
        const { native, eng } = getNativeName(lang);
        const isSelected = selected === lang;
        return (
          <button
            key={lang}
            onClick={() => onSelect(lang)}
            className={`relative p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border ${
              isSelected
                ? 'bg-brand-600 text-white border-brand-600 shadow-xl shadow-brand-500/30 scale-105 z-10'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-slate-700'
            }`}
          >
            <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{native}</span>
            <span className={`text-xs font-medium uppercase tracking-wider ${isSelected ? 'text-brand-200' : 'text-slate-400'}`}>{eng}</span>
            
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;