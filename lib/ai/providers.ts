import type { ApiProviderId } from "@/lib/ai/types";

export type AiProviderConfig = {
  id: ApiProviderId;
  name: string;
  defaultModel: string;
  verifyModel: string;
  keyUrl: string;
};

export const AI_PROVIDER_CONFIGS: Record<ApiProviderId, AiProviderConfig> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    verifyModel: "gpt-4o-mini",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-3-5-sonnet-latest",
    verifyModel: "claude-3-5-haiku-latest",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  groq: {
    id: "groq",
    name: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    verifyModel: "llama-3.1-8b-instant",
    keyUrl: "https://console.groq.com/keys",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    defaultModel: "gemini-2.5-flash",
    verifyModel: "gemini-2.5-flash-lite",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    defaultModel: "mistral-small-latest",
    verifyModel: "mistral-small-latest",
    keyUrl: "https://console.mistral.ai/api-keys/",
  },
  together: {
    id: "together",
    name: "Together AI",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    verifyModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    keyUrl: "https://api.together.ai/settings/api-keys",
  },
};

export function getProviderConfig(providerId: ApiProviderId): AiProviderConfig {
  return AI_PROVIDER_CONFIGS[providerId];
}

const DEPRECATED_GEMINI_MODELS: Record<string, string> = {
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-001": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite-001": "gemini-2.5-flash-lite",
};

export function resolveGeminiModel(model: string): string {
  const normalized = model.trim().replace(/^models\//, "");
  return DEPRECATED_GEMINI_MODELS[normalized] ?? normalized;
}

export function isDeprecatedGeminiModel(model: string): boolean {
  const normalized = model.trim().replace(/^models\//, "");
  return normalized in DEPRECATED_GEMINI_MODELS;
}
