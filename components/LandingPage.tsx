import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  BookOpen,
  MessageCircle,
  BarChart2,
  CheckCircle2,
  Zap,
  Globe,
  Shapes,
  GraduationCap,
  Laugh
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onTeacherDashboard: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

type PreviewTab = 'hindi' | 'marathi' | 'diagram';

const PREVIEW_SCENES: Record<
  PreviewTab,
  {
    label: string;
    badge: string;
    question: string;
    answerTitle: string;
    answerBody: string;
    formula?: string;
    hasSvg?: boolean;
    topicTag: string;
  }
> = {
  hindi: {
    label: 'Hindi • Dost',
    badge: 'Friend Mode',
    question: 'Bhai, Quadratic Formula yaad nahi rehta! Simple trick batao na?',
    answerTitle: 'Arre sun buddy, ekdum mast trick hai! 🎯',
    answerBody:
      'बस एक छोटी कहानी याद रखो — "-b" घर के बाहर खड़ा है, और अंदर ± √(b² - 4ac) का tension चल रहा है, सब 2a के नीचे!',
    formula: 'x = (-b ± √(b² − 4ac)) / 2a',
    topicTag: 'Quadratic Equations'
  },
  marathi: {
    label: 'Marathi • Teacher',
    badge: 'NCERT / State',
    question: 'प्रकाशसंश्लेषण (Photosynthesis) म्हणजे काय? सोप्या भाषेत सांगा.',
    answerTitle: 'नक्कीच! इयत्ता १० वी विज्ञान (NCERT) नुसार:',
    answerBody:
      'हिरव्या वनस्पती सूर्यप्रकाश, क्लोरोफिल, कार्बन डायऑक्साइड (CO₂) आणि पाण्याच्या मदतीने स्वतःचे अन्न (ग्लुकोज) तयार करतात.',
    formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    topicTag: 'Life Processes'
  },
  diagram: {
    label: 'Visual • SVG',
    badge: 'Diagram + Quiz',
    question: 'Draw a right triangle and explain Pythagoras theorem.',
    answerTitle: 'Here is a visual breakdown for Grade 10 Geometry:',
    answerBody:
      'In a right-angled triangle, the square of the hypotenuse (c) equals the sum of squares of the other two sides (a and b).',
    formula: 'a² + b² = c²',
    hasSvg: true,
    topicTag: 'Triangles'
  }
};

