import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildJobExtractionMessages,
  parseJobExtractionResponse,
  type JobExtractionInput,
} from "@/lib/ai/job-extraction";
import type { ExtractedJobFields } from "@/lib/scrape/types";

const EXTRACTION_MAX_TOKENS = 2500;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function extractJobFromPage(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  input: JobExtractionInput;
}): Promise<ExtractedJobFields> {
  const { system, user } = buildJobExtractionMessages(params.input);
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: EXTRACTION_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseJobExtractionResponse(result.text, params.input);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: EXTRACTION_MAX_TOKENS,
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
      return parseJobExtractionResponse(retry.text, params.input);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned unreadable job data.");
    }
  }
}
