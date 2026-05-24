import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildResumeGenerationMessages,
  parseResumeGenerationResponse,
  profileToSnapshot,
  type GeneratedResumeAnalysis,
  type JobContext,
} from "@/lib/ai/resume-generation";
import type { MockProfile } from "@/lib/mock-data";

const RESUME_GENERATION_MAX_TOKENS = 5000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function generateTailoredResume(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
}): Promise<GeneratedResumeAnalysis> {
  const snapshot = profileToSnapshot(params.profile);
  const { system, user } = buildResumeGenerationMessages(params.job, snapshot);
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: RESUME_GENERATION_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseResumeGenerationResponse(result.text, snapshot, params.job);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: RESUME_GENERATION_MAX_TOKENS,
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
      return parseResumeGenerationResponse(retry.text, snapshot, params.job);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable resume format.");
    }
  }
}
