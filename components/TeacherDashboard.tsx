import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart2, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { getAnalytics } from '../services/storageService';
import { TopicMetric } from '../types';

interface TeacherDashboardProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBack, isDarkMode }) => {
  const [data, setData] = useState<TopicMetric[]>([]);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    const metrics = getAnalytics();
    setData(metrics);
    if (metrics.length > 0) {
      setMaxCount(Math.max(...metrics.map(m => m.count)));
    }
  }, []);

  const totalQueries = data.reduce((acc, curr) => acc + curr.count, 0);
  const topTopic = data.length > 0 ? data[0].topic : 'No Data';

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-3 bg-white dark:bg-slate-800 rounded-full hover:shadow-lg transition-all text-slate-500 hover:text-brand-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Teacher Dashboard <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-full uppercase tracking-wider">Live</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Classroom Confusion Heatmap & Analytics</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                 <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-bold">+12% this week</span>
            </div>
            <h3 className="text-4xl font-black mb-1">{totalQueries}</h3>
            <p className="text-indigo-100 font-medium">Total Questions Asked</p>
          </div>

          <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-xl shadow-red-500/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                 <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-1 truncate">{topTopic}</h3>
            <p className="text-red-100 font-medium">Most Confusing Topic</p>
          </div>

          <div className="glass-card p-6 rounded-[2rem] bg-white dark:bg-slate-800 border-none shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-xl">
                 <TrendingUp className="w-6 h-6 text-brand-600" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-1">{data.length}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Unique Topics Tracked</p>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="glass-card p-8 rounded-[2.5rem] bg-white dark:bg-slate-800">
           <div className="mb-8">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">Confusion Heatmap</h2>
             <p className="text-sm text-slate-500">Visualizing topics where students are asking the most questions.</p>
           </div>

           {data.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
               <BarChart2 className="w-12 h-12 mb-2 opacity-50" />
               <p>No data recorded yet. Start chatting to populate!</p>
             </div>
           ) : (
             <div className="space-y-6">
               {data.map((metric, index) => {
                 const percentage = (metric.count / maxCount) * 100;
                 return (
                   <div key={metric.topic} className="group">
                     <div className="flex justify-between mb-2">
                       <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                         <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-500">
                           {index + 1}
                         </span>
                         {metric.topic}
                       </span>
                       <span className="font-bold text-slate-900 dark:text-white">{metric.count} queries</span>
                     </div>
                     <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                       <div 
                          className="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out group-hover:from-brand-400 group-hover:to-fuchsia-400"
                          style={{ width: `${percentage}%` }}
                       />
                     </div>
                     <div className="mt-1 text-xs text-slate-400 text-right">
                       Last asked: {new Date(metric.lastAsked).toLocaleDateString()}
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;