const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onTeacherDashboard,
  isDarkMode,
  toggleTheme
}) => {
  const [activePreview, setActivePreview] = useState<PreviewTab>('hindi');

  const scrollItems = [
    'हिंदी • Hindi',
    'मराठी • Marathi',
    'தமிழ் • Tamil',
    'తెలుగు • Telugu',
    'বাংলা • Bengali',
    'ಕನ್ನಡ • Kannada',
    'ગુજરાતી • Gujarati',
    'മലയാളം • Malayalam',
    'Mathematics',
    'Science',
    'Physics',
    'Chemistry',
    'History',
    'Economics'
  ];

  const scene = PREVIEW_SCENES[activePreview];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden transition-colors duration-300">
      {/* Subtle Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute -top-32 -right-24 w-[520px] h-[520px] bg-brand-400/20 dark:bg-brand-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-24 w-[560px] h-[560px] bg-sky-400/20 dark:bg-indigo-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Sticky Glass Navigation */}
      <nav className="sticky top-0 z-50 px-4 sm:px-6 pt-4">
        <div className="max-w-6xl mx-auto glass rounded-2xl px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-brand-500 to-teal-600 p-2 rounded-xl text-white shadow-md shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                YourBuddy
              </span>
              <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                AI Tutor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onTeacherDashboard}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Teacher View
            </button>

            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onStart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 dark:bg-brand-600 text-white hover:bg-slate-800 dark:hover:bg-brand-500 shadow-md shadow-slate-900/10 dark:shadow-brand-500/20 transition-all"
            >
              Start
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-14 pb-20 sm:pt-20 sm:pb-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Grades 1–12 • 9 Indian Languages + English</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.12] tracking-tight font-display">
              Master your syllabus in{' '}
              <span className="text-gradient">your own language.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              An intelligent vernacular tutor built for Indian students. Learn in Hindi, Marathi, Tamil, and more — strictly aligned to your school board with diagrams, quizzes, and adaptive difficulty.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-brand-600/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 group"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onTeacherDashboard}
                className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-base sm:text-lg hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <BarChart2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Teacher Heatmap
              </button>
            </div>

            <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> CBSE (NCERT)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> State Boards
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> ICSE
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> IB / IGCSE
              </span>
            </div>
          </div>

          {/* Right Interactive Live Preview */}
          <div className="lg:col-span-6 animate-fade-in">
            <div className="glass-panel rounded-3xl p-4 sm:p-6 relative">
              {/* Preview Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                      Live Preview
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {scene.badge}
                    </p>
                  </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl gap-1">
                  {(Object.keys(PREVIEW_SCENES) as PreviewTab[]).map((tabKey) => {
                    const isActive = activePreview === tabKey;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => setActivePreview(tabKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isActive
                            ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {PREVIEW_SCENES[tabKey].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mock Chat Conversation */}
              <div className="py-5 space-y-4">
                {/* Student bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-slate-900 dark:bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium shadow-sm">
                    {scene.question}
                  </div>
                </div>

                {/* Tutor bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                    {activePreview === 'hindi' ? (
                      <Laugh className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-tl-sm p-4 space-y-3 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {scene.answerTitle}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {scene.answerBody}
                    </p>

                    {scene.formula && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-brand-50/90 dark:bg-brand-950/50 border border-brand-200/70 dark:border-brand-800/60 font-mono text-xs sm:text-sm font-bold text-brand-800 dark:text-brand-300 text-center">
                        {scene.formula}
                      </div>
                    )}

                    {scene.hasSvg && (
                      <div className="bg-white rounded-xl border border-slate-200 p-3 flex justify-center">
                        <svg
                          viewBox="0 0 220 120"
                          className="w-48 h-24"
                          role="img"
                          aria-label="Right triangle diagram"
                        >
                          <polygon
                            points="40,95 170,95 40,20"
                            fill="#ccfbf1"
                            stroke="#0d9488"
                            strokeWidth="2.5"
                          />
                          <rect
                            x="40"
                            y="83"
                            width="12"
                            height="12"
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth="2"
                          />
                          <text x="22" y="62" fontSize="13" fontWeight="bold" fill="#0f172a">
                            a
                          </text>
                          <text x="102" y="112" fontSize="13" fontWeight="bold" fill="#0f172a">
                            b
                          </text>
                          <text x="112" y="50" fontSize="13" fontWeight="bold" fill="#0d9488">
                            c
                          </text>
                        </svg>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        Topic tracked: {scene.topicTag}
                      </span>
                      <span>🔊 Listen • 5-MCQ Quiz</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scroll Marquee */}
      <div className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-y border-slate-200/80 dark:border-slate-800 py-5 overflow-hidden flex relative z-10">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex} className="flex shrink-0">
              {scrollItems.map((item, i) => (
                <div
                  key={`${groupIndex}-${i}`}
                  className="flex items-center mx-7 group cursor-default"
                >
                  <span className="text-lg md:text-xl font-bold text-slate-400 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors font-display tracking-wide">
                    {item}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400/50 ml-7" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <section className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
              Built for how Indian students actually study
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Switch effortlessly between casual doubt-clearing and strict exam preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-7 rounded-3xl hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                Vernacular & Dost Mode
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask in Hinglish, Marathi, Tamil, Telugu, Bengali, and more. Toggle between strict Teacher or friendly Dost tone.
              </p>
            </div>

            <div className="glass-card p-7 rounded-3xl hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                Syllabus Locked
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Lock explanations to Grade 1–12, Board (CBSE NCERT, State, ICSE, IB), subject, and specific chapters.
              </p>
            </div>

            <div className="glass-card p-7 rounded-3xl hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shapes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                Visual SVG & LaTeX
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload homework photos, render crisp LaTeX math equations, and generate live SVG diagrams on demand.
              </p>
            </div>

            <div className="glass-card p-7 rounded-3xl hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                Quizzes & Teacher Insights
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Adaptive difficulty adjusts to your quiz scores, exports parent reports, and feeds the Teacher Confusion Heatmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 text-center text-slate-500 dark:text-slate-500 text-sm font-medium border-t border-slate-200/80 dark:border-slate-800/80 relative z-10 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-500" />
            <span>© {new Date().getFullYear()} YourBuddy AI. Designed for Indian Students.</span>
          </div>
          <button
            onClick={onStart}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
          >
            Launch Tutor Workspace →
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
