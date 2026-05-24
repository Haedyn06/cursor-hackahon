import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildResumeRefineMessages,
  parseResumeRefineResponse,
  type RefineResumeResult,
} from "@/lib/ai/refine-resume";
import type { ResumeDocument } from "@/lib/resume-document";

const REFINE_MAX_TOKENS = 8192;

export async function refineResumeWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  resume: ResumeDocument;
  instruction: string;
  job?: JobContext;
}): Promise<RefineResumeResult> {
  const { system, user } = buildResumeRefineMessages(params);

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: REFINE_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: (text) => parseResumeRefineResponse(text, params.resume, params.job),
  });
}
