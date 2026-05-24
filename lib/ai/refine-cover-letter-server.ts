import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildCoverLetterRefineMessages,
  parseCoverLetterRefineResponse,
  type RefineCoverLetterResult,
} from "@/lib/ai/refine-cover-letter";

const REFINE_MAX_TOKENS = 2000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function refineCoverLetterWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  content: string;
  instruction: string;
  job?: JobContext;
}): Promise<RefineCoverLetterResult> {
  const { system, user } = buildCoverLetterRefineMessages(params);
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: REFINE_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseCoverLetterRefineResponse(result.text, params.content);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: REFINE_MAX_TOKENS,
      jsonMode,
      messages: [
        ...messages,
        {
          role: "user" as const,
          content:
            "Your previous response could not be parsed. Reply with ONLY valid JSON matching the schema. No markdown.",
        },
      ],
    });

    try {
      return parseCoverLetterRefineResponse(retry.text, params.content);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable refined cover letter.");
    }
  }
}
