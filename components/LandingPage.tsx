import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  MessageCircle, 
  Image as ImageIcon, 
  Share2, 
  Brain,
  Sun,
  Moon,
  Sparkles,
  Zap,
  BarChart2
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onTeacherDashboard: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onTeacherDashboard, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950 relative overflow-y-auto overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-100/50 to-transparent dark:from-brand-900/20 dark:to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-500 to-fuchsia-600 p-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">
              YourBuddy
            </span>
          </div>
          <button 
            onClick={toggleTheme}
            className="glass-card p-3 rounded-full text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 animate-slide-up relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-xs border border-orange-200 dark:border-orange-800 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              India's Favorite AI Tutor
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight">
              Study <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-fuchsia-500 to-orange-500 animate-gradient-x">
                Smarter.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-lg font-medium leading-relaxed">
              The AI companion that speaks <span className="text-brand-600 dark:text-brand-400 font-bold">Marathi, Hindi, & more.</span> Strictly syllabus-locked for focused learning.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onStart}
                className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-brand-500/50 transition-all hover:-translate-y-1 flex items-center gap-3"
              >
                Start Learning
                <div className="bg-white/20 dark:bg-slate-900/10 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              <button 
                onClick={onTeacherDashboard}
                className="px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center gap-3"
              >
                Teacher Dashboard
                <BarChart2 className="w-5 h-5 text-brand-600" />
              </button>
            </div>

            {/* Trusted By strip */}
            <div className="pt-8 flex items-center gap-4 text-sm font-semibold text-slate-400 dark:text-slate-600">
               <span>Supports</span>
               <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
               <span>CBSE</span>
               <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
               <span>State Boards</span>
               <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
               <span>ICSE</span>
            </div>
          </div>

          {/* Abstract Visual */}
          <div className="relative h-[500px] hidden lg:block animate-float">
             <div className="absolute top-10 right-10 w-80 h-96 bg-gradient-to-br from-brand-500 to-fuchsia-600 rounded-[2rem] rotate-6 opacity-20 blur-3xl"></div>
             
             {/* Floating Cards Mockup */}
             <div className="absolute top-0 right-10 w-80 p-6 glass-card rounded-3xl transform rotate-3 z-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-5/6 bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-4/6 bg-slate-100 rounded-full"></div>
                </div>
             </div>

             <div className="absolute top-40 right-40 w-80 p-6 glass-card rounded-3xl transform -rotate-2 z-30 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-full mb-1"></div>
                    <div className="h-2 w-10 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
                <div className="p-3 bg-brand-50 dark:bg-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300">
                  "Explain photosynthesis in Marathi please!" 🌿
                </div>
             </div>
             
             <div className="absolute bottom-20 right-0 w-64 p-4 glass-card rounded-2xl transform rotate-6 z-10 opacity-80">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Quiz Score</span>
                    <span className="text-xs font-bold text-green-500">5/5</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                   <div className="w-full bg-green-500 h-2 rounded-full"></div>
                 </div>
             </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why YourBuddy?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Large Card */}
            <div className="md:col-span-2 row-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-brand-500/20"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 mb-6">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Vernacular Intelligence</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md">
                    Don't let language be a barrier. Learn complex Science and Math concepts in your mother tongue with context-aware translations.
                  </p>
                </div>
                <div className="flex gap-2">
                  {['हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు'].map(lang => (
                    <span key={lang} className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-900">
              <BookOpen className="w-8 h-8 text-orange-500" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">NCERT Locked</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Strictly follows school curriculum. No hallucinations.</p>
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
              <ImageIcon className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Visual Solver</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Snap a picture of a diagram or question to get instant help.</p>
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-green-50 to-white dark:from-slate-800 dark:to-slate-900">
              <Share2 className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Parent Reports</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">One-click WhatsApp summaries for parents.</p>
              </div>
            </div>

            <div className="md:col-span-3 glass-card rounded-[2.5rem] p-8 flex items-center justify-between relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-fuchsia-600 opacity-90"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full gap-6">
                 <div className="text-white">
                   <h3 className="text-2xl font-bold mb-1">Ready to top the class?</h3>
                   <p className="opacity-90">Join thousands of students learning smarter.</p>
                 </div>
                 <button onClick={onStart} className="px-8 py-3 bg-white text-brand-600 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">
                   Get Started Now
                 </button>
               </div>
            </div>

          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-slate-400 dark:text-slate-600 text-sm font-medium">
        © {new Date().getFullYear()} YourBuddy. Made with ❤️ for Indian Students.
      </footer>
    </div>
  );
};

export default LandingPage;