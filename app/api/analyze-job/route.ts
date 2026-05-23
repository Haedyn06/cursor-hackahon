import {
  indeedJsonToAnalyzed,
  parsedHtmlToAnalyzed,
} from "@/lib/ai-job-analyzer";
import { isIndeedUrl } from "@/lib/job-types";
import {
  isValidJobUrl,
  parseJobHtml,
} from "@/lib/job-posting-parser";
import { runIndeedScraper } from "@/lib/run-indeed-scraper";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let url: string;

  try {
    const body = (await request.json()) as { url?: string };
    url = body.url?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!url || !isValidJobUrl(url)) {
    return NextResponse.json(
      { error: "Enter a valid http(s) job posting URL." },
      { status: 400 }
    );
  }

  try {
    if (isIndeedUrl(url)) {
      const scraped = await runIndeedScraper(url);
      if (!scraped.job_details?.trim()) {
        return NextResponse.json(
          {
            error:
              "Indeed returned no job description. Log in via headed scraper locally or paste the JD.",
          },
          { status: 422 }
        );
      }
      const analyzed = await indeedJsonToAnalyzed(scraped, url);
      return NextResponse.json(analyzed);
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Could not load this page (HTTP ${response.status}). For Indeed links, use ca.indeed.com/viewjob?jk=…`,
        },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return NextResponse.json(
        { error: "This URL did not return a readable HTML page." },
        { status: 422 }
      );
    }

    const html = await response.text();
    const parsed = parseJobHtml(html, url);

    if (parsed.jdText.length < 80) {
      return NextResponse.json(
        {
          error:
            "Too little text extracted. For Indeed, paste the full indeed.com/viewjob URL.",
        },
        { status: 422 }
      );
    }

    const analyzed = await parsedHtmlToAnalyzed(parsed);
    return NextResponse.json(analyzed);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to analyze job posting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
