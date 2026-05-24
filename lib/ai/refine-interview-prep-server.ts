import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildInterviewPrepRefineMessages,
  parseInterviewPrepRefineResponse,
  type RefineInterviewPrepResult,
} from "@/lib/ai/refine-interview-prep";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";

const REFINE_MAX_TOKENS = 8192;

export async function refineInterviewPrepWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  prep: InterviewPrepContent;
  instruction: string;
  job?: JobContext;
}): Promise<RefineInterviewPrepResult> {
  const { system, user } = buildInterviewPrepRefineMessages(params);

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: REFINE_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: (text) => parseInterviewPrepRefineResponse(text, params.prep),
  });
}
