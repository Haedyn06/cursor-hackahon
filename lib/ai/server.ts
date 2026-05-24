import "server-only";

import { AiProviderError, readProviderError } from "@/lib/ai/errors";
import { getProviderConfig } from "@/lib/ai/providers";
import type {
  ApiProviderId,
  ChatMessage,
  CompleteResult,
  VerifyResult,
} from "@/lib/ai/types";

const VERIFY_PROMPT = "Reply with exactly: ok";
const VERIFY_MAX_TOKENS = 16;

function trimApiKey(apiKey: string): string {
  return apiKey.trim();
}

function assertNonEmptyKey(apiKey: string): string {
  const trimmed = trimApiKey(apiKey);
  if (!trimmed) {
    throw new AiProviderError("API key is required.", 400);
  }
  return trimmed;
}

function pickUserMessage(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  return lastUser?.content.trim() || VERIFY_PROMPT;
}

async function callOpenAiCompatible(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  providerId: ApiProviderId;
  authHeader?: Record<string, string>;
  jsonMode?: boolean;
}): Promise<string> {
  const response = await fetch(params.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      ...params.authHeader,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens,
      ...(params.jsonMode
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });

  if (!response.ok) {
    const message = await readProviderError(response);
    throw new AiProviderError(message, response.status, params.providerId);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiProviderError("Provider returned an empty response.", 502, params.providerId);
  }

  return text;
}

async function callAnthropic(params: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<string> {
  const system = params.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n")
    .trim();

  const chatMessages = params.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens,
      ...(system ? { system } : {}),
      messages:
        chatMessages.length > 0
          ? chatMessages
          : [{ role: "user", content: VERIFY_PROMPT }],
    }),
  });

  if (!response.ok) {
    const message = await readProviderError(response);
    throw new AiProviderError(message, response.status, "anthropic");
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content
    ?.map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  if (!text) {
    throw new AiProviderError("Provider returned an empty response.", 502, "anthropic");
  }

  return text;
}

async function callGemini(params: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<string> {
  const prompt = pickUserMessage(params.messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: params.maxTokens },
    }),
  });

  if (!response.ok) {
    const message = await readProviderError(response);
    throw new AiProviderError(message, response.status, "gemini");
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new AiProviderError("Provider returned an empty response.", 502, "gemini");
  }

  return text;
}

async function invokeProvider(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  jsonMode?: boolean;
}): Promise<string> {
  switch (params.providerId) {
    case "openai":
      return callOpenAiCompatible({
        url: "https://api.openai.com/v1/chat/completions",
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
        providerId: "openai",
        jsonMode: params.jsonMode,
      });
    case "groq":
      return callOpenAiCompatible({
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
        providerId: "groq",
        jsonMode: params.jsonMode,
      });
    case "mistral":
      return callOpenAiCompatible({
        url: "https://api.mistral.ai/v1/chat/completions",
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
        providerId: "mistral",
        jsonMode: params.jsonMode,
      });
    case "together":
      return callOpenAiCompatible({
        url: "https://api.together.xyz/v1/chat/completions",
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
        providerId: "together",
        jsonMode: params.jsonMode,
      });
    case "anthropic":
      return callAnthropic({
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
      });
    case "gemini":
      return callGemini({
        apiKey: params.apiKey,
        model: params.model,
        messages: params.messages,
        maxTokens: params.maxTokens,
      });
    default:
      throw new AiProviderError("Unsupported provider.", 400, params.providerId);
  }
}

export async function verifyProviderKey(
  providerId: ApiProviderId,
  apiKey: string,
): Promise<VerifyResult> {
  const trimmedKey = assertNonEmptyKey(apiKey);
  const config = getProviderConfig(providerId);
  const messages: ChatMessage[] = [{ role: "user", content: VERIFY_PROMPT }];

  await invokeProvider({
    providerId,
    apiKey: trimmedKey,
    model: config.verifyModel,
    messages,
    maxTokens: VERIFY_MAX_TOKENS,
  });

  return {
    ok: true,
    providerId,
    model: config.defaultModel,
  };
}

export async function completeChat(params: {
  providerId: ApiProviderId;
  apiKey: string;
  messages: ChatMessage[];
  maxTokens?: number;
  model?: string;
  jsonMode?: boolean;
}): Promise<CompleteResult> {
  const trimmedKey = assertNonEmptyKey(params.apiKey);
  const config = getProviderConfig(params.providerId);
  const model = params.model?.trim() || config.defaultModel;
  const messages =
    params.messages.length > 0
      ? params.messages
      : [{ role: "user" as const, content: VERIFY_PROMPT }];

  const text = await invokeProvider({
    providerId: params.providerId,
    apiKey: trimmedKey,
    model,
    messages,
    maxTokens: params.maxTokens ?? 1024,
    jsonMode: params.jsonMode,
  });

  return {
    text,
    model,
    providerId: params.providerId,
  };
}
