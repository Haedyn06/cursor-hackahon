import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildProfileAutofillMessages,
  parseProfileAutofillResponse,
  type AutofillProfilePayload,
} from "@/lib/ai/profile-autofill-generation";

const PROFILE_AUTOFILL_MAX_TOKENS = 5000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function autofillProfileFromSourceText(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  sourceText: string;
}): Promise<AutofillProfilePayload> {
  const sourceText = params.sourceText.trim();
  if (sourceText.length < 40) {
    throw new Error("Not enough text to extract a profile. Add a resume or paste more content.");
  }

  const { system, user } = buildProfileAutofillMessages(sourceText);
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: PROFILE_AUTOFILL_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseProfileAutofillResponse(result.text);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: PROFILE_AUTOFILL_MAX_TOKENS,
      jsonMode,
      messages: [
        ...messages,
        {
          role: "user" as const,
          content:
            "Your previous response could not be parsed. Reply with ONLY a valid JSON object matching the schema. No markdown.",
        },
      ],
    });

    try {
      return parseProfileAutofillResponse(retry.text);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable profile format.");
    }
  }
}
