export const API_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "groq",
  "gemini",
  "mistral",
  "together",
] as const;

export type ApiProviderId = (typeof API_PROVIDER_IDS)[number];

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type VerifyResult = {
  ok: true;
  providerId: ApiProviderId;
  model: string;
};

export type CompleteResult = {
  text: string;
  model: string;
  providerId: ApiProviderId;
};

export function isApiProviderId(value: string): value is ApiProviderId {
  return (API_PROVIDER_IDS as readonly string[]).includes(value);
}
