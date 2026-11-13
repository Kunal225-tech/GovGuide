// aiApi.ts -- Client service for GovGuide Saathi AI microservice.

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SchemeCitation {
  scheme_id: string;
  name: string;
  category: string;
  level: string;
  state?: string;
  official_url?: string;
  relevance_snippet?: string;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  annualIncome?: number;
  occupation?: string;
  education?: string;
  category?: string;
}

export interface ChatRequest {
  query: string;
  conversation_history?: ChatMessage[];
  user_profile?: UserDemographics;
  language?: 'en' | 'hi';
  top_k?: number;
}

export interface ChatResponse {
  answer: string;
  citations: SchemeCitation[];
  language: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedProfile {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  annualIncome?: number | null;
  occupation?: string | null;
  education?: string | null;
  category?: string | null;
  confidence_notes?: string | null;
  privacy_warning?: string | null;
  missing_fields?: string[];
}

export interface ProfileExtractResponse {
  success: boolean;
  profile: ExtractedProfile;
  message: string;
  extraction_source?: 'llm' | 'fallback' | string;
}

// Support VITE_AI_SERVICE_URL override or standard /ai-service proxy path
const AI_BASE_URL = (import.meta.env.VITE_AI_SERVICE_URL as string | undefined)?.replace(/\/$/, '') || '/ai-service';

const PRIMARY_CHAT_URL = `${AI_BASE_URL}/api/v1/chat`;
const PRIMARY_EXTRACT_URL = `${AI_BASE_URL}/api/v1/profile/extract`;

// Only attempt direct 127.0.0.1:8000 fallback during local development
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1');

const FALLBACK_CHAT_URL = isLocalhost ? 'http://127.0.0.1:8000/api/v1/chat' : null;
const FALLBACK_EXTRACT_URL = isLocalhost ? 'http://127.0.0.1:8000/api/v1/profile/extract' : null;

export async function askSaathi(request: ChatRequest): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetch(PRIMARY_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (err) {
    if (FALLBACK_CHAT_URL) {
      // If local Vite proxy failed, retry directly against local AI service port
      response = await fetch(FALLBACK_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI assistant error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function extractProfileWithAi(
  text: string,
  language: 'en' | 'hi' = 'en'
): Promise<ProfileExtractResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  const payload = JSON.stringify({ text, language });
  let response: Response;

  try {
    try {
      response = await fetch(PRIMARY_EXTRACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('AI extraction timed out. Please try again or fill the form directly.', { cause: err });
      }
      if (FALLBACK_EXTRACT_URL) {
        // If local Vite proxy failed, retry directly against local AI service port
        response = await fetch(FALLBACK_EXTRACT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
      } else {
        throw err;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.detail) detail = String(parsed.detail);
    } catch {
      // keep raw errorText
    }
    throw new Error(detail || `Profile extraction error (${response.status})`);
  }

  return response.json();
}

