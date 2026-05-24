import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { formatProfileForExport } from "@/lib/ai/format-profile-export";
import { isApiProviderId } from "@/lib/ai/types";
import type { MockProfile } from "@/lib/mock-data";

function isMockProfile(value: unknown): value is MockProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as MockProfile;
  return typeof profile.name === "string" && Array.isArray(profile.skills);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      model?: string;
      profile?: unknown;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    if (!isMockProfile(body.profile)) {
      return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
    }

    const document = await formatProfileForExport({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      profile: body.profile,
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[POST /api/ai/export-profile]", error);
    return NextResponse.json(
      { error: "Failed to format profile for export." },
      { status: 500 },
    );
  }
}
