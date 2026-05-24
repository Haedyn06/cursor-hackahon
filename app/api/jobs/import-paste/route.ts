import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { extractJobFromPage } from "@/lib/ai/extract-job-from-page";
import { isApiProviderId } from "@/lib/ai/types";
import { getJobsServiceOptions } from "@/lib/services/jobs-auth";
import { JobsServiceError, createJob } from "@/lib/services/jobs.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      pageText?: string;
      providerId?: string;
      apiKey?: string;
      model?: string;
      create?: boolean;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    const pageText = body.pageText?.trim() ?? "";
    if (pageText.length < 80) {
      return NextResponse.json(
        { error: "Paste more job posting text before importing." },
        { status: 400 },
      );
    }

    const url = body.url?.trim() ?? "";
    const extracted = await extractJobFromPage({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      input: {
        url,
        pageTitle: "Pasted job posting",
        pageText,
      },
    });

    if (body.create === false) {
      return NextResponse.json({ extracted });
    }

    const job = await createJob(
      {
        position: extracted.position,
        company: extracted.company,
        location: extracted.location,
        jobDesc: extracted.jobDesc,
        incomeRange: extracted.incomeRange,
        workType: extracted.workType,
        environmentType: extracted.environmentType,
        status: "Saved",
      },
      await getJobsServiceOptions(),
    );

    return NextResponse.json({ extracted, job }, { status: 201 });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/jobs/import-paste]", error);
    return NextResponse.json(
      { error: "Failed to import pasted job posting." },
      { status: 500 },
    );
  }
}
