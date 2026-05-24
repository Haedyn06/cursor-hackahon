import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { generateTailoredResume } from "@/lib/ai/generate-resume";
import { parseJobContext } from "@/lib/jobs/job-context";
import {
  buildSourceMaterialContextFromRequest,
  parseSourceMaterialRequestItems,
} from "@/lib/ai/source-material-request";
import { isApiProviderId } from "@/lib/ai/types";
import type { MockProfile } from "@/lib/mock-data";

export const maxDuration = 120;
export const runtime = "nodejs";

function isProfile(value: unknown): value is MockProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as MockProfile;
  return (
    typeof profile.name === "string" &&
    Array.isArray(profile.skills) &&
    Array.isArray(profile.experience_entries)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      model?: string;
      job?: unknown;
      profile?: unknown;
      sourceMaterials?: unknown;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    const job = parseJobContext(body.job);
    if (!job) {
      return NextResponse.json({ error: "Invalid job context." }, { status: 400 });
    }

    if (!isProfile(body.profile)) {
      return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
    }

    const sourceMaterialContext = await buildSourceMaterialContextFromRequest(
      parseSourceMaterialRequestItems(body.sourceMaterials),
    );

    const result = await generateTailoredResume({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      job,
      profile: body.profile,
      sourceMaterialContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/ai/generate-resume]", error);
    return NextResponse.json(
      { error: "Failed to generate resume." },
      { status: 500 },
    );
  }
}
