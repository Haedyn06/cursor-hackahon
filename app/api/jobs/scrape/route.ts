import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { scrapeJobPage } from "@/lib/scrape/scrape-page";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };

    if (!body.url?.trim()) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const scraped = await scrapeJobPage(body.url);
    return NextResponse.json({ scraped });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[POST /api/jobs/scrape]", error);
    return NextResponse.json({ error: "Failed to scrape job page." }, { status: 500 });
  }
}
