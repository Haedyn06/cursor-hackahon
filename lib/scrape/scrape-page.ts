import "server-only";

import { AiProviderError } from "@/lib/ai/errors";
import { isIndeedJobUrl } from "@/lib/scrape/indeed";
import { scrapeIndeedJobPage } from "@/lib/scrape/indeed-scraper";
import {
  extractPageTitle,
  htmlToPlainText,
  truncateText,
} from "@/lib/scrape/html-to-text";
import type { ScrapedPage } from "@/lib/scrape/types";
import { assertScrapeableUrl } from "@/lib/scrape/validate-url";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_RESPONSE_HTML_CHARS = 50_000;
const MAX_TEXT_CHARS = 14_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function scrapeJobPage(rawUrl: string): Promise<ScrapedPage> {
  if (isIndeedJobUrl(rawUrl)) {
    const { scraped } = await scrapeIndeedJobPage(rawUrl);
    return scraped;
  }

  return scrapeGenericJobPage(rawUrl);
}

async function scrapeGenericJobPage(rawUrl: string): Promise<ScrapedPage> {
  const url = assertScrapeableUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "User-Agent": USER_AGENT,
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new AiProviderError(
        "URL did not return an HTML page. Try pasting the job details manually.",
        422,
      );
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new AiProviderError("Page is too large to scrape.", 413);
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const title = extractPageTitle(html) || url.hostname;
    const text = truncateText(htmlToPlainText(html), MAX_TEXT_CHARS);

    if (text.length < 120) {
      throw new AiProviderError(
        "Could not extract enough text from this page. The site may block scrapers — try manual entry.",
        422,
      );
    }

    return {
      url: url.toString(),
      finalUrl: response.url,
      status: response.status,
      title,
      text,
      html: html.slice(0, MAX_RESPONSE_HTML_CHARS),
      textLength: text.length,
      htmlLength: html.length,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof AiProviderError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("Timed out while fetching the job page.", 504);
    }

    throw new AiProviderError(
      "Failed to fetch the job page. Check the URL or try manual entry.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
