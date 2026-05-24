import type { MockProfile } from "@/lib/mock-data";
import {
  computeKeywordCoverage,
  extractJobKeywords,
  resumeDocumentToSearchText,
} from "@/lib/ai/job-keywords";
import type { ResumeDocument } from "@/lib/resume-document";

export type JobContext = {
  title: string;
  company: string;
  description: string;
};

export type ProfileSnapshot = {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: { name: string; url: string }[];
  targetRole: string;
  about: string;
  skills: string[];
  languages: { name: string; level: string }[];
  certifications: { name: string; issuer: string; date: string }[];
  experience_entries: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  projects: { title: string; url?: string; description?: string }[];
  education: { degree: string; school: string; dates?: string; gpa?: string }[];
};

export type GeneratedResumeAnalysis = {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  resume: ResumeDocument;
};

export function profileToSnapshot(profile: MockProfile): ProfileSnapshot {
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    links: profile.links.map((link) => ({ name: link.name, url: link.url })),
    targetRole: profile.targetRole,
    about: profile.about,
    skills: profile.skills,
    languages: profile.languages.map((lang) => ({
      name: lang.name,
      level: lang.level,
    })),
    certifications: profile.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
    })),
    experience_entries: profile.experience_entries.map((entry) => ({
      title: entry.title,
      company: entry.company,
      dates: entry.dates,
      bullets: entry.bullets
        .filter((bullet) => bullet.active)
        .map((bullet) => bullet.text),
    })),
    projects: profile.projects
      .filter((project) => project.active)
      .map((project) => ({
        title: project.title,
        url: project.url,
        description: project.desc,
      })),
    education: profile.education.map((entry) => ({
      degree: entry.degree,
      school: entry.school,
      dates: entry.dates,
      gpa: entry.gpa,
    })),
  };
}

