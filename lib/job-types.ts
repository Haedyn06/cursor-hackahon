import type { JobMetadata } from "./types";

export type { JobMetadata };

/** Unified job analysis result (Python scraper + AI metadata pass). */
export interface AnalyzedJobPosting {
  jobTitle: string;
  company: string;
  jdText: string;
  url: string;
  source: string;
  metadata: JobMetadata;
}

/** Raw JSON shape from scripts/scrape_indeed_job.py */
export interface IndeedScraperJson {
  job_name: string;
  company: string;
  type_of_work: string;
  type_of_salary: string;
  location: string;
  job_post_link: string;
  application_date: string | null;
  job_details: string;
  job_key: string;
  source: string;
  scraped_at: string;
}

export function isIndeedUrl(url: string) {
  try {
    return /indeed\./i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
