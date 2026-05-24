import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { isApiProviderId } from "@/lib/ai/types";
import { importJobFromUrl } from "@/lib/jobs/import-from-url";
import { isIndeedJobUrl } from "@/lib/scrape/indeed";
import { getJobsServiceOptions } from "@/lib/services/jobs-auth";
import { JobsServiceError } from "@/lib/services/jobs.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      providerId?: string;
      apiKey?: string;
      model?: string;
      create?: boolean;
    };

    if (!body.url?.trim()) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const indeed = isIndeedJobUrl(body.url);

    if (!indeed) {
      if (!body.providerId || !isApiProviderId(body.providerId)) {
        return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
      }

      if (!body.apiKey?.trim()) {
        return NextResponse.json({ error: "API key is required." }, { status: 400 });
      }
    }

    const result = await importJobFromUrl({
      url: body.url,
      providerId: body.providerId && isApiProviderId(body.providerId)
        ? body.providerId
        : undefined,
      apiKey: body.apiKey,
      model: body.model,
      create: body.create !== false,
      auth: await getJobsServiceOptions(),
    });

    return NextResponse.json(result, { status: result.job ? 201 : 200 });
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

    console.error("[POST /api/jobs/import-url]", error);
    return NextResponse.json({ error: "Failed to import job." }, { status: 500 });
  }
}
