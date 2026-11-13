import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { getProfile } from '@/services/profileApi';
import {
  askSaathi,
  type ChatMessage,
  type SchemeCitation,
  type UserDemographics,
} from '@/services/aiApi';

export interface UiChatMessage extends ChatMessage {
  id: string;
  citations?: SchemeCitation[];
  timestamp: Date;
}

interface AiAssistantContextType {
  isOpen: boolean;
  openAssistant: (initialQuery?: string) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  messages: UiChatMessage[];
  isTyping: boolean;
  error: string | null;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  sendMessage: (query: string) => Promise<void>;
  clearChat: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

const GREETING_EN =
  "Namaste! 🙏 I am **GovGuide Bihar Saathi**, your citizen welfare assistant for Bihar. You can ask me about Bihar state schemes (Student Credit Card, Udyami Yojana, Kanya Utthan, pensions) and central schemes in **English**, **हिन्दी**, or **Hinglish**.\n\nHow can I help you today?";

const GREETING_HI =
  "नमस्ते! 🙏 मैं **GovGuide बिहार साथी** हूँ - बिहार के नागरिकों के लिए आपका कल्याणकारी योजनाओं का मार्गदर्शक। आप मुझसे बिहार सरकार की 7 निश्चय योजनाओं, मुख्यमंत्री उद्यमी योजना, कन्या उत्थान, छात्रवृत्ति या केंद्रीय योजनाओं के बारे में **हिन्दी** या **हिंग्लिश** में पूछ सकते हैं।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?";

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { user, updateUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>(() =>
    i18n.language?.startsWith('hi') ? 'hi' : 'en'
  );
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with global i18n changes
  useEffect(() => {
    const currentLang = i18n.language?.startsWith('hi') ? 'hi' : 'en';
    setLanguage(currentLang);
  }, [i18n.language]);

  const [messages, setMessages] = useState<UiChatMessage[]>(() => [
    {
      id: 'greeting',
      role: 'assistant',
      content: i18n.language?.startsWith('hi') ? GREETING_HI : GREETING_EN,
      timestamp: new Date(),
    },
  ]);

  // Update greeting when language changes if only greeting is present
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'greeting') {
        return [
          {
            id: 'greeting',
            role: 'assistant',
            content: language === 'hi' ? GREETING_HI : GREETING_EN,
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [language]);

  const sendMessage = useCallback(
    async (queryText: string) => {
      // Strip whitespace and any outer quotation marks or backticks (e.g. "...", '...', “...”, `...`)
      let cleaned = queryText.trim();
      cleaned = cleaned.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim();
      if (!cleaned || isTyping) return;

      setError(null);
      const userMsg: UiChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: cleaned,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        // Build conversation history (excluding initial greeting to save tokens)
        const history: ChatMessage[] = messages
          .filter((m) => m.id !== 'greeting')
          .map((m) => ({ role: m.role, content: m.content }));

        // Map authenticated user profile demographics if available
        let userDemographics: UserDemographics | undefined = undefined;
        let profileSource = user?.profile;

        // Fallback 1: check localStorage directly if React state is still empty
        if (!profileSource || Object.keys(profileSource).length === 0) {
          try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
              const parsed = JSON.parse(rawUser);
              if (parsed?.profile && Object.keys(parsed.profile).length > 0) {
                profileSource = parsed.profile;
              }
            }
          } catch {
            // ignore
          }
        }

        // Fallback 2: if still empty but user is logged in, fetch fresh profile from API
        if ((!profileSource || Object.keys(profileSource).length === 0) && localStorage.getItem('token')) {
          try {
            const freshUser = await getProfile();
            if (freshUser?.profile) {
              profileSource = freshUser.profile;
              if (updateUser) updateUser(freshUser);
            }
          } catch {
            // ignore
          }
        }

        if (profileSource) {
          const rawAge = profileSource.age;
          const rawIncome = profileSource.annualIncome;

          const demographics: UserDemographics = {
            age: rawAge !== undefined && rawAge !== null && !isNaN(Number(rawAge)) ? Number(rawAge) : undefined,
            gender: profileSource.gender ? String(profileSource.gender).trim() : undefined,
            state: profileSource.state ? String(profileSource.state).trim() : undefined,
            district: profileSource.district ? String(profileSource.district).trim() : undefined,
            annualIncome: rawIncome !== undefined && rawIncome !== null && !isNaN(Number(rawIncome)) ? Number(rawIncome) : undefined,
            occupation: profileSource.occupation ? String(profileSource.occupation).trim() : undefined,
            education: profileSource.education ? String(profileSource.education).trim() : undefined,
            category: profileSource.category ? String(profileSource.category).trim() : undefined,
          };

          // Only attach if at least one demographic field is filled
          const hasAny = Object.values(demographics).some((v) => v !== undefined && v !== '');
          if (hasAny) {
            userDemographics = demographics;
          }
        }

        // Detect if query is mostly Hindi characters (Devanagari \u0900-\u097F)
        const isHindiText = /[\u0900-\u097F]/.test(cleaned);
        const effectiveLang: 'en' | 'hi' = isHindiText ? 'hi' : language;

        const response = await askSaathi({
          query: cleaned,
          conversation_history: history,
          user_profile: userDemographics,
          language: effectiveLang,
          top_k: 4,
        });

        const assistantMsg: UiChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Unable to reach AI services right now. Please ensure ai-services is running on port 8000.';
        setError(errorMsg);

        const fallbackMsg: UiChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            language === 'hi'
              ? 'क्षमा करें, AI सेवा से संपर्क करने में समस्या आई है। कृपया सुनिश्चित करें कि AI सेवा चल रही है।'
              : 'Sorry, I encountered an issue connecting to the AI services. Please verify that `ai-services` is running on port 8000.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, language, user, updateUser]
  );

  const pendingQueryRef = useRef<string | null>(null);

  const openAssistant = useCallback(
    (initialQuery?: string) => {
      const trimmed = initialQuery?.trim();
      if (isOpen) {
        if (trimmed) {
          sendMessage(trimmed);
        }
        return;
      }
      if (trimmed) {
        pendingQueryRef.current = trimmed;
      }
      setIsOpen(true);
    },
    [isOpen, sendMessage]
  );

  // Send pending query after opening
  useEffect(() => {
    if (isOpen && pendingQueryRef.current) {
      const q = pendingQueryRef.current;
      pendingQueryRef.current = null;
      sendMessage(q);
    }
  }, [isOpen, sendMessage]);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'greeting',
        role: 'assistant',
        content: language === 'hi' ? GREETING_HI : GREETING_EN,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, [language]);

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        toggleAssistant,
        messages,
        isTyping,
        error,
        language,
        setLanguage,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error('useAiAssistant must be used within an AiAssistantProvider');
  }
  return context;
}
