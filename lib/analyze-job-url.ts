import type { AnalyzedJobPosting } from "./job-types";

export type { AnalyzedJobPosting } from "./job-types";
export type { JobMetadata } from "./types";

export async function analyzeJobPostingUrl(
  url: string
): Promise<AnalyzedJobPosting> {
  const res = await fetch("/api/analyze-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = (await res.json()) as AnalyzedJobPosting & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Could not analyze job posting URL.");
  }

  if (!data.jdText?.trim()) {
    throw new Error(
      "No job description found. Try an Indeed viewjob link or paste the JD manually."
    );
  }

  return data;
}
