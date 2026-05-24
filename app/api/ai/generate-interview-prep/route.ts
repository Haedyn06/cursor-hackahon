import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { generateInterviewPrep } from "@/lib/ai/generate-interview-prep";
import { parseJobContext } from "@/lib/jobs/job-context";
import { isApiProviderId } from "@/lib/ai/types";
import type { MockProfile } from "@/lib/mock-data";
import type { ResumeDocument } from "@/lib/resume-document";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";

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

function isResumeDocument(value: unknown): value is ResumeDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as ResumeDocument;
  return typeof doc.name === "string" && Array.isArray(doc.experience);
}

function isInterviewPrepContent(value: unknown): value is InterviewPrepContent {
  if (!value || typeof value !== "object") return false;
  const prep = value as InterviewPrepContent;
  return Array.isArray(prep.categories) && typeof prep.questions === "object";
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

    const job = parseJobContext(body.job);
    if (!job) {
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

    const result = await generateInterviewPrep({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      job,
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

    console.error("[POST /api/ai/generate-interview-prep]", error);
    return NextResponse.json(
      { error: "Failed to generate interview prep." },
      { status: 500 },
    );
  }
}
