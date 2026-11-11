import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  User,
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Info,
  Shapes
} from 'lucide-react';
import { ChatMessage, Language } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  language?: Language;
  onShare?: () => void;
}

const getSpeechLangCode = (language: Language): string => {
  switch (language) {
    case Language.HINDI:
      return 'hi-IN';
    case Language.MARATHI:
      return 'mr-IN';
    case Language.TELUGU:
      return 'te-IN';
    case Language.TAMIL:
      return 'ta-IN';
    case Language.BENGALI:
      return 'bn-IN';
    case Language.KANNADA:
      return 'kn-IN';
    case Language.GUJARATI:
      return 'gu-IN';
    case Language.MALAYALAM:
      return 'ml-IN';
    default:
      return 'en-IN';
  }
};

const stripMarkdownForSpeech = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, ' Diagram or code omitted. ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[*_`>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  language = Language.ENGLISH,
  onShare
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';
  const isSystemNotice =
    !isUser &&
    !message.isError &&
    (message.id.startsWith('sys-') ||
      message.text.startsWith('_[System]:') ||
      message.text.startsWith('_[Adaptive Learning]:'));

  if (isSystemNotice) {
    const cleanNotice = message.text.replace(/^_|_$/g, '');
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 font-medium shadow-sm">
          <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              strong: ({ children }) => (
                <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
              )
            }}
          >
            {cleanNotice}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = stripMarkdownForSpeech(message.text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getSpeechLangCode(language);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`flex w-full mb-5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2.5 sm:mr-3 mt-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[86%] sm:max-w-[78%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 sm:px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-brand-600 dark:to-teal-600 text-white rounded-tr-md'
              : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-md'
          } ${
            message.isError
              ? '!bg-rose-50 dark:!bg-rose-950/50 !text-rose-700 dark:!text-rose-300 !border-rose-200 dark:!border-rose-800'
              : ''
          }`}
        >
          {message.image && (
            <div className="mb-3 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5">
              <img
                src={message.image}
                alt="Uploaded attachment"
                className="max-h-72 w-auto object-contain rounded-xl mx-auto"
              />
            </div>
          )}

          <div
            className={`markdown-content break-words ${
              isUser ? 'text-white' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-extrabold mt-2 mb-1.5 font-display">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-extrabold mt-2 mb-1 font-display">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1 font-display">{children}</h3>
                ),
                p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc ml-5 mb-2.5 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-5 mb-2.5 space-y-1">{children}</ol>
                ),
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-brand-400 pl-3.5 italic my-2.5 text-slate-600 dark:text-slate-300">
                    {children}
                  </blockquote>
                ),
                pre: ({ children }) => (
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs my-2.5">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  if (match && match[1] === 'svg') {
                    const svgContent = String(children).replace(/\n$/, '');
                    return (
                      <div className="my-3 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white shadow-sm">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Shapes className="w-3.5 h-3.5 text-brand-600" />
                          Visual Diagram
                        </div>
                        <div
                          className="p-4 flex justify-center items-center overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
                          dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                      </div>
                    );
                  }
                  const isBlock = Boolean(match);
                  if (isBlock) {
                    return (
                      <code className={`font-mono text-xs ${className || ''}`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-semibold ${
                        isUser
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-brand-700 dark:text-brand-300'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Share Progress Action */}
          {message.action === 'SHARE_REPORT' && (
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={onShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:-translate-y-0.5"
              >
                <Share2 className="w-4 h-4" />
                Share Progress Report
              </button>
            </div>
          )}
        </div>

        {/* Footer Metadata & Actions */}
        <div className="flex items-center gap-2.5 mt-1.5 px-1.5">
          <span className="text-[11px] text-slate-400 font-semibold">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {!isUser && !message.isError && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSpeak}
                className={`p-1 rounded-lg transition-colors ${
                  isSpeaking
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50'
                    : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Listen'}
                aria-label={isSpeaking ? 'Stop reading aloud' : 'Listen to response'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-2.5 sm:ml-3 mt-1 hidden sm:flex">
          <div className="w-8 h-8 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <User className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;
