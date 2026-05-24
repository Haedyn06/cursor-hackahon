import "server-only";

import { extractJobFromPage } from "@/lib/ai/extract-job-from-page";
import type { ApiProviderId } from "@/lib/ai/types";
import { isIndeedJobUrl } from "@/lib/scrape/indeed";
import { scrapeIndeedJobPage } from "@/lib/scrape/indeed-scraper";
import { scrapeJobPage } from "@/lib/scrape/scrape-page";
import type { ExtractedJobFields, ScrapedPage } from "@/lib/scrape/types";
import { createJob, type JobsServiceOptions } from "@/lib/services/jobs.service";
import type { Job } from "@/lib/types/job";

export type ImportJobFromUrlResult = {
  scraped: ScrapedPage;
  extracted: ExtractedJobFields;
  job?: Job;
};

export async function importJobFromUrl(params: {
  url: string;
  providerId?: ApiProviderId;
  apiKey?: string;
  model?: string;
  create?: boolean;
  auth?: JobsServiceOptions;
}): Promise<ImportJobFromUrlResult> {
  let scraped: ScrapedPage;
  let extracted: ExtractedJobFields;

  if (isIndeedJobUrl(params.url)) {
    const indeed = await scrapeIndeedJobPage(params.url);
    scraped = indeed.scraped;
    extracted = indeed.extracted;
  } else {
    if (!params.providerId || !params.apiKey?.trim()) {
      throw new Error("AI provider credentials are required for non-Indeed job URLs.");
    }

    scraped = await scrapeJobPage(params.url);
    extracted = await extractJobFromPage({
      providerId: params.providerId,
      apiKey: params.apiKey,
      model: params.model,
      input: {
        url: scraped.finalUrl || scraped.url,
        pageTitle: scraped.title,
        pageText: scraped.text,
      },
    });
  }

  if (params.create === false) {
    return { scraped, extracted };
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
    params.auth,
  );

  return { scraped, extracted, job };
}
