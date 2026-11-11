import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  BarChart2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sun,
  Moon,
  Search,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { getAnalytics, clearAnalytics } from '../services/storageService';
import { TopicMetric } from '../types';

interface TeacherDashboardProps {
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onBack,
  isDarkMode,
  toggleTheme
}) => {
  const [data, setData] = useState<TopicMetric[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'recent'>('count');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setData(getAnalytics());
  }, []);

  const maxCount = useMemo(
    () => (data.length > 0 ? Math.max(...data.map((m) => m.count)) : 0),
    [data]
  );

  const totalQueries = useMemo(
    () => data.reduce((acc, curr) => acc + curr.count, 0),
    [data]
  );

  const topTopic = data.length > 0 ? data[0].topic : 'No Data Yet';

  const visibleData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? data.filter((m) => m.topic.toLowerCase().includes(q))
      : [...data];

    return filtered.sort((a, b) =>
      sortBy === 'count' ? b.count - a.count : b.lastAsked - a.lastAsked
    );
  }, [data, searchQuery, sortBy]);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    clearAnalytics();
    setData([]);
    setConfirmClear(false);
  };

  const getSeverityBadge = (count: number) => {
    if (maxCount === 0) return null;
    const ratio = count / maxCount;
    if (ratio >= 0.75) {
      return {
        label: 'High Confusion',
        classes:
          'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
      };
    }
    if (ratio >= 0.4) {
      return {
        label: 'Moderate',
        classes:
          'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
      };
    }
    return {
      label: 'Low',
      classes:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 overflow-y-auto relative transition-colors duration-300">
      {/* Subtle Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-35" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-brand-400/15 dark:bg-brand-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-7 relative z-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to home"
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-all text-slate-600 dark:text-slate-300 hover:text-brand-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                  Teacher Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Classroom Confusion Heatmap & Topic Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {data.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  confirmClear
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {confirmClear ? 'Confirm Clear?' : 'Clear Data'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform shadow-sm"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/15 rounded-xl">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <span className="px-2.5 py-1 bg-white/15 rounded-full text-[11px] font-bold">
                Session Total
              </span>
            </div>
            <h3 className="text-4xl font-extrabold mb-1 font-display">{totalQueries}</h3>
            <p className="text-indigo-100 text-sm font-semibold">Total Questions Asked</p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-xl shadow-rose-500/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/15 rounded-xl">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              {data.length > 0 && (
                <span className="px-2.5 py-1 bg-white/15 rounded-full text-[11px] font-bold">
                  {data[0].count} {data[0].count === 1 ? 'query' : 'queries'}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold mb-1 truncate font-display" title={topTopic}>
              {topTopic}
            </h3>
            <p className="text-rose-100 text-sm font-semibold">Most Confusing Topic</p>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-brand-100 dark:bg-brand-900/50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Tracked
              </span>
            </div>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1 font-display">
              {data.length}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              Unique Topics Tracked
            </p>
          </div>
        </div>

        {/* Main Heatmap Section */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                Confusion Heatmap
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Topics ranked by how frequently students ask doubts about them.
              </p>
            </div>

            {data.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter topics..."
                    className="pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortBy((prev) => (prev === 'count' ? 'recent' : 'count'))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-400 transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-brand-500" />
                  {sortBy === 'count' ? 'Sort: Frequency' : 'Sort: Recent'}
                </button>
              </div>
            )}
          </div>

          {data.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <BarChart2 className="w-7 h-7 opacity-60" />
              </div>
              <p className="font-bold text-slate-600 dark:text-slate-300">
                No topic analytics recorded yet
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Start asking academic questions in YourBuddy chat — tagged topics will automatically populate here.
              </p>
            </div>
          ) : visibleData.length === 0 ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-400">
              No topics match "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-5">
              {visibleData.map((metric, index) => {
                const percentage = maxCount > 0 ? Math.max((metric.count / maxCount) * 100, 6) : 0;
                const severity = getSeverityBadge(metric.count);
                return (
                  <div
                    key={metric.topic}
                    className="group p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-300 shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {metric.topic}
                        </span>
                        {severity && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severity.classes}`}
                          >
                            {severity.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(metric.lastAsked).toLocaleDateString()}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {metric.count} {metric.count === 1 ? 'query' : 'queries'}
                        </span>
                      </div>
                    </div>

                    <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 via-teal-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
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
