import React, { useState } from 'react';
import { Subject, Board } from '../types';
import { BookOpen, Check, School, GraduationCap } from 'lucide-react';

interface EducationConfigProps {
  initialGrade?: number;
  initialSubject?: Subject;
  initialBoard?: Board;
  onSave: (grade: number, subject: Subject, board: Board) => void;
  onCancel: () => void;
}

const EducationConfig: React.FC<EducationConfigProps> = ({ initialGrade, initialSubject, initialBoard, onSave, onCancel }) => {
  const [grade, setGrade] = useState<number>(initialGrade || 5);
  const [subject, setSubject] = useState<Subject>(initialSubject || Subject.GENERAL);
  const [board, setBoard] = useState<Board>(initialBoard || Board.CBSE);

  const subjects = Object.values(Subject);
  const grades = Array.from({ length: 10 }, (_, i) => i + 1);
  const boards = Object.values(Board);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg overflow-hidden animate-pop-in rounded-[2rem] flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-brand-600 to-fuchsia-600 px-8 py-6 flex-shrink-0 relative overflow-hidden">
          <GraduationCap className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
          <h3 className="text-2xl font-black text-white">Setup Tutor Mode</h3>
          <p className="text-brand-100 text-sm font-medium mt-1">Personalize your syllabus & curriculum</p>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto bg-white/50 dark:bg-slate-900/50">
          {/* Grade Selection */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Select Grade</label>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center ${
                    grade === g
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Board Selection */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">School Board</label>
            <div className="grid grid-cols-2 gap-3">
              {boards.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoard(b)}
                  className={`relative flex items-center px-4 py-3 rounded-2xl text-left transition-all duration-200 group border ${
                    board === b
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold truncate flex-1">{b}</span>
                  {board === b && <div className="h-2 w-2 rounded-full bg-emerald-500"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Subject</label>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubject(sub)}
                  className={`relative flex items-center px-4 py-3 rounded-2xl text-left transition-all duration-200 group border ${
                    subject === sub
                      ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold truncate flex-1">{sub}</span>
                  {subject === sub && <div className="h-2 w-2 rounded-full bg-brand-500"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(grade, subject, board)} className="px-8 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/30 transition-all transform hover:-translate-y-1">
            Let's Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationConfig;