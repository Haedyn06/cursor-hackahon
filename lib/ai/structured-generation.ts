import "server-only";

import { AiProviderError } from "@/lib/ai/errors";
import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId, ChatMessage } from "@/lib/ai/types";

export function supportsProviderJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together" ||
    providerId === "gemini"
  );
}

const RETRY_PROMPT =
  "Your previous response could not be parsed. Reply with ONLY a valid JSON object matching the schema. No markdown, no commentary, no code fences.";

const TRUNCATION_RETRY_PROMPT =
  "Your previous response was cut off. Reply with ONLY a complete, valid JSON object matching the schema. Be slightly more concise if needed so the full JSON fits.";

export async function completeStructuredJson<T>(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  maxTokens: number;
  messages: ChatMessage[];
  parse: (text: string) => T;
}): Promise<T> {
  const jsonMode = supportsProviderJsonMode(params.providerId);
  let lastError: unknown;
  let lastText = "";
  let messages = params.messages;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let result;
    try {
      result = await completeChat({
        providerId: params.providerId,
        apiKey: params.apiKey,
        model: params.model,
        maxTokens: params.maxTokens,
        jsonMode,
        messages,
      });
    } catch (error) {
      lastError = error;
      if (error instanceof AiProviderError && attempt < 2) {
        messages = [
          ...params.messages,
          { role: "user" as const, content: TRUNCATION_RETRY_PROMPT },
        ];
        continue;
      }
      throw error;
    }

    lastText = result.text;

    try {
      return params.parse(result.text);
    } catch (error) {
      lastError = error;

      const retryPrompt =
        attempt === 1 && result.text.trim().endsWith(",")
          ? TRUNCATION_RETRY_PROMPT
          : RETRY_PROMPT;

      messages = [
        ...params.messages,
        { role: "assistant" as const, content: result.text },
        { role: "user" as const, content: retryPrompt },
      ];
    }
  }

  if (lastError instanceof Error) {
    if (lastText && lastText.length > 500) {
      throw new Error(
        `${lastError.message} The response may have been cut off — try Groq or shorten your profile.`,
      );
    }
    throw lastError;
  }

  throw new Error("AI returned an unreadable response.");
}
