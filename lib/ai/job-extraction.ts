import type { ExtractedJobFields } from "@/lib/scrape/types";
import { inferSourceFromUrl } from "@/lib/scrape/infer-source";

export type JobExtractionInput = {
  url: string;
  pageTitle: string;
  pageText: string;
};

function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON.");
  }
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function buildJobExtractionMessages(input: JobExtractionInput): {
  system: string;
  user: string;
} {
  const system = `You extract structured job posting data from scraped web page content.

Rules:
- Use ONLY information present in the page content. Do not invent employers, salaries, or requirements.
- If a field is missing, use an empty string.
- Put the full job description (requirements, responsibilities, qualifications) in "jobDesc".
- Keep jobDesc as plain text with line breaks where helpful.
- workType examples: Remote, Hybrid, On-site, Flexible
- environmentType examples: Full-time, Part-time, Contract, Internship, Temporary
- Return ONLY valid JSON with no markdown fences or commentary.

JSON schema:
{
  "position": string,
  "company": string,
  "location": string,
  "incomeRange": string,
  "workType": string,
  "environmentType": string,
  "jobDesc": string
}`;

  const user = `JOB POSTING URL
${input.url}

PAGE TITLE
${input.pageTitle || "Unknown"}

SCRAPED PAGE TEXT
${input.pageText}

Extract the job posting fields as JSON.`;

  return { system, user };
}

export function parseJobExtractionResponse(
  text: string,
  input: JobExtractionInput,
): ExtractedJobFields {
  const payload = extractJsonPayload(text);
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing job fields.");
  }

  const record = payload as Record<string, unknown>;
  const position =
    asString(record.position) ||
    asString(record.title) ||
    input.pageTitle ||
    "Untitled role";
  const company = asString(record.company) || "Unknown company";
  const jobDesc =
    asString(record.jobDesc) ||
    asString(record.jd) ||
    input.pageText.slice(0, 8000);

  if (!position && !company) {
    throw new Error("AI could not identify a job position or company from this page.");
  }

  void inferSourceFromUrl(input.url);

  return {
    position,
    company,
    location: asString(record.location, "Remote"),
    incomeRange:
      asString(record.incomeRange) || asString(record.salary, ""),
    workType: asString(record.workType),
    environmentType: asString(record.environmentType),
    jobDesc,
  };
}
