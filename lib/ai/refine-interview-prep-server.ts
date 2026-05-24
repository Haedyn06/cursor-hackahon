import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildInterviewPrepRefineMessages,
  parseInterviewPrepRefineResponse,
  type RefineInterviewPrepResult,
} from "@/lib/ai/refine-interview-prep";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";

const REFINE_MAX_TOKENS = 4000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function refineInterviewPrepWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  prep: InterviewPrepContent;
  instruction: string;
  job?: JobContext;
}): Promise<RefineInterviewPrepResult> {
  const { system, user } = buildInterviewPrepRefineMessages(params);
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
    return parseInterviewPrepRefineResponse(result.text, params.prep);
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
      return parseInterviewPrepRefineResponse(retry.text, params.prep);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable refined interview prep.");
    }
  }
}
