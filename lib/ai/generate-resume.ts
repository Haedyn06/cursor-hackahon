import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildResumeGenerationMessages,
  parseResumeGenerationResponse,
  profileToSnapshot,
  type GeneratedResumeAnalysis,
  type JobContext,
} from "@/lib/ai/resume-generation";
import type { MockProfile } from "@/lib/mock-data";

const RESUME_GENERATION_MAX_TOKENS = 8192;

export async function generateTailoredResume(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  sourceMaterialContext?: string;
}): Promise<GeneratedResumeAnalysis> {
  const snapshot = profileToSnapshot(params.profile);
  const { system, user } = buildResumeGenerationMessages(
    params.job,
    snapshot,
    params.sourceMaterialContext,
  );

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: RESUME_GENERATION_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: (text) => parseResumeGenerationResponse(text, snapshot, params.job),
  });
}
