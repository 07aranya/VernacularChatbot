import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Trash2,
  Plus,
  LogOut,
  ChevronRight,
  Search,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { ChatMode, Language, SavedSession } from '../types';
import { getSessions, deleteSession } from '../services/storageService';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: SavedSession) => void;
  onNewChat: () => void;
  onLogout: () => void;
  currentSessionId: string | null;
  studentName?: string;
  studentLanguage?: Language;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  onLogout,
  currentSessionId,
  studentName,
  studentLanguage
}) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSessions(getSessions());
    }
  }, [isOpen, currentSessionId]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.context?.subject || '').toLowerCase().includes(q) ||
        (s.context?.chapter || '').toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        aria-label="Chat history"
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-out border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display leading-none">
                Conversations
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {sessions.length} saved {sessions.length === 1 ? 'chat' : 'chats'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat & Search */}
        <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Study Chat
          </button>

          {sessions.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats or subjects..."
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                {searchQuery ? 'No matching chats found.' : 'No conversations yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try another keyword.' : 'Your saved study sessions appear here.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = currentSessionId === session.id;
              const isEdu = session.mode === ChatMode.EDUCATIONAL;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-brand-50/90 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className={`font-bold text-sm truncate pr-6 ${
                        isActive
                          ? 'text-brand-800 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {session.title || 'Untitled Chat'}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, session.id)}
                      aria-label="Delete session"
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 absolute top-2.5 right-2.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isEdu ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold truncate">
                          <GraduationCap className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {session.context?.subject || 'Tutor'}
                            {session.context?.grade ? ` • ${session.context.grade}` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          Casual
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">
                      {formatDate(session.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Student Info & Sign Out */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/70 dark:bg-slate-900/80">
          {studentName && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {studentName}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 truncate">
                  Language: {studentLanguage || 'English'}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-between py-2.5 px-3.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-500" />
              Exit to Home
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default ChatHistorySidebar;
