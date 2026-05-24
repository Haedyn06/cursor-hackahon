import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { refineResumeWithAi } from "@/lib/ai/refine-resume-server";
import { isApiProviderId } from "@/lib/ai/types";
import type { ResumeDocument } from "@/lib/resume-document";

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
      resume?: unknown;
      instruction?: string;
      job?: {
        title?: string;
        company?: string;
        description?: string;
      };
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    if (!isResumeDocument(body.resume)) {
      return NextResponse.json({ error: "Invalid resume document." }, { status: 400 });
    }

    if (!body.instruction?.trim()) {
      return NextResponse.json({ error: "Instruction is required." }, { status: 400 });
    }

    const result = await refineResumeWithAi({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      resume: body.resume,
      instruction: body.instruction.trim(),
      job: body.job?.title && body.job?.company
        ? {
            title: body.job.title,
            company: body.job.company,
            description: body.job.description ?? "",
          }
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/ai/refine-resume]", error);
    return NextResponse.json(
      { error: "Failed to refine resume." },
      { status: 500 },
    );
  }
}
