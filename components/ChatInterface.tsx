import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  MessageCircle,
  Image as ImageIcon,
  Brain,
  Laugh,
  BookOpen,
  Sun,
  Moon,
  AlertTriangle,
  SlidersHorizontal,
  Share2,
  Plus,
  Award
} from 'lucide-react';
import {
  UserContext,
  ChatMessage,
  Language,
  ChatMode,
  Subject,
  Board,
  Tone,
  SavedSession,
  QuizScore,
  DifficultyLevel
} from '../types';
import {
  createChatSession,
  sendMessageToGemini,
  generateQuiz,
  generateProgressReport
} from '../services/geminiService';
import { saveSession, createNewSessionId, trackTopic } from '../services/storageService';
import ChatMessageBubble from './ChatMessageBubble';
import EducationConfig from './EducationConfig';
import ChatHistorySidebar from './ChatHistorySidebar';
import { Chat } from '@google/genai';

// --- Curriculum Topics for Quick Chips ---
const CURRICULUM_DATA: Record<string, string[]> = {
  Default: ['Study Plan', 'Quiz Me', 'Important Formulas', 'Chapter Summary'],
  [`${Subject.MATH}_10`]: [
    'Real Numbers',
    'Polynomials',
    'Quadratic Equations',
    'Triangles',
    'Trigonometry',
    'Statistics',
    'Probability',
    'Circles'
  ],
  [`${Subject.SCIENCE}_10`]: [
    'Chemical Reactions',
    'Acids Bases Salts',
    'Metals Non-Metals',
    'Life Processes',
    'Control Coordination',
    'Heredity',
    'Light Reflection',
    'Electricity'
  ],
  [Subject.MATH]: [
    'Key Formulas',
    'Solve a Practice Problem',
    'Draw Geometry Diagram',
    'Common Mistakes'
  ],
  [Subject.SCIENCE]: [
    'Explain with Diagram',
    'Real-Life Examples',
    'Key Definitions',
    'Quick Revision'
  ],
  [Subject.PHYSICS]: [
    'Derivations & Formulas',
    'Free Body Diagrams',
    'Numerical Practice',
    'SI Units Recap'
  ],
  [Subject.CHEMISTRY]: [
    'Chemical Equations',
    'Reaction Mechanisms',
    'Periodic Trends',
    'Important Exceptions'
  ],
  [Subject.BIOLOGY]: [
    'Draw Labeled Diagram',
    'Process Flowchart',
    'NCERT Keywords',
    'Compare & Contrast'
  ]
};

const CASUAL_STARTERS = [
  'Help me plan today’s study schedule',
  'Explain black holes in simple words',
  'Give me a fun science riddle',
  'How do I stay focused while studying?'
];

const DIFFICULTY_BADGE: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  [DifficultyLevel.INTERMEDIATE]:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
  [DifficultyLevel.ADVANCED]:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
};

