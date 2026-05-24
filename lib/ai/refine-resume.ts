import { extractJsonPayload } from "@/lib/ai/json-response";
import type { JobContext } from "@/lib/ai/resume-generation";
import { curateTailoredSkills, extractKeywordsForJob } from "@/lib/ai/job-keywords";
import type { ResumeDocument } from "@/lib/resume-document";

export type RefineResumeResult = {
  reply: string;
  resume: ResumeDocument;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeExperience(value: unknown): ResumeDocument["experience"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const title = asString(record.title);
      const company = asString(record.company);
      const dates = asString(record.dates);
      const bullets = asStringArray(record.bullets);
      if (!title && !company) return null;
      return { title, company, dates, bullets };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function normalizeProjects(value: unknown): ResumeDocument["projects"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const title = asString(record.title);
      if (!title) return null;
      return {
        title,
        url: asString(record.url) || undefined,
        description: asString(record.description) || undefined,
        bullets: asStringArray(record.bullets),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function normalizeEducation(value: unknown): ResumeDocument["education"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const degree = asString(record.degree);
      const school = asString(record.school);
      if (!degree && !school) return null;
      return {
        degree,
        school,
        dates: asString(record.dates) || undefined,
        details: asString(record.details) || undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

function normalizeCertifications(value: unknown): ResumeDocument["certifications"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const name = asString(record.name);
      if (!name) return null;
      return {
        name,
        issuer: asString(record.issuer) || undefined,
        date: asString(record.date) || undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export function normalizeRefinedResume(
  payload: unknown,
  current: ResumeDocument,
  job?: JobContext,
): RefineResumeResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing refine payload.");
  }

  const record = payload as Record<string, unknown>;
  const resumeRaw = record.resume;
  if (!resumeRaw || typeof resumeRaw !== "object") {
    throw new Error("AI response missing resume object.");
  }

  const resumeRecord = resumeRaw as Record<string, unknown>;
  const resume: ResumeDocument = {
    name: asString(resumeRecord.name, current.name),
    contactLine: asString(resumeRecord.contactLine, current.contactLine),
    summary: asString(resumeRecord.summary, current.summary),
    experience: normalizeExperience(resumeRecord.experience),
    projects: normalizeProjects(resumeRecord.projects),
    education: normalizeEducation(resumeRecord.education),
    skills: asStringArray(resumeRecord.skills),
    certifications: normalizeCertifications(resumeRecord.certifications),
  };

  if (resume.experience.length === 0) resume.experience = current.experience;
  if (!resume.skills?.length) resume.skills = current.skills;
  if (!resume.summary) resume.summary = current.summary;
  if (!resume.projects?.length && current.projects?.length) {
    resume.projects = current.projects;
  }
  if (!resume.education?.length && current.education?.length) {
    resume.education = current.education;
  }
  if (!resume.certifications?.length && current.certifications?.length) {
    resume.certifications = current.certifications;
  }

  if (job) {
    const jobKeywords = extractKeywordsForJob(job);
    resume.skills = curateTailoredSkills(
      current.skills ?? [],
      resume.skills ?? [],
      jobKeywords,
    );
  }

  const reply =
    asString(record.reply) ||
    "I've updated the resume based on your request.";

  return { reply, resume };
}

export function buildResumeRefineMessages(params: {
  resume: ResumeDocument;
  instruction: string;
  job?: JobContext;
}): { system: string; user: string } {
  const system = `You are an elite resume editor and ATS optimization specialist helping a candidate refine a tailored resume.

Rules:
- Apply the user's requested edits to the resume JSON.
- Do NOT invent new employers, degrees, dates, or credentials.
- You MAY rephrase bullets, expand detail, reorder sections, adjust tone, and aggressively tune keywords to the job.
- When a job description is provided, handpick 18–28 skills from the current resume/profile skills — JD-matching skills first. Mirror exact JD terminology where truthful.
- Weave priority keywords and industry buzzwords into summary and bullets naturally.
- Prefer fuller, keyword-rich achievement bullets (4–6 per role) over short generic ones.
- Keep the resume ATS-friendly but detailed — do not over-shorten.
- Return ONLY valid JSON with no markdown fences.

JSON schema:
{
  "reply": string (short confirmation of what you changed),
  "resume": {
    "name": string,
    "contactLine": string,
    "summary": string,
    "experience": [{ "title": string, "company": string, "dates": string, "bullets": string[] }],
    "projects": [{ "title": string, "url": string, "description": string, "bullets": string[] }],
    "education": [{ "degree": string, "school": string, "dates": string, "details": string }],
    "skills": string[],
    "certifications": [{ "name": string, "issuer": string, "date": string }]
  }
}`;

  const jobBlock = params.job
    ? (() => {
        const keywords = extractKeywordsForJob(params.job);
        const keywordList =
          keywords.length > 0
            ? `\nPRIORITY KEYWORDS\n${keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}\n`
            : "";
        return `TARGET JOB
Title: ${params.job.title}
Company: ${params.job.company}

Job Description:
${params.job.description.trim() || "No description provided."}
${keywordList}
`;
      })()
    : "";

  const user = `${jobBlock}CURRENT RESUME (JSON)
${JSON.stringify(params.resume, null, 2)}

USER REQUEST
${params.instruction.trim()}

Return the updated resume JSON and a short reply.`;

  return { system, user };
}

export function parseResumeRefineResponse(
  text: string,
  current: ResumeDocument,
  job?: JobContext,
): RefineResumeResult {
  const payload = extractJsonPayload(text);
  return normalizeRefinedResume(payload, current, job);
}
