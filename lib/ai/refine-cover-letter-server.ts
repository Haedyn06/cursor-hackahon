import "server-only";

import { completeStructuredJson } from "@/lib/ai/structured-generation";
import type { ApiProviderId } from "@/lib/ai/types";
import type { JobContext } from "@/lib/ai/resume-generation";
import {
  buildCoverLetterRefineMessages,
  parseCoverLetterRefineResponse,
  type RefineCoverLetterResult,
} from "@/lib/ai/refine-cover-letter";

const REFINE_MAX_TOKENS = 4096;

export async function refineCoverLetterWithAi(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  content: string;
  instruction: string;
  job?: JobContext;
}): Promise<RefineCoverLetterResult> {
  const { system, user } = buildCoverLetterRefineMessages(params);

  return completeStructuredJson({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: REFINE_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    parse: (text) => parseCoverLetterRefineResponse(text, params.content),
  });
}
