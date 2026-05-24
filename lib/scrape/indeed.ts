import type { ExtractedJobFields, ScrapedPage } from "@/lib/scrape/types";

export function isIndeedJobUrl(rawUrl: string): boolean {
  try {
    const hostname = new URL(rawUrl.trim()).hostname.toLowerCase();
    return hostname.includes("indeed.");
  } catch {
    return false;
  }
}

export type IndeedJobMetadata = {
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
  extra?: Record<string, unknown>;
};

export function mapIndeedToScrapedPage(
  meta: IndeedJobMetadata,
  rawUrl: string,
): ScrapedPage {
  const title =
    (typeof meta.extra?.page_title === "string" ? meta.extra.page_title : "") ||
    meta.job_name ||
    "Indeed job posting";

  const textParts = [
    meta.job_name ? `Title: ${meta.job_name}` : "",
    meta.company ? `Company: ${meta.company}` : "",
    meta.location ? `Location: ${meta.location}` : "",
    meta.type_of_salary ? `Salary: ${meta.type_of_salary}` : "",
    meta.type_of_work ? `Work type: ${meta.type_of_work}` : "",
    meta.job_details,
  ].filter((part) => part.trim().length > 0);

  const text = textParts.join("\n").trim();

  return {
    url: rawUrl,
    finalUrl: meta.job_post_link || rawUrl,
    status: 200,
    title,
    text,
    html: "",
    textLength: text.length,
    htmlLength: 0,
    fetchedAt: meta.scraped_at || new Date().toISOString(),
  };
}

export function mapIndeedToExtracted(
  meta: IndeedJobMetadata,
): ExtractedJobFields {
  return {
    title: meta.job_name || "Untitled role",
    company: meta.company || "Unknown company",
    location: meta.location || "Remote",
    salary: meta.type_of_salary || "$0",
    source: "Indeed",
    jd: meta.job_details,
  };
}
