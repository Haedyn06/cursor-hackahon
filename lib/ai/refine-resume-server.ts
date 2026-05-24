import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildResumeRefineMessages,
  parseResumeRefineResponse,
  type RefineResumeResult,
} from "@/lib/ai/refine-resume";
import type { ResumeDocument } from "@/lib/resume-document";

const REFINE_MAX_TOKENS = 4000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function refineResumeWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  resume: ResumeDocument;
  instruction: string;
  job?: JobContext;
}): Promise<RefineResumeResult> {
  const { system, user } = buildResumeRefineMessages(params);
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
    return parseResumeRefineResponse(result.text, params.resume);
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
      return parseResumeRefineResponse(retry.text, params.resume);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable refined resume.");
    }
  }
}
