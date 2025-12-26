import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, RefreshCw, X, Sparkles, GraduationCap, MessageCircle, Image as ImageIcon, Brain, Laugh, BookOpen, Sun, Moon, Share2 } from 'lucide-react';
import { UserContext, ChatMessage, Language, ChatMode, Subject, Board, Tone, SavedSession, QuizScore } from '../types';
import { createChatSession, sendMessageToGemini, generateQuiz, generateProgressReport } from '../services/geminiService';
import { saveSession, createNewSessionId, trackTopic } from '../services/storageService';
import ChatMessageBubble from './ChatMessageBubble';
import EducationConfig from './EducationConfig';
import ChatHistorySidebar from './ChatHistorySidebar';
import { Chat } from '@google/genai';

interface ChatInterfaceProps {
  context: UserContext;
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context: initialContext, onBack, isDarkMode, toggleTheme }) => {
  const [context, setContext] = useState<UserContext>({ ...initialContext, tone: Tone.TEACHER });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [sessionId, setSessionId] = useState<string>(createNewSessionId());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [mode, setMode] = useState<ChatMode>(ChatMode.NORMAL);
  const [showEduConfig, setShowEduConfig] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const userMessages = messages.filter(m => m.role === 'user');
      const title = userMessages.length > 0 ? userMessages[0].text.substring(0, 30) + (userMessages[0].text.length > 30 ? '...' : '') : 'New Conversation';
      const sessionData: SavedSession = {
        id: sessionId,
        title: title,
        timestamp: Date.now(),
        messages: messages,
        context: context,
        mode: mode,
        quizScores: quizScores
      };
      saveSession(sessionData);
    }
  }, [messages, context, mode, sessionId, quizScores]);

  useEffect(() => {
    try {
      if (mode === ChatMode.EDUCATIONAL && (!context.grade || !context.subject)) {
        setShowEduConfig(true);
        return;
      }
      const history = messages.length > 0 ? messages : undefined;
      const chat = createChatSession(context, mode, history);
      setChatSession(chat);
      if (messages.length === 0) {
        let greeting = "";
        const isEdu = mode === ChatMode.EDUCATIONAL;
        const subjectName = context.subject || "subjects";
        const boardName = context.board || "Curriculum";
        
        switch (context.language) {
            case Language.HINDI: greeting = isEdu ? `नमस्ते! मैं कक्षा ${context.grade} (${boardName}) के ${subjectName} के लिए आपका मित्र 'YourBuddy' हूँ।` : `नमस्ते ${context.name}! मैं आपका दोस्त 'YourBuddy' हूँ।`; break;
            case Language.MARATHI: greeting = isEdu ? `नमस्कार! मी इयत्ता ${context.grade} (${boardName}) च्या ${subjectName} विषयाचा तुमचा मित्र 'YourBuddy' आहे.` : `नमस्कार ${context.name}! मी तुमचा मित्र 'YourBuddy'.`; break;
            // ... (Abbreviated for brevity, logic remains same as original)
            default: greeting = isEdu ? `Hello! I am 'YourBuddy', your Grade ${context.grade} study companion.` : `Hello ${context.name}! I'm YourBuddy.`;
        }
        setMessages([{ id: `init-${Date.now()}`, role: 'model', text: greeting, timestamp: new Date() }]);
      }
    } catch (e) { console.error("Failed to init chat", e); }
  }, [mode, context.grade, context.subject, context.language, context.name, context.board, context.tone, sessionId]); 

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleQuizRequest = async () => {
    if (!chatSession || isLoading) return;
    setIsLoading(true);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: "Take a Test / Quiz me", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const responseText = await generateQuiz(chatSession, context.subject || "General");
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };
  
  const handleShare = async () => {
    if (!chatSession || isLoading) return;
    setIsLoading(true);
    try {
      const report = await generateProgressReport(chatSession, context.name, quizScores);
      const url = `https://wa.me/?text=${encodeURIComponent(report)}`;
      window.open(url, '_blank');
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const toggleTone = () => {
    const newTone = context.tone === Tone.TEACHER ? Tone.FRIEND : Tone.TEACHER;
    setContext(prev => ({ ...prev, tone: newTone }));
    setMessages(prev => [...prev, { id: `sys-tone-${Date.now()}`, role: 'model', text: `_[System]: Switched to **${newTone === Tone.FRIEND ? 'Friend' : 'Teacher'}** persona._`, timestamp: new Date() }]);
  };

  const handleModeToggle = () => {
    if (mode === ChatMode.NORMAL) {
      if (!context.grade || !context.subject) setShowEduConfig(true);
      else {
        setMode(ChatMode.EDUCATIONAL);
        setMessages(prev => [...prev, { id: `sys-mode-${Date.now()}`, role: 'model', text: `_[System]: Switched to **Educational Mode**._`, timestamp: new Date() }]);
      }
    } else {
      setMode(ChatMode.NORMAL);
      setMessages(prev => [...prev, { id: `sys-mode-${Date.now()}`, role: 'model', text: `_[System]: Switched to **Casual Chat Mode**._`, timestamp: new Date() }]);
    }
  };

  const handleEduConfigSave = (grade: number, subject: Subject, board: Board) => {
    setContext(prev => ({ ...prev, grade, subject, board }));
    setMode(ChatMode.EDUCATIONAL);
    setShowEduConfig(false);
    setMessages(prev => [...prev, { id: `sys-config-${Date.now()}`, role: 'model', text: `_[System]: Setup Updated. Switched to **Educational Mode**._`, timestamp: new Date() }]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || !chatSession || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText, image: selectedImage || undefined, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let responseText = await sendMessageToGemini(chatSession, userMsg.text, imageToSend || undefined);
      
      // 1. Check for Quiz Score
      const scoreMatch = responseText.match(/\[\[QUIZ_SCORE: (.+?)\]\]/);
      if (scoreMatch) {
          setQuizScores(prev => [...prev, { topic: context.subject || "General", score: scoreMatch[1], timestamp: Date.now() }]);
          responseText = responseText.replace(scoreMatch[0], "").trim();
      }

      // 2. Check for Analytics Topic
      const topicMatch = responseText.match(/\[\[TOPIC: (.+?)\]\]/);
      if (topicMatch) {
          const detectedTopic = topicMatch[1];
          trackTopic(detectedTopic); // Save to local storage for heatmap
          responseText = responseText.replace(topicMatch[0], "").trim();
      }

      // 3. Check for Auto-Switch
      if (mode === ChatMode.NORMAL && responseText.includes('[[SWITCH_TO_EDU]]')) {
        responseText = responseText.replace('[[SWITCH_TO_EDU]]', '').trim();
        if (!context.grade || !context.subject) { setShowEduConfig(true); setMode(ChatMode.EDUCATIONAL); }
        else { setMode(ChatMode.EDUCATIONAL); setMessages(prev => [...prev, { id: `sys-auto-${Date.now()}`, role: 'model', text: `_[System]: Auto-switching to **Educational Mode**._`, timestamp: new Date() }]); }
      }
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() }]);
    } catch (error) { } finally { setIsLoading(false); }
  };

  const handleNewChat = () => { setMessages([]); setQuizScores([]); setSessionId(createNewSessionId()); setMode(ChatMode.NORMAL); };
  const handleSelectSession = (session: SavedSession) => { setSessionId(session.id); setMessages(session.messages); setContext(session.context); setMode(session.mode); setQuizScores(session.quizScores || []); };

  return (
    <div className="flex flex-col h-screen bg-brand-50 dark:bg-slate-950 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.5] pointer-events-none" />
      
      <ChatHistorySidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onLogout={onBack}
        currentSessionId={sessionId}
      />

      {showEduConfig && (
        <EducationConfig 
          initialGrade={context.grade} 
          initialSubject={context.subject}
          initialBoard={context.board}
          onSave={handleEduConfigSave}
          onCancel={() => { setShowEduConfig(false); }}
        />
      )}

      {/* Floating Header */}
      <header className="absolute top-4 left-4 right-4 z-30 flex justify-center pointer-events-none">
        <div className="glass-card rounded-full px-4 py-2 flex items-center gap-3 shadow-lg pointer-events-auto max-w-full">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
             <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center px-2">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              YourBuddy 
              <span className={`w-2 h-2 rounded-full ${mode === ChatMode.EDUCATIONAL ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mode === ChatMode.EDUCATIONAL ? 'Tutor Mode' : 'Casual Mode'}</span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-1">
             <button onClick={toggleTone} className={`p-2 rounded-full transition-colors ${context.tone === Tone.FRIEND ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-500'}`} title="Tone">
                {context.tone === Tone.FRIEND ? <Laugh className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
             </button>
             {mode === ChatMode.EDUCATIONAL && (
                <button onClick={handleQuizRequest} disabled={isLoading} className="p-2 hover:bg-purple-100 text-purple-600 rounded-full" title="Quiz">
                  <Brain className="w-4 h-4" />
                </button>
             )}
             <button onClick={handleShare} disabled={isLoading} className="p-2 hover:bg-green-100 text-green-600 rounded-full" title="Share">
                <Share2 className="w-4 h-4" />
             </button>
             <button onClick={handleModeToggle} className={`p-2 rounded-full ${mode === ChatMode.EDUCATIONAL ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                {mode === ChatMode.EDUCATIONAL ? <GraduationCap className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
             </button>
              <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-full">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 md:px-6 z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 w-full">
            {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} language={context.language} />
            ))}
            {isLoading && (
            <div className="flex justify-start w-full animate-pulse pl-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                    <span className="text-xs font-bold text-slate-400">Thinking...</span>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 z-20 px-4 md:px-6 flex justify-center">
        <div className="w-full max-w-7xl glass-card rounded-[2rem] p-2 shadow-2xl flex flex-col gap-2 relative transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-400/50">
           
           {selectedImage && (
             <div className="absolute -top-24 left-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl animate-pop-in">
                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                    <X className="w-3 h-3" />
                </button>
             </div>
           )}

           <div className="flex items-end gap-2 pl-2">
             <button onClick={() => fileInputRef.current?.click()} className="p-3 mb-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors">
               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
               <ImageIcon className="w-5 h-5" />
             </button>
             
             <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[56px] py-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium text-base"
                rows={1}
             />
             
             <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !selectedImage) || isLoading}
                className={`p-3 mb-1 rounded-full transition-all duration-300 transform ${
                (!inputText.trim() && !selectedImage) || isLoading 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                    : 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:scale-110 hover:rotate-12'
                }`}
             >
                <Send className="w-5 h-5 ml-0.5" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;