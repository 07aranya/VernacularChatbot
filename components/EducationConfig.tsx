import React, { useState, useEffect } from 'react';
import { Subject, Board, DifficultyLevel, Language, Tone } from '../types';
import { BookOpen, Check, School, GraduationCap, Target, Gauge, X, Globe, Laugh } from 'lucide-react';

interface EducationConfigProps {
  initialGrade?: number;
  initialSubject?: Subject;
  initialBoard?: Board;
  initialChapter?: string;
  initialDifficulty?: DifficultyLevel;
  initialLanguage?: Language;
  initialTone?: Tone;
  onSave: (
    grade: number,
    subject: Subject,
    board: Board,
    chapter?: string,
    difficulty?: DifficultyLevel,
    language?: Language,
    tone?: Tone
  ) => void;
  onCancel: () => void;
}

const DIFFICULTY_META: Record<DifficultyLevel, { desc: string }> = {
  [DifficultyLevel.BEGINNER]: { desc: 'Simple words & analogies' },
  [DifficultyLevel.INTERMEDIATE]: { desc: 'Standard school level' },
  [DifficultyLevel.ADVANCED]: { desc: 'Deep & challenging' }
};

const EducationConfig: React.FC<EducationConfigProps> = ({
  initialGrade,
  initialSubject,
  initialBoard,
  initialChapter,
  initialDifficulty,
  initialLanguage,
  initialTone,
  onSave,
  onCancel
}) => {
  const [grade, setGrade] = useState<number>(initialGrade || 10);
  const [subject, setSubject] = useState<Subject>(initialSubject || Subject.MATH);
  const [board, setBoard] = useState<Board>(initialBoard || Board.CBSE);
  const [chapter, setChapter] = useState<string>(initialChapter || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialDifficulty || DifficultyLevel.INTERMEDIATE
  );
  const [language, setLanguage] = useState<Language>(initialLanguage || Language.ENGLISH);
  const [tone, setTone] = useState<Tone>(initialTone || Tone.TEACHER);

  const grades = Array.from({ length: 12 }, (_, i) => i + 1);
  const boards = Object.values(Board);
  const difficultyLevels = Object.values(DifficultyLevel);
  const languages = Object.values(Language);

  const getSubjectsForGrade = (currentGrade: number): Subject[] => {
    const commonSubjects = [Subject.MATH, Subject.ENGLISH_LIT, Subject.GENERAL];
    if (currentGrade <= 10) {
      return [...commonSubjects, Subject.SCIENCE, Subject.HISTORY, Subject.GEOGRAPHY];
    }
    return [
      Subject.PHYSICS,
      Subject.CHEMISTRY,
      Subject.MATH,
      Subject.BIOLOGY,
      Subject.COMPUTER_SCIENCE,
      Subject.ACCOUNTANCY,
      Subject.ECONOMICS,
      Subject.BUSINESS_STUDIES,
      Subject.ENGLISH_LIT,
      Subject.HISTORY,
      Subject.GEOGRAPHY,
      Subject.POLITICAL_SCIENCE,
      Subject.SOCIOLOGY,
      Subject.PSYCHOLOGY,
      Subject.GENERAL
    ];
  };

  const currentSubjects = getSubjectsForGrade(grade);

  useEffect(() => {
    const validSubjects = getSubjectsForGrade(grade);
    if (!validSubjects.includes(subject)) {
      setSubject(validSubjects[0]);
    }
  }, [grade, subject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="glass-panel w-full max-w-2xl overflow-hidden rounded-3xl flex flex-col max-h-[92vh] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-teal-600 px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 rounded-xl bg-white/15 text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                Tutor Settings
              </h3>
              <p className="text-brand-100 text-xs sm:text-sm font-medium">
                Lock YourBuddy to your exact syllabus, tone, and language.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close settings"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white z-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-8 space-y-7 overflow-y-auto bg-white/95 dark:bg-slate-900/95">
          {/* Grade & Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-brand-500" />
                Class / Grade
              </label>
              <div className="grid grid-cols-6 gap-2">
                {grades.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`h-10 rounded-xl font-bold text-sm transition-all duration-150 ${
                      grade === g
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-105'
                        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                {grade <= 10 ? 'Showing Classes 1–10 core subjects' : 'Showing Classes 11–12 stream subjects'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <School className="w-4 h-4 text-brand-500" />
                Education Board
              </label>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {boards.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBoard(b)}
                    className={`px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 border flex items-center justify-between ${
                      board === b
                        ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {board === b && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-brand-500" />
              Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentSubjects.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 border flex items-center justify-between gap-2 ${
                    subject === sub
                      ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300'
                  }`}
                >
                  <span className="truncate">{sub}</span>
                  {subject === sub && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Language & Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label
                htmlFor="config-language"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                <Globe className="w-4 h-4 text-brand-500" />
                Language
              </label>
              <select
                id="config-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Laugh className="w-4 h-4 text-brand-500" />
                Tutor Persona
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Tone).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      tone === t
                        ? 'bg-slate-900 text-white dark:bg-brand-600 border-transparent shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-brand-500" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {difficultyLevels.map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    difficulty === level
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300'
                  }`}
                >
                  <div className="text-sm font-bold">{level}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      difficulty === level
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {DIFFICULTY_META[level].desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chapter */}
          <div className="space-y-2.5">
            <label
              htmlFor="config-chapter"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >
              <Target className="w-4 h-4 text-brand-500" />
              Specific Chapter (Optional)
            </label>
            <div className="relative">
              <input
                id="config-chapter"
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Quadratic Equations, Thermodynamics, French Revolution..."
                className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium text-sm text-slate-800 dark:text-slate-100"
              />
              {chapter && (
                <button
                  type="button"
                  onClick={() => setChapter('')}
                  aria-label="Clear chapter"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(grade, subject, board, chapter.trim() || undefined, difficulty, language, tone)
            }
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-lg shadow-brand-500/25 transition-all"
          >
            Apply & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationConfig;
