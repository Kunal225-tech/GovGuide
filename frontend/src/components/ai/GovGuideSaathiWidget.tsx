import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  RotateCcw,
  ExternalLink,
  Bot,
  User as UserIcon,
  X,
  ChevronRight,
  Languages,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAiAssistant, type UiChatMessage } from '@/context/AiAssistantContext';

const QUICK_PROMPTS_EN = [
  'Bihar Student Credit Card scheme',
  'Mukhyamantri Udyami Yojana (₹10 Lakh)',
  'Mukhyamantri Kanya Utthan Yojana',
  'Vridhjan Pension (MVPY) & PM-KISAN',
];

const QUICK_PROMPTS_HI = [
  'बिहार स्टूडेंट क्रेडिट कार्ड योजना',
  'मुख्यमंत्री उद्यमी योजना (₹10 लाख सहायता)',
  'मुख्यमंत्री कन्या उत्थान योजना',
  'मुख्यमंत्री वृद्धजन पेंशन (MVPY)',
];

export function GovGuideSaathiWidget() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isOpen,
    closeAssistant,
    toggleAssistant,
    messages,
    isTyping,
    language,
    setLanguage,
    sendMessage,
    clearChat,
  } = useAiAssistant();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Close widget on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAssistant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const quickPrompts = language === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN;

  return (
    <>
      {/* Mobile Backdrop Overlay (only on mobile viewports to prevent background taps) */}
      {isOpen && (
        <div
          onClick={closeAssistant}
          aria-hidden="true"
          className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Floating Action Trigger Button: Solid Carbon rectangular button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center">
          <button
            onClick={toggleAssistant}
            aria-label="Need Help? Ask Saathi"
            aria-expanded={isOpen}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-stone-900 dark:bg-[#1C1B19] hover:bg-stone-800 dark:hover:bg-[#292826] text-[#F4F4F0] border border-stone-700 dark:border-[#2E2D2A] transition-colors active:scale-95 cursor-pointer text-xs sm:text-sm font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
            <MessageSquare className="w-4 h-4 text-stone-300" />
            <span>Need Help? Ask Saathi</span>
          </button>
        </div>
      )}

      {/* Floating Popover Widget: Clean 400px wide floating panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="GovGuide Saathi Helpdesk"
          aria-modal="false"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-20 sm:right-6 z-50 w-auto sm:w-[400px] h-[min(580px,85vh)] bg-white dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-200 dark:border-[#2E2D2A] bg-stone-50 dark:bg-[#141413] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834] flex items-center justify-center text-stone-700 dark:text-[#F4F4F0] shrink-0">
                <MessageSquare className="w-4 h-4 text-[#1E3A8A] dark:text-[#D95D39]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-[#F4F4F0] leading-tight">Need Help? Ask Saathi</h2>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 py-0 px-1.5 rounded-md">
                    Verified
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {language === 'hi' ? 'नागरिक कल्याणकारी योजना सहायता' : 'Citizen Welfare Helpdesk'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-[#292826] hover:bg-stone-100 dark:hover:bg-[#3A3834] border border-stone-200 dark:border-[#3A3834] transition-colors text-stone-800 dark:text-[#F4F4F0] cursor-pointer"
                title="Switch response language"
                aria-label="Switch response language"
              >
                <Languages className="w-3.5 h-3.5 text-stone-600 dark:text-[#A8A29E]" />
                <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-stone-200 dark:hover:bg-[#292826] transition-colors cursor-pointer"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeAssistant}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-stone-200 dark:hover:bg-[#292826] transition-colors cursor-pointer"
                title="Close helpdesk"
                aria-label="Close GovGuide Saathi Helpdesk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
              <div className="w-12 h-12 rounded-md bg-stone-100 dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834] flex items-center justify-center text-stone-700 dark:text-[#F4F4F0]">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  {language === 'hi' ? 'लॉगिन अनिवार्य है' : 'Sign In Required'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  {language === 'hi'
                    ? 'GovGuide साथी सहायता से योजनाओं की जानकारी लेने के लिए कृपया पहले अपने खाते में लॉगिन करें।'
                    : 'Please sign in to GovGuide to consult Saathi Helpdesk and discover verified schemes.'}
                </p>
              </div>
              <Button
                onClick={() => {
                  closeAssistant();
                  navigate('/login', { state: { from: location.pathname } });
                }}
                className="w-full max-w-xs h-10 rounded-md font-semibold bg-[#D95D39] hover:bg-[#C44D2B] text-white shadow-none text-xs"
              >
                <span>{language === 'hi' ? 'लॉगिन करें ➔' : 'Sign In to Continue ➔'}</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map((msg) => (
                  <ChatMessageItem key={msg.id} message={msg} />
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-stone-100 dark:bg-[#292826] text-stone-700 dark:text-[#F4F4F0] flex items-center justify-center shrink-0 border border-stone-200 dark:border-[#3A3834]">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-stone-100 dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834] px-3.5 py-2.5 rounded-md text-xs flex items-center gap-2 text-muted-foreground">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-[#A8A29E] animate-pulse" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-[#A8A29E] animate-pulse delay-150" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-[#A8A29E] animate-pulse delay-300" />
                      <span className="ml-1 text-stone-600 dark:text-[#A8A29E]">
                        {language === 'hi' ? 'योजनाओं की जांच कर रहा है...' : 'Searching verified schemes...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Popular Starters if conversation has only 1 initial message */}
                {messages.length <= 1 && !isTyping && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-stone-600 dark:text-[#A8A29E] mb-2">
                      {language === 'hi' ? 'सुझाए गए प्रश्न:' : 'Suggested questions:'}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickPrompt(prompt)}
                          className="text-left text-xs p-2.5 rounded-md bg-stone-50 dark:bg-[#141413] hover:bg-stone-100 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-800 dark:text-[#F4F4F0] transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="font-normal">{prompt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-[#A8A29E] group-hover:text-stone-700 dark:group-hover:text-[#F4F4F0] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input Area */}
              <div className="p-3.5 pt-3 pb-3.5 border-t border-stone-200 dark:border-[#2E2D2A] bg-stone-50 dark:bg-[#141413] shrink-0">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'अपनी भाषा (हिन्दी/English) में पूछें...'
                        : 'Ask in English, हिन्दी, or Hinglish...'
                    }
                    className="flex-1 bg-white dark:bg-[#1C1B19] border border-stone-300 dark:border-[#3A3834] focus:border-[#D95D39] rounded-md px-3 py-2 text-xs sm:text-sm text-foreground outline-hidden transition-colors shadow-none placeholder:text-stone-400 dark:placeholder:text-[#A8A29E]"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    size="sm"
                    className="h-9 px-3.5 rounded-md bg-[#D95D39] hover:bg-[#C44D2B] text-white shadow-none flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{t('common.send', 'Send')}</span>
                  </Button>
                </form>
                <p className="text-[10px] text-center text-muted-foreground mt-2 leading-tight select-none">
                  {language === 'hi'
                    ? 'GovGuide साथी आधिकारिक पोर्टल डेटा पर आधारित है। कृपया आवेदन से पहले विवरण सत्यापित करें।'
                    : 'GovGuide Saathi answers are grounded in official scheme portals. Please verify details before applying.'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function ChatMessageItem({ message }: { message: UiChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold border ${
          isUser
            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
            : 'bg-stone-100 dark:bg-[#292826] text-stone-700 dark:text-[#F4F4F0] border-stone-200 dark:border-[#3A3834]'
        }`}
      >
        {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message Bubble: Clean rectangular rounded-md */}
      <div
        className={`max-w-[85%] rounded-md px-3.5 py-2.5 text-xs sm:text-sm ${
          isUser
            ? 'bg-[#D95D39] text-white'
            : 'bg-stone-100 dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834] text-foreground'
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed space-y-1.5 font-normal">
          {renderMarkdownText(message.content)}
        </div>

        {/* Citations Card List */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-[#3A3834] space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Referenced Verified Schemes:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {message.citations.map((cite, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-md bg-white dark:bg-[#141413] border border-stone-200 dark:border-[#3A3834] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-semibold text-foreground line-clamp-1">{cite.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-stone-100 dark:bg-[#292826] text-stone-700 dark:text-[#F4F4F0] border-stone-300 dark:border-[#3A3834] rounded-sm">
                      {cite.category}
                    </Badge>
                  </div>

                  {cite.relevance_snippet && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                      "{cite.relevance_snippet}"
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-0.5 text-[10px] font-medium">
                    {cite.scheme_id && (
                      <Link
                        to={`/schemes/${cite.scheme_id}`}
                        className="text-[#EA580C] hover:underline flex items-center gap-1 font-semibold"
                      >
                        View in GovGuide ➔
                      </Link>
                    )}
                    {cite.official_url && (
                      <a
                        href={cite.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
                      >
                        Official Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lightweight markdown-like text parser for bold text (**text**) and bullet lists (* or -).
 */
function renderMarkdownText(text: string) {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Bullet point
    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    const content = isBullet ? line.trim().substring(2) : line;

    // Parse bold markdown **text**
    const parts = content.split(/(\*\*.*?\*\*)/g);

    const renderedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-[#EA580C] font-bold text-xs mt-0.5">•</span>
          <span className="flex-1">{renderedLine}</span>
        </div>
      );
    }

    if (!line.trim()) {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return <p key={lineIdx}>{renderedLine}</p>;
  });
}
