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
  missing_fields?: string[];
}

export interface ProfileExtractResponse {
  success: boolean;
  profile: ExtractedProfile;
  message: string;
}

// Support both proxied endpoint and direct localhost:8000
const PRIMARY_CHAT_URL = '/ai-service/api/v1/chat';
const FALLBACK_CHAT_URL = 'http://127.0.0.1:8000/api/v1/chat';

const PRIMARY_EXTRACT_URL = '/ai-service/api/v1/profile/extract';
const FALLBACK_EXTRACT_URL = 'http://127.0.0.1:8000/api/v1/profile/extract';

export async function askSaathi(request: ChatRequest): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetch(PRIMARY_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    // If proxy failed, retry directly to AI service port
    response = await fetch(FALLBACK_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI assistant error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function extractProfileWithAi(text: string): Promise<ProfileExtractResponse> {
  let response: Response;
  try {
    response = await fetch(PRIMARY_EXTRACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    response = await fetch(FALLBACK_EXTRACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Profile extraction error (${response.status}): ${errorText}`);
  }

  return response.json();
}

