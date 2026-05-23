import type { AnalyzedJobPosting, IndeedScraperJson } from "./job-types";
import type { JobMetadata } from "./types";
import type { ParsedJobPosting } from "./job-posting-parser";

const SKILL_PATTERNS = [
  /\b(React|Next\.?js|TypeScript|JavaScript|Python|Java|Salesforce|APEX|SQL|AWS|Docker|Kubernetes|Git)\b/gi,
  /\b(agile|scrum|CRM|full[- ]?stack|front[- ]?end|back[- ]?end)\b/gi,
];

function extractSkillsFromText(text: string, limit = 12): string[] {
  const found = new Set<string>();
  for (const pattern of SKILL_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const skill = match[1] ?? match[0];
      if (skill) found.add(skill.replace(/\./g, "").trim());
      if (found.size >= limit) break;
    }
  }
  return [...found];
}

function inferWorkType(text: string, hint: string): string {
  if (hint.trim()) return hint.trim();
  const lower = text.toLowerCase();
  const types: string[] = [];
  if (/full[- ]?time/.test(lower)) types.push("Full-time");
  if (/part[- ]?time/.test(lower)) types.push("Part-time");
  if (/remote/.test(lower)) types.push("Remote");
  if (/hybrid/.test(lower)) types.push("Hybrid");
  if (/contract/.test(lower)) types.push("Contract");
  if (/permanent/.test(lower)) types.push("Permanent");
  return types.join(" · ") || "Not specified";
}

function inferSalary(text: string, hint: string): string {
  if (hint.trim()) return hint.trim();
  const pay = text.match(
    /\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|hour|yr|hr))?/i
  );
  return pay?.[0] ?? "Not listed on posting";
}

function buildAiInsights(
  jobTitle: string,
  company: string,
  skills: string[],
  jdText: string
): string {
  const snippet = jdText.replace(/\s+/g, " ").slice(0, 280);
  const skillLine =
    skills.length > 0
      ? `Prioritize: ${skills.slice(0, 6).join(", ")}.`
      : "Emphasize matching experience from your Ultimate Profile.";
  return (
    `Tailoring for ${jobTitle} at ${company}. ${skillLine} ` +
    `JD focus: "${snippet}…"`
  );
}

/** Server-side "AI" metadata pass (replace with BYOK Convex action in production). */
export async function identifyJobMetadataFromContent(input: {
  jobTitle: string;
  company: string;
  jdText: string;
  url: string;
  source: string;
  typeOfWork?: string;
  typeOfSalary?: string;
  location?: string;
  applicationDate?: string | null;
  jobKey?: string;
  scrapedAt?: string;
}): Promise<AnalyzedJobPosting> {
  await new Promise((r) => setTimeout(r, 600));

  const identifiedSkills = extractSkillsFromText(input.jdText);
  const metadata: JobMetadata = {
    typeOfWork: inferWorkType(input.jdText, input.typeOfWork ?? ""),
    typeOfSalary: inferSalary(input.jdText, input.typeOfSalary ?? ""),
    location: input.location?.trim() ?? "",
    applicationDate: input.applicationDate ?? null,
    jobKey: input.jobKey ?? "",
    identifiedSkills,
    aiInsights: buildAiInsights(
      input.jobTitle,
      input.company,
      identifiedSkills,
      input.jdText
    ),
    scrapedAt: input.scrapedAt ?? new Date().toISOString(),
  };

  return {
    jobTitle: input.jobTitle,
    company: input.company,
    jdText: input.jdText,
    url: input.url,
    source: input.source,
    metadata,
  };
}

export function indeedJsonToAnalyzed(raw: IndeedScraperJson, url: string) {
  return identifyJobMetadataFromContent({
    jobTitle: raw.job_name,
    company: raw.company,
    jdText: raw.job_details,
    url: raw.job_post_link || url,
    source: raw.source || "Indeed",
    typeOfWork: raw.type_of_work,
    typeOfSalary: raw.type_of_salary,
    location: raw.location,
    applicationDate: raw.application_date,
    jobKey: raw.job_key,
    scrapedAt: raw.scraped_at,
  });
}

export function parsedHtmlToAnalyzed(parsed: ParsedJobPosting) {
  return identifyJobMetadataFromContent({
    jobTitle: parsed.jobTitle,
    company: parsed.company,
    jdText: parsed.jdText,
    url: parsed.url,
    source: parsed.source,
  });
}