interface ChatInterfaceProps {
  context: UserContext;
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  context: initialContext,
  onBack,
  isDarkMode,
  toggleTheme
}) => {
  const [context, setContext] = useState<UserContext>({
    ...initialContext,
    tone: initialContext.tone || Tone.TEACHER,
    difficulty: initialContext.difficulty || DifficultyLevel.INTERMEDIATE
  });
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
  const [isDragging, setIsDragging] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Auto-Resize Textarea ---
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [inputText]);

  // --- Suggested Topics on Context/Mode Change ---
  useEffect(() => {
    if (mode === ChatMode.NORMAL) {
      setSuggestedTopics(CASUAL_STARTERS);
      return;
    }

    if (context.chapter && context.chapter.trim() !== '') {
      setSuggestedTopics([
        `Explain ${context.chapter}`,
        `Quiz on ${context.chapter}`,
        `Key concepts in ${context.chapter}`,
        `Summary of ${context.chapter}`
      ]);
      return;
    }

    const gradeKey = `${context.subject}_${context.grade}`;
    const pool =
      CURRICULUM_DATA[gradeKey] ||
      (context.subject ? CURRICULUM_DATA[context.subject] : undefined) ||
      CURRICULUM_DATA['Default'];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setSuggestedTopics(shuffled.slice(0, 5));
  }, [context.grade, context.subject, context.chapter, sessionId, mode]);

  // --- Save Session ---
  useEffect(() => {
    if (messages.length > 0) {
      const userMessages = messages.filter((m) => m.role === 'user');
      const title =
        userMessages.length > 0
          ? (userMessages[0].text || 'Image Question').substring(0, 36) +
            ((userMessages[0].text || '').length > 36 ? '...' : '')
          : 'New Conversation';
      const sessionData: SavedSession = {
        id: sessionId,
        title,
        timestamp: Date.now(),
        messages,
        context,
        mode,
        quizScores
      };
      saveSession(sessionData);
    }
  }, [messages, context, mode, sessionId, quizScores]);

  // --- Initialize Chat ---
  useEffect(() => {
    try {
      if (mode === ChatMode.EDUCATIONAL && (!context.grade || !context.subject)) {
        setShowEduConfig(true);
        return;
      }
      const history = messages.length > 0 ? messages : undefined;
      const chat = createChatSession(context, mode, history);
      setChatSession(chat);
      setInitError(null);

      if (messages.length === 0) {
        let greeting = '';
        const isEdu = mode === ChatMode.EDUCATIONAL;
        const subjectName = context.subject || 'subjects';

        switch (context.language) {
          case Language.HINDI:
            greeting = isEdu
              ? `नमस्ते ${context.name}! मैं कक्षा ${context.grade} के ${subjectName} के लिए आपका AI मित्र 'YourBuddy' हूँ। आज हम क्या पढ़ें?`
              : `नमस्ते ${context.name}! मैं आपका दोस्त 'YourBuddy' हूँ। कोई भी सवाल पूछो या Tutor Mode चालू करो!`;
            break;
          case Language.MARATHI:
            greeting = isEdu
              ? `नमस्कार ${context.name}! मी इयत्ता ${context.grade} च्या ${subjectName} विषयाचा तुमचा मित्र 'YourBuddy' आहे. आज कोणता धडा शिकायचा?`
              : `नमस्कार ${context.name}! मी तुमचा मित्र 'YourBuddy'. आज काय विचारायचे आहे?`;
            break;
          default:
            greeting = isEdu
              ? `Hello ${context.name}! I'm **YourBuddy**, your Grade ${context.grade} ${subjectName} study companion. What would you like to master today?`
              : `Hello ${context.name}! I'm **YourBuddy**. Ask me anything casually, upload a homework photo, or switch to **Tutor Mode** for syllabus-locked learning.`;
        }
        setMessages([
          { id: `init-${Date.now()}`, role: 'model', text: greeting, timestamp: new Date() }
        ]);
      }
    } catch (e: any) {
      console.error('Failed to init chat', e);
      setInitError(
        e.message || 'Failed to initialize AI session. Please check your API key in .env.local'
      );
    }
  }, [
    mode,
    context.grade,
    context.subject,
    context.language,
    context.name,
    context.board,
    context.tone,
    context.difficulty,
    context.chapter,
    sessionId
  ]);

  // --- Auto-Difficulty Logic ---
  useEffect(() => {
    if (quizScores.length > 0) {
      const lastScore = quizScores[quizScores.length - 1];
      const scoreNum = parseInt(lastScore.score.split('/')[0], 10);
      let newDiff = context.difficulty;
      if (scoreNum >= 4 && context.difficulty !== DifficultyLevel.ADVANCED) {
        newDiff =
          context.difficulty === DifficultyLevel.BEGINNER
            ? DifficultyLevel.INTERMEDIATE
            : DifficultyLevel.ADVANCED;
      } else if (scoreNum <= 2 && context.difficulty !== DifficultyLevel.BEGINNER) {
        newDiff =
          context.difficulty === DifficultyLevel.ADVANCED
            ? DifficultyLevel.INTERMEDIATE
            : DifficultyLevel.BEGINNER;
      }
      if (newDiff && newDiff !== context.difficulty) {
        setContext((prev) => ({ ...prev, difficulty: newDiff }));
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-diff-${Date.now()}`,
            role: 'model',
            text: `_[Adaptive Learning]: Adjusted difficulty to **${newDiff}**._`,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [quizScores]);

  // --- Auto-Scroll ---
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleQuizRequest = async () => {
    if (!chatSession || isLoading) return;
    setIsLoading(true);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: 'Take a Test / Quiz me',
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const responseText = await generateQuiz(
        chatSession,
        context.chapter || context.subject || 'General'
      );
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() }
      ]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-quiz-${Date.now()}`,
          role: 'model',
          text: `Could not generate quiz: ${e?.message || 'Connection failed'}.`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProgress = async () => {
    if (!chatSession || isLoading) return;

    const tempId = `report-load-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'model', text: 'Generating study progress report... ⏳', timestamp: new Date() }
    ]);

    try {
      const report = await generateProgressReport(chatSession, context.name, quizScores);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      if (navigator.share) {
        await navigator.share({
          title: 'YourBuddy Progress Report',
          text: report
        });
      } else {
        await navigator.clipboard.writeText(report);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'model',
            text: `📋 **Progress Report Copied to Clipboard!**\n\n${report}`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const toggleTone = () => {
    const newTone = context.tone === Tone.TEACHER ? Tone.FRIEND : Tone.TEACHER;
    setContext((prev) => ({ ...prev, tone: newTone }));
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-tone-${Date.now()}`,
        role: 'model',
        text: `_[System]: Switched to **${newTone === Tone.FRIEND ? 'Friend (Dost)' : 'Teacher'}** persona._`,
        timestamp: new Date()
      }
    ]);
  };

  const handleModeToggle = () => {
    if (mode === ChatMode.NORMAL) {
      if (!context.grade || !context.subject) {
        setShowEduConfig(true);
      } else {
        setMode(ChatMode.EDUCATIONAL);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-mode-${Date.now()}`,
            role: 'model',
            text: `_[System]: Switched to **Tutor Mode** (${context.subject}, Grade ${context.grade})._`,
            timestamp: new Date()
          }
        ]);
      }
    } else {
      setMode(ChatMode.NORMAL);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-mode-${Date.now()}`,
          role: 'model',
          text: `_[System]: Switched to **Casual Chat Mode**._`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleEduConfigSave = (
    grade: number,
    subject: Subject,
    board: Board,
    chapter?: string,
    difficulty?: DifficultyLevel,
    language?: Language,
    tone?: Tone
  ) => {
    setContext((prev) => ({
      ...prev,
      grade,
      subject,
      board,
      chapter,
      difficulty: difficulty || prev.difficulty,
      language: language || prev.language,
      tone: tone || prev.tone
    }));
    setMode(ChatMode.EDUCATIONAL);
    setShowEduConfig(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-config-${Date.now()}`,
        role: 'model',
        text: `_[System]: Tutor set to **Grade ${grade} ${subject}** (${board})${
          chapter ? ` • **${chapter}**` : ''
        } • **${difficulty || DifficultyLevel.INTERMEDIATE}**._`,
        timestamp: new Date()
      }
    ]);
  };

  const processImageFile = (file?: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processImageFile(file);
  };

  const handleTopicClick = (topic: string) => {
    const msg =
      mode === ChatMode.NORMAL ||
      (topic.includes(' ') && topic.length > 20) ||
      topic.startsWith('Quiz') ||
      topic.startsWith('Explain')
        ? topic
        : `Explain ${topic}`;
    setInputText(msg);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!chatSession || isLoading) return;
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      image: selectedImage || undefined,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let responseText = await sendMessageToGemini(
        chatSession,
        userMsg.text,
        imageToSend || undefined
      );

      let quizScoreDetected: string | null = null;
      const scoreMatch = responseText.match(/\[\[QUIZ_SCORE: (.+?)\]\]/);
      if (scoreMatch) {
        quizScoreDetected = scoreMatch[1];
        setQuizScores((prev) => [
          ...prev,
          {
            topic: context.chapter || context.subject || 'General',
            score: scoreMatch[1],
            timestamp: Date.now()
          }
        ]);
        responseText = responseText.replace(scoreMatch[0], '').trim();
      }

      const topicMatch = responseText.match(/\[\[TOPIC: (.+?)\]\]/);
      if (topicMatch) {
        trackTopic(topicMatch[1]);
        responseText = responseText.replace(topicMatch[0], '').trim();
      }

      const diffMatch = responseText.match(/\[\[AUTO_DIFF: (.+?)\]\]/);
      if (diffMatch) {
        const suggestedDiff = diffMatch[1] as DifficultyLevel;
        if (
          Object.values(DifficultyLevel).includes(suggestedDiff) &&
          suggestedDiff !== context.difficulty
        ) {
          setContext((prev) => ({ ...prev, difficulty: suggestedDiff }));
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-autodiff-${Date.now()}`,
              role: 'model',
              text: `_[Adaptive Learning]: Adjusted difficulty to **${suggestedDiff}**._`,
              timestamp: new Date()
            }
          ]);
        }
        responseText = responseText.replace(diffMatch[0], '').trim();
      }

      if (mode === ChatMode.NORMAL && responseText.includes('[[SWITCH_TO_EDU]]')) {
        responseText = responseText.replace('[[SWITCH_TO_EDU]]', '').trim();
        if (!context.grade || !context.subject) {
          setShowEduConfig(true);
          setMode(ChatMode.EDUCATIONAL);
        } else {
          setMode(ChatMode.EDUCATIONAL);
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-auto-${Date.now()}`,
              role: 'model',
              text: `_[System]: Auto-switched to **Tutor Mode**._`,
              timestamp: new Date()
            }
          ]);
        }
      }

      const newMessages: ChatMessage[] = [
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date()
        }
      ];

      if (quizScoreDetected) {
        newMessages.push({
          id: `share-${Date.now()}`,
          role: 'model',
          text: `🎉 **Quiz Complete!**\n\nYou scored: **${quizScoreDetected}**`,
          timestamp: new Date(),
          action: 'SHARE_REPORT'
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (error: any) {
      console.error('Error in handleSend:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Error: ${error.message || 'Connection failed'}. Please check your API key in .env.local.`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setQuizScores([]);
    setSessionId(createNewSessionId());
    setMode(ChatMode.NORMAL);
  };

  const handleSelectSession = (session: SavedSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setContext(session.context);
    setMode(session.mode);
    setQuizScores(session.quizScores || []);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEdu = mode === ChatMode.EDUCATIONAL;
  const difficultyLevel = context.difficulty || DifficultyLevel.INTERMEDIATE;
  const latestQuiz = quizScores.length > 0 ? quizScores[quizScores.length - 1] : null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onLogout={onBack}
        currentSessionId={sessionId}
        studentName={context.name}
        studentLanguage={context.language}
      />

      {showEduConfig && (
        <EducationConfig
          initialGrade={context.grade}
          initialSubject={context.subject}
          initialBoard={context.board}
          initialChapter={context.chapter}
          initialDifficulty={context.difficulty}
          initialLanguage={context.language}
          initialTone={context.tone}
          onSave={handleEduConfigSave}
          onCancel={() => setShowEduConfig(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0">
        {/* Top Header */}
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-5 py-3 z-10 sticky top-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open chat history"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 items-center justify-center text-white shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display truncate">
                      YourBuddy
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shrink-0 ${
                        isEdu
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isEdu ? 'Tutor' : 'Casual'}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {context.language} • {context.tone === Tone.FRIEND ? 'Dost Mode' : 'Teacher Mode'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right action bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isEdu && (
                <button
                  type="button"
                  onClick={handleQuizRequest}
                  disabled={isLoading || !!initError}
                  title="Generate 5-MCQ Quiz"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/70 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors text-xs font-bold disabled:opacity-50"
                >
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Quiz</span>
                </button>
              )}

              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleShareProgress}
                  disabled={isLoading || !!initError}
                  title="Share Progress Report"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-xs font-bold disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Report</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleTone}
                title={`Switch persona (currently ${context.tone})`}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  context.tone === Tone.FRIEND
                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60'
                    : 'bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {context.tone === Tone.FRIEND ? (
                  <Laugh className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
                <span className="hidden lg:inline">
                  {context.tone === Tone.FRIEND ? 'Dost' : 'Teacher'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleModeToggle}
                title={isEdu ? 'Switch to Casual Mode' : 'Switch to Tutor Mode'}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  isEdu
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/70'
                    : 'bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {isEdu ? (
                  <GraduationCap className="w-4 h-4" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                <span className="hidden md:inline">{isEdu ? 'Tutor Mode' : 'Go Tutor'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEduConfig(true)}
                title="Tutor & Syllabus Settings"
                aria-label="Tutor settings"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                title="Start New Chat"
                aria-label="Start new chat"
                className="hidden sm:inline-flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Active Syllabus Ribbon in Educational Mode */}
          {isEdu && (
            <div className="max-w-5xl mx-auto mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEduConfig(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <span>Grade {context.grade}</span>
                  <span className="text-slate-400">•</span>
                  <span>{context.board || Board.CBSE}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEduConfig(true)}
                  className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/50 border border-brand-200/70 dark:border-brand-800/60 text-[11px] font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                >
                  {context.subject}
                  {context.chapter ? ` • ${context.chapter}` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setShowEduConfig(true)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${DIFFICULTY_BADGE[difficultyLevel]}`}
                >
                  {difficultyLevel}
                </button>
              </div>

              {latestQuiz && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                  <Award className="w-3.5 h-3.5" />
                  Last Quiz: {latestQuiz.score}
                </div>
              )}
            </div>
          )}
        </header>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 bg-slate-50 dark:bg-slate-950"
        >
          <div className="max-w-3xl mx-auto flex flex-col min-h-full pb-2">
            {initError && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 mb-5 flex items-start gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                    Configuration Error
                  </h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300/90 mt-1">{initError}</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-mono">
                    Ensure .env.local defines API_KEY=... for Vite.
                  </p>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-5 shadow-md border border-slate-200/80 dark:border-slate-800 animate-float">
                  <Sparkles className="w-10 h-10 text-brand-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mb-2">
                  Hello, {context.name}!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm sm:text-base">
                  Ask a question in {context.language}, upload a homework photo, or configure your class syllabus.
                </p>
                {isEdu && (
                  <button
                    type="button"
                    onClick={() => setShowEduConfig(true)}
                    className="mt-6 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 transition-all"
                  >
                    Configure Syllabus
                  </button>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    language={context.language}
                    onShare={msg.action === 'SHARE_REPORT' ? handleShareProgress : undefined}
                  />
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3 w-full mb-5 animate-fade-in">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="px-4 py-3.5 bg-white dark:bg-slate-800 rounded-3xl rounded-tl-md shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                      <div className="flex space-x-1.5">
                        <div
                          className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        Thinking in {context.language}...
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Input Composer */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 pt-3 pb-4 z-20 transition-colors ${
            isDragging ? 'ring-2 ring-inset ring-brand-500 bg-brand-50/40 dark:bg-brand-950/30' : ''
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Suggested Chips */}
            {!isLoading &&
              !selectedImage &&
              suggestedTopics.length > 0 &&
              (isEdu || messages.length <= 1) && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {suggestedTopics.map((topic, i) => (
                    <button
                      type="button"
                      key={`${topic}-${i}`}
                      onClick={() => handleTopicClick(topic)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-700 dark:hover:text-brand-300 border border-slate-200/60 dark:border-slate-700/80 hover:border-brand-300 dark:hover:border-brand-700 transition-all whitespace-nowrap"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}

            <div className="relative">
              {selectedImage && (
                <div className="absolute bottom-full left-0 mb-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-slide-up">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Homework preview"
                      className="h-24 w-24 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      aria-label="Remove attached image"
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2 bg-slate-100/80 dark:bg-slate-800/90 p-2 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-sm">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload homework or textbook photo"
                  aria-label="Upload image"
                  className="p-2.5 sm:p-3 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors shrink-0"
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <ImageIcon className="w-5 h-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  disabled={!!initError}
                  placeholder={
                    initError
                      ? 'API setup required...'
                      : context.chapter
                      ? `Ask about ${context.chapter} in ${context.language}...`
                      : `Ask anything in ${context.language}... (or paste/drop an image)`
                  }
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none max-h-36 min-h-[44px] py-2.5 text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!inputText.trim() && !selectedImage) || isLoading || !!initError}
                  aria-label="Send message"
                  className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 shrink-0 ${
                    (!inputText.trim() && !selectedImage) || isLoading || !!initError
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-600 to-teal-600 text-white hover:from-brand-500 hover:to-teal-500 shadow-md shadow-brand-500/25'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between px-2 text-[11px] font-medium text-slate-400">
              <span>Press Enter to send • Shift + Enter for new line</span>
              <span>Supports math (LaTeX), SVG diagrams & photo doubts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
