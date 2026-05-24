import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { generateTailoredCoverLetter } from "@/lib/ai/generate-cover-letter";
import type { JobContext } from "@/lib/ai/resume-generation";
import { isApiProviderId } from "@/lib/ai/types";
import type { MockProfile } from "@/lib/mock-data";
import type { ResumeDocument } from "@/lib/resume-document";

function isJobContext(value: unknown): value is JobContext {
  if (!value || typeof value !== "object") return false;
  const job = value as JobContext;
  return (
    typeof job.title === "string" &&
    typeof job.company === "string" &&
    typeof job.description === "string"
  );
}

function isProfile(value: unknown): value is MockProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as MockProfile;
  return (
    typeof profile.name === "string" &&
    Array.isArray(profile.skills) &&
    Array.isArray(profile.experience_entries)
  );
}

function isResumeDocument(value: unknown): value is ResumeDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as ResumeDocument;
  return typeof doc.name === "string" && Array.isArray(doc.experience);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      model?: string;
      job?: unknown;
      profile?: unknown;
      resume?: unknown;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    if (!isJobContext(body.job)) {
      return NextResponse.json({ error: "Invalid job context." }, { status: 400 });
    }

    if (!isProfile(body.profile)) {
      return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
    }

    const resume =
      body.resume === null || body.resume === undefined
        ? null
        : isResumeDocument(body.resume)
          ? body.resume
          : undefined;

    if (resume === undefined && body.resume != null) {
      return NextResponse.json({ error: "Invalid resume document." }, { status: 400 });
    }

    const result = await generateTailoredCoverLetter({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      job: body.job,
      profile: body.profile,
      resume,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/ai/generate-cover-letter]", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter." },
      { status: 500 },
    );
  }
}
