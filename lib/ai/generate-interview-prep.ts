import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildInterviewPrepGenerationMessages,
  parseInterviewPrepGenerationResponse,
  profileToInterviewPrepSnapshot,
  type GeneratedInterviewPrep,
} from "@/lib/ai/interview-prep-generation";
import type { JobContext } from "@/lib/ai/resume-generation";
import type { MockProfile } from "@/lib/mock-data";
import type { ResumeDocument } from "@/lib/resume-document";

const INTERVIEW_PREP_MAX_TOKENS = 4000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function generateInterviewPrep(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  resume?: ResumeDocument | null;
}): Promise<GeneratedInterviewPrep> {
  const snapshot = profileToInterviewPrepSnapshot(params.profile);
  const { system, user } = buildInterviewPrepGenerationMessages({
    job: params.job,
    profile: snapshot,
    resume: params.resume,
  });
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: INTERVIEW_PREP_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseInterviewPrepGenerationResponse(result.text);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: INTERVIEW_PREP_MAX_TOKENS,
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
      return parseInterviewPrepGenerationResponse(retry.text);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable interview prep format.");
    }
  }
}
