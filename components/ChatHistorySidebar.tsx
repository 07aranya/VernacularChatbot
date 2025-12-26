import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Trash2, Plus, LogOut, Clock, ChevronRight } from 'lucide-react';
import { SavedSession } from '../types';
import { getSessions, deleteSession } from '../services/storageService';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: SavedSession) => void;
  onNewChat: () => void;
  onLogout: () => void;
  currentSessionId: string | null;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelectSession, 
  onNewChat,
  onLogout,
  currentSessionId 
}) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSessions(getSessions());
    }
  }, [isOpen, currentSessionId]); 

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-80 glass-card bg-white/95 dark:bg-slate-900/95 z-50 transform transition-transform duration-300 ease-out border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">History</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all shadow-lg hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No history yet.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => { onSelectSession(session); onClose(); }}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${
                  currentSessionId === session.id 
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-sm truncate pr-6 ${currentSessionId === session.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {session.title || 'Untitled Chat'}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity absolute top-3 right-3"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>{formatDate(session.timestamp)}</span>
                  {session.mode === 'Educational' && (
                     <span className="text-brand-500">Edu</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center justify-between py-3 px-4 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors text-sm">
            <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;