import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { refineCoverLetterWithAi } from "@/lib/ai/refine-cover-letter-server";
import { isApiProviderId } from "@/lib/ai/types";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      model?: string;
      content?: string;
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

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Cover letter content is required." }, { status: 400 });
    }

    if (!body.instruction?.trim()) {
      return NextResponse.json({ error: "Instruction is required." }, { status: 400 });
    }

    const result = await refineCoverLetterWithAi({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      content: body.content.trim(),
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

    console.error("[POST /api/ai/refine-cover-letter]", error);
    return NextResponse.json(
      { error: "Failed to refine cover letter." },
      { status: 500 },
    );
  }
}
