import "server-only";

import { completeChat } from "@/lib/ai/server";
import type { ApiProviderId } from "@/lib/ai/types";
import {
  buildProfileExportMessages,
  parseProfileExportResponse,
  profileToExportSnapshot,
} from "@/lib/ai/profile-export-generation";
import type { ProfileExportDocument } from "@/lib/profile-export";
import type { MockProfile } from "@/lib/mock-data";

const PROFILE_EXPORT_MAX_TOKENS = 4000;

function supportsJsonMode(providerId: ApiProviderId): boolean {
  return (
    providerId === "openai" ||
    providerId === "groq" ||
    providerId === "mistral" ||
    providerId === "together"
  );
}

export async function formatProfileForExport(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  profile: MockProfile;
}): Promise<ProfileExportDocument> {
  const snapshot = profileToExportSnapshot(params.profile);
  const { system, user } = buildProfileExportMessages(snapshot);
  const jsonMode = supportsJsonMode(params.providerId);
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];

  const result = await completeChat({
    providerId: params.providerId,
    apiKey: params.apiKey,
    model: params.model,
    maxTokens: PROFILE_EXPORT_MAX_TOKENS,
    jsonMode,
    messages,
  });

  try {
    return parseProfileExportResponse(result.text, params.profile);
  } catch (firstError) {
    const retry = await completeChat({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      maxTokens: PROFILE_EXPORT_MAX_TOKENS,
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
      return parseProfileExportResponse(retry.text, params.profile);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI returned an unreadable profile export format.");
    }
  }
}
