import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles, Volume2 } from 'lucide-react';
import { ChatMessage, Language } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  language?: Language;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, language = Language.ENGLISH }) => {
  const isUser = message.role === 'user';

  const speakText = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(message.text);
      
      let langCode = 'en-IN';
      switch (language) {
        case Language.HINDI: langCode = 'hi-IN'; break;
        case Language.MARATHI: langCode = 'mr-IN'; break;
        case Language.TELUGU: langCode = 'te-IN'; break;
        case Language.TAMIL: langCode = 'ta-IN'; break;
        case Language.BENGALI: langCode = 'bn-IN'; break;
        default: langCode = 'en-IN';
      }
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex w-full mb-4 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'} gap-1`}>
        
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
            isUser 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>

          <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} w-full`}>
            {message.image && (
              <div className="overflow-hidden rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg max-w-[200px] mb-1">
                <img src={message.image} alt="Uploaded" className="w-full h-auto object-cover" />
              </div>
            )}

            {(message.text || !message.image) && (
              <div className={`relative px-6 py-4 shadow-sm text-base leading-relaxed group w-full overflow-hidden ${
                isUser 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[2rem] rounded-bl-sm border border-slate-100 dark:border-slate-700'
              } ${message.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600' : ''}`}>
                
                <div className={`markdown-content ${isUser ? 'prose-invert' : 'dark:text-slate-200'}`}>
                   <ReactMarkdown 
                     components={{
                       p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                       ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                       strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                       code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          if (match && match[1] === 'svg') {
                            const svgContent = String(children).replace(/\n$/, '');
                            return <div className="my-4 p-4 bg-white rounded-xl border border-slate-200 shadow-inner flex justify-center" dangerouslySetInnerHTML={{ __html: svgContent }} />;
                          }
                          return <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isUser ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'} ${className || ''}`} {...props}>{children}</code>;
                       }
                     }}
                   >
                     {message.text}
                   </ReactMarkdown>
                </div>
                
                {!isUser && (
                  <div className="absolute bottom-2 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={speakText} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400">
                        <Volume2 className="w-3 h-3" />
                      </button>
                  </div>
                )}
              </div>
            )}
            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;