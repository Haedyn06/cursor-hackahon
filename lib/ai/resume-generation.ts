import { extractJsonPayload } from "@/lib/ai/json-response";
import type { MockProfile } from "@/lib/mock-data";
import {
  buildSkillCurationHints,
  computeKeywordCoverage,
  curateTailoredSkills,
  extractKeywordsForJob,
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
  sourceMaterialContext?: string,
): { system: string; user: string } {
  const jobKeywords = extractKeywordsForJob(job);
  const skillHints = buildSkillCurationHints(profile.skills, jobKeywords);
  const keywordBlock =
    jobKeywords.length > 0
      ? jobKeywords.map((k, i) => `${i + 1}. ${k}`).join("\n")
      : "No explicit keywords extracted — infer priority terms from the job title and description.";
  const mustIncludeBlock =
    skillHints.mustInclude.length > 0
      ? skillHints.mustInclude.map((line, i) => `${i + 1}. ${line}`).join("\n")
      : "No direct profile-to-JD skill matches detected — still handpick the most relevant profile skills for this role.";
  const mirrorTermsBlock =
    skillHints.jdTermsToMirror.length > 0
      ? skillHints.jdTermsToMirror.join(", ")
      : "Infer terminology from the job description.";

  const system = `You are an elite resume writer, ATS optimization specialist, and technical recruiter.

Your task: produce a highly detailed, keyword-rich, ATS-optimized resume that maximizes compatibility with the target job while staying 100% truthful to the candidate profile.

TAILORING STRATEGY (follow in order):
1. Study the job title, description, and PRIORITY KEYWORDS. Treat these as must-have ATS terms.
2. HANDPICK SKILLS from the candidate's profile pool — do NOT dump every profile skill. Select 18–28 skills that best match this job. Put JD-matching skills first.
3. For each selected skill, mirror the EXACT phrasing from the job posting when possible (e.g. JD says "React.js" not "React").
4. Map each priority keyword to real evidence in the profile (experience, projects, certifications, about section).
5. Rewrite bullets to mirror JD phrasing where truthful — weave in tools, frameworks, methodologies, domain terms, and soft-skill buzzwords from the posting.
6. Front-load the strongest keywords in the summary, most recent role bullets, project bullets, and skills section.

SKILLS CURATION (critical):
- The skills array is a curated shortlist for THIS job — not a copy of the full profile skills list.
- Include every MUST-INCLUDE SKILL listed in the user message (these are profile-backed JD matches).
- Prefer exact JD terminology in the skills list when the candidate has supporting evidence.
- Add complementary profile skills only if they strengthen the candidacy for this specific role.
- Never list a skill the candidate cannot support anywhere in their profile.

CONTENT DEPTH RULES (do not produce a sparse resume):
- Summary: 4–6 sentences. Dense with role-specific keywords, domain expertise, technical scope, soft skills from the JD, and a clear value proposition for THIS company/role.
- Experience: include ALL relevant roles from the profile. 4–6 bullets per role when source material exists (minimum 3 if any bullets exist in profile).
- Bullet formula: [Power verb] + [scope/ownership] + [what you built/delivered] + [technologies/methods from JD] + [concrete outcome, metric, or impact when available in profile].
- Power verbs / buzzwords to use where truthful: architected, engineered, spearheaded, optimized, automated, scaled, delivered, collaborated, mentored, implemented, integrated, streamlined, drove, led, owned, partnered, accelerated, improved, reduced, increased, launched, deployed.
- Projects: include all relevant active projects. 2–4 detailed bullets each tying work to JD requirements and keywords.
- Education & certifications: keep from profile; add brief details field when GPA/honors exist.

KEYWORD & ATS RULES:
- Mirror JD terms in summary, bullets, project descriptions, and skills — natural prose, not naked keyword lists in paragraphs.
- Repeat high-priority technical terms 2–3 times across different sections (summary, experience, skills) when truthful — ATS systems reward consistent terminology.
- matchedKeywords: list JD keywords/phrases that appear in your final resume text.
- missingKeywords: important JD keywords the candidate lacks evidence for (be honest).
- matchScore: realistic 0–100 based on priority keyword incorporation.

HONESTY RULES:
- Use ONLY facts from the candidate profile. Do NOT invent employers, titles, dates, degrees, projects, metrics, or tools.
- You MAY rephrase, expand detail, reorder, and emphasize. You MAY use JD terminology for skills already implied by the profile.
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

PRIORITY KEYWORDS (incorporate every term you can truthfully support — mirror exact spelling/casing from the JD)
${keywordBlock}

JD TERMINOLOGY TO MIRROR IN SKILLS & BULLETS
${mirrorTermsBlock}

MUST-INCLUDE SKILLS (profile-backed matches — prioritize these in the skills section and reference in bullets)
${mustIncludeBlock}

FULL PROFILE SKILLS POOL (handpick from this list only — do not add skills outside this pool unless clearly implied by experience/project bullets)
${profile.skills.length > 0 ? profile.skills.join(", ") : "No skills listed in profile."}

CANDIDATE PROFILE (JSON)
${JSON.stringify(profile, null, 2)}
${sourceMaterialContext?.trim() ? `\nADDITIONAL SOURCE MATERIALS\n${sourceMaterialContext.trim()}\n` : ""}
Produce a detailed, keyword-optimized resume JSON. Handpick skills, weave in buzzwords, maximize ATS match, and expand bullets with rich detail — without inventing facts.`;

  return { system, user };
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

function ensureResumeDepth(
  resume: ResumeDocument,
  profile: ProfileSnapshot,
): ResumeDocument {
  const experience = resume.experience.map((entry, index) => {
    const profileEntry = profile.experience_entries[index];
    const profileBullets = profileEntry?.bullets ?? [];
    const minBullets = profileBullets.length > 0 ? Math.min(3, profileBullets.length) : 0;

    if (entry.bullets.length >= minBullets) {
      return entry;
    }

    const paddedBullets = [...entry.bullets];
    for (const bullet of profileBullets) {
      if (paddedBullets.length >= Math.max(minBullets, 3)) break;
      if (!paddedBullets.some((existing) => existing.toLowerCase() === bullet.toLowerCase())) {
        paddedBullets.push(bullet);
      }
    }

    return { ...entry, bullets: paddedBullets };
  });

  const projects = (resume.projects ?? []).map((project, index) => {
    const profileProject = profile.projects[index];
    if (!profileProject) return project;

    const bullets = [...(project.bullets ?? [])];
    if (bullets.length >= 2) return project;

    const seed = profileProject.description?.trim();
    if (seed && !bullets.some((bullet) => bullet.toLowerCase() === seed.toLowerCase())) {
      bullets.unshift(seed);
    }

    return { ...project, bullets };
  });

  return { ...resume, experience, projects };
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

  const jobKeywords = extractKeywordsForJob(job);
  resume.skills = curateTailoredSkills(
    profile.skills,
    resume.skills ?? [],
    jobKeywords,
  );
  if (!resume.skills.length) {
    resume.skills = fallback.skills;
  }

  const enriched = ensureResumeDepth(resume, profile);
  const coverage = computeKeywordCoverage(
    resumeDocumentToSearchText(enriched),
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
    resume: enriched,
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