export function buildResumeGenerationMessages(
  job: JobContext,
  profile: ProfileSnapshot,
): { system: string; user: string } {
  const jobKeywords = extractJobKeywords(job.description);
  const keywordBlock =
    jobKeywords.length > 0
      ? jobKeywords.map((k, i) => `${i + 1}. ${k}`).join("\n")
      : "No explicit keywords extracted — infer priority terms from the job description.";

  const system = `You are an elite resume writer, ATS optimization specialist, and technical recruiter.

Your task: produce a highly tailored, keyword-rich resume that maximizes alignment with the target job while staying truthful to the candidate profile.

TAILORING STRATEGY (follow in order):
1. Study the job description and PRIORITY KEYWORDS list. Treat these as must-have ATS terms.
2. Map each keyword to real evidence in the candidate profile (experience, projects, skills, certifications).
3. Rewrite bullets to mirror JD phrasing where truthful — use the exact terminology from the posting (tools, frameworks, methodologies, soft skills).
4. Front-load the most relevant keywords in the summary, recent role bullets, skills section, and project descriptions.

CONTENT DEPTH RULES:
- Summary: 3–5 sentences. Dense with role-specific keywords, years of experience, domain expertise, and value proposition for THIS company/role.
- Experience bullets: 4–6 per role when source material exists. Each bullet should be a full achievement statement (not a fragment).
- Bullet formula: [Strong action verb] + [what you did] + [technologies/methods used] + [measurable or concrete outcome when available from profile].
- Use industry buzzwords and power verbs: architected, engineered, spearheaded, optimized, automated, scaled, delivered, collaborated, mentored, implemented, integrated, streamlined, etc.
- Projects: include 2–4 bullets each when the profile supports it; tie project work to JD requirements.
- Skills: 15–25 items. Order by relevance to the job — put JD-matching skills first, then complementary skills from the profile.
- Do NOT leave the resume sparse. Expand and enrich profile bullets with relevant JD terminology while keeping all facts grounded in the profile.

KEYWORD RULES:
- Weave PRIORITY KEYWORDS naturally into summary, bullets, and skills — never keyword-stuff as a bare list in prose.
- matchedKeywords: list JD keywords/phrases that appear in your final resume text.
- missingKeywords: important JD keywords the candidate lacks evidence for (be honest).
- matchScore: realistic 0–100 based on how many priority keywords you successfully incorporated.

HONESTY RULES:
- Use ONLY facts from the candidate profile. Do NOT invent employers, titles, dates, degrees, projects, or metrics.
- You MAY rephrase, expand, reorder, and emphasize. You MAY infer reasonable technical context already implied by the profile (e.g. if profile says "built React apps", you can say "React.js" when JD uses that term).
- Do NOT claim tools, certifications, or experience with zero support in the profile.

Return ONLY valid JSON with no markdown fences or commentary.

JSON schema:
{
  "matchScore": number (0-100),
  "matchedKeywords": string[],
  "missingKeywords": string[],
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

  const user = `TARGET ROLE
Title: ${job.title}
Company: ${job.company}

JOB DESCRIPTION
${job.description.trim() || "No detailed description provided. Tailor using the title and company context only."}

PRIORITY KEYWORDS (incorporate every term you can truthfully support — mirror exact spelling/casing where possible)
${keywordBlock}

CANDIDATE PROFILE (JSON)
${JSON.stringify(profile, null, 2)}

Produce a detailed, keyword-optimized resume JSON. Maximize ATS match without inventing facts.`;

  return { system, user };
}

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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeExperience(value: unknown): ResumeDocument["experience"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const bullets = asStringArray(record.bullets);
      const title = asString(record.title);
      const company = asString(record.company);
      const dates = asString(record.dates);
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

function snapshotToFallbackDocument(
  profile: ProfileSnapshot,
  job: JobContext,
): ResumeDocument {
  const contactLine = [
    profile.email,
    profile.phone,
    profile.location,
    ...profile.links.map((link) => link.url).filter(Boolean),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    name: profile.name,
    contactLine,
    summary: `${profile.targetRole} targeting ${job.title} at ${job.company}. ${profile.about}`,
    experience: profile.experience_entries.map((entry) => ({
      title: entry.title,
      company: entry.company,
      dates: entry.dates,
      bullets: entry.bullets,
    })),
    projects: profile.projects.map((project) => ({
      title: project.title,
      url: project.url,
      description: project.description,
      bullets: [],
    })),
    education: profile.education.map((entry) => ({
      degree: entry.degree,
      school: entry.school,
      dates: entry.dates,
      details: entry.gpa ? `GPA: ${entry.gpa}` : undefined,
    })),
    skills: profile.skills,
    certifications: profile.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
    })),
  };
}

export function normalizeGeneratedResume(
  payload: unknown,
  profile: ProfileSnapshot,
  job: JobContext,
): GeneratedResumeAnalysis {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing resume payload.");
  }

  const record = payload as Record<string, unknown>;
  const resumeRaw = record.resume;
  if (!resumeRaw || typeof resumeRaw !== "object") {
    throw new Error("AI response missing resume object.");
  }

  const resumeRecord = resumeRaw as Record<string, unknown>;
  const fallback = snapshotToFallbackDocument(profile, job);

  const resume: ResumeDocument = {
    name: asString(resumeRecord.name, profile.name),
    contactLine: asString(resumeRecord.contactLine, fallback.contactLine),
    summary: asString(resumeRecord.summary, fallback.summary),
    experience: normalizeExperience(resumeRecord.experience),
    projects: normalizeProjects(resumeRecord.projects),
    education: normalizeEducation(resumeRecord.education),
    skills: asStringArray(resumeRecord.skills),
    certifications: normalizeCertifications(resumeRecord.certifications),
  };

  if (resume.experience.length === 0) {
    resume.experience = fallback.experience;
  }
  if (!resume.skills?.length) {
    resume.skills = fallback.skills;
  }
  if (!resume.summary) {
    resume.summary = fallback.summary;
  }

  const jobKeywords = extractJobKeywords(job.description);
  const coverage = computeKeywordCoverage(
    resumeDocumentToSearchText(resume),
    jobKeywords,
  );

  const aiMatched = asStringArray(record.matchedKeywords);
  const aiMissing = asStringArray(record.missingKeywords);

  const matchedKeywords =
    coverage.matchedKeywords.length > 0
      ? coverage.matchedKeywords
      : aiMatched;
  const missingKeywords =
    coverage.missingKeywords.length > 0
      ? coverage.missingKeywords
      : aiMissing;

  const aiScore = clampScore(record.matchScore);
  const matchScore =
    jobKeywords.length > 0
      ? Math.max(coverage.matchScore, aiScore)
      : aiScore;

  return {
    matchScore,
    matchedKeywords,
    missingKeywords,
    resume,
  };
}

export function parseResumeGenerationResponse(
  text: string,
  profile: ProfileSnapshot,
  job: JobContext,
): GeneratedResumeAnalysis {
  const payload = extractJsonPayload(text);
  return normalizeGeneratedResume(payload, profile, job);
}
