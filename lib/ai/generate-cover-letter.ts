import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildCoverLetterGenerationMessages,
  parseCoverLetterGenerationResponse,
  profileToCoverLetterSnapshot,
  type GeneratedCoverLetter,
} from "@/lib/ai/cover-letter-generation";
import type { JobContext } from "@/lib/ai/resume-generation";
import type { MockProfile } from "@/lib/mock-data";
import type { ResumeDocument } from "@/lib/resume-document";

const COVER_LETTER_MAX_TOKENS = 4096;

export async function generateTailoredCoverLetter(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  resume?: ResumeDocument | null;
  sourceMaterialContext?: string;
}): Promise<GeneratedCoverLetter> {
  const snapshot = profileToCoverLetterSnapshot(params.profile);
  const { system, user } = buildCoverLetterGenerationMessages({
    job: params.job,
    profile: snapshot,
    resume: params.resume,
    sourceMaterialContext: params.sourceMaterialContext,
  });

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: COVER_LETTER_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: parseCoverLetterGenerationResponse,
  });
}
