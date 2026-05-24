import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { refineInterviewPrepWithAi } from "@/lib/ai/refine-interview-prep-server";
import { isApiProviderId } from "@/lib/ai/types";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";

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
      prep?: unknown;
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

    if (!isInterviewPrepContent(body.prep)) {
      return NextResponse.json({ error: "Invalid interview prep content." }, { status: 400 });
    }

    if (!body.instruction?.trim()) {
      return NextResponse.json({ error: "Instruction is required." }, { status: 400 });
    }

    const result = await refineInterviewPrepWithAi({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      prep: body.prep,
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

    console.error("[POST /api/ai/refine-interview-prep]", error);
    return NextResponse.json(
      { error: "Failed to refine interview prep." },
      { status: 500 },
    );
  }
}
