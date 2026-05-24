import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
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

const INTERVIEW_PREP_MAX_TOKENS = 8192;

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

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: INTERVIEW_PREP_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: parseInterviewPrepGenerationResponse,
  });
}
