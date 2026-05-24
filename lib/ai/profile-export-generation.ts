import type { MockProfile } from "@/lib/mock-data";
import {
  buildProfileExportDocument,
  type ProfileExportDocument,
} from "@/lib/profile-export-document";
import { profileToSnapshot, type ProfileSnapshot } from "@/lib/ai/resume-generation";

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseExperience(value: unknown): ProfileExportDocument["experience"] {
  if (!Array.isArray(value)) return [];
  const experience: ProfileExportDocument["experience"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = asString(row.title);
    const company = asString(row.company);
    if (!title && !company) continue;
    experience.push({
      title,
      company,
      dates: asString(row.dates),
      bullets: asStringArray(row.bullets),
    });
  }

  return experience;
}

function parseProjects(value: unknown): ProfileExportDocument["projects"] {
  if (!Array.isArray(value)) return [];
  const projects: ProfileExportDocument["projects"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = asString(row.title);
    if (!title) continue;
    projects.push({
      title,
      url: asString(row.url) || undefined,
      description: asString(row.description) || undefined,
      bullets: asStringArray(row.bullets),
    });
  }

  return projects;
}

function parseEducation(value: unknown): ProfileExportDocument["education"] {
  if (!Array.isArray(value)) return [];
  const education: ProfileExportDocument["education"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const degree = asString(row.degree);
    const school = asString(row.school);
    if (!degree && !school) continue;
    education.push({
      degree,
      school,
      dates: asString(row.dates) || undefined,
      details: asString(row.details) || undefined,
    });
  }

  return education;
}

function parseLinks(value: unknown): ProfileExportDocument["links"] {
  if (!Array.isArray(value)) return [];
  const links: ProfileExportDocument["links"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    const url = asString(row.url);
    if (!name && !url) continue;
    links.push({ name, url });
  }

  return links;
}

function parseLanguages(value: unknown): ProfileExportDocument["languages"] {
  if (!Array.isArray(value)) return [];
  const languages: ProfileExportDocument["languages"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    if (!name) continue;
    languages.push({ name, level: asString(row.level) });
  }

  return languages;
}

function parseCertifications(
  value: unknown,
): ProfileExportDocument["certifications"] {
  if (!Array.isArray(value)) return [];
  const certifications: ProfileExportDocument["certifications"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    if (!name) continue;
    certifications.push({
      name,
      issuer: asString(row.issuer) || undefined,
      date: asString(row.date) || undefined,
    });
  }

  return certifications;
}

function parseResumeLibrary(
  value: unknown,
): ProfileExportDocument["resumeLibrary"] {
  if (!Array.isArray(value)) return [];
  const resumeLibrary: ProfileExportDocument["resumeLibrary"] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const label = asString(row.label);
    if (!label) continue;
    resumeLibrary.push({
      label,
      job: asString(row.job),
      date: asString(row.date),
    });
  }

  return resumeLibrary;
}

export function buildProfileExportMessages(snapshot: ProfileSnapshot) {
  const system = `You are a professional career document formatter. Given a candidate profile, produce a polished, well-organized export document.

Rules:
- Use ONLY facts from the provided profile. Never invent employers, skills, or credentials.
- Improve wording for clarity and professionalism (especially summary and bullet points).
- Keep every section that has data in the source profile.
- Omit empty sections from the JSON (use empty arrays instead).
- Return ONLY valid JSON matching the schema below. No markdown fences or commentary.

Schema:
{
  "name": string,
  "contactLine": string,
  "targetRole": string,
  "experienceLevel": string,
  "summary": string,
  "links": [{ "name": string, "url": string }],
  "experience": [{ "title": string, "company": string, "dates": string, "bullets": string[] }],
  "projects": [{ "title": string, "url"?: string, "description"?: string, "bullets"?: string[] }],
  "education": [{ "degree": string, "school": string, "dates"?: string, "details"?: string }],
  "skills": string[],
  "languages": [{ "name": string, "level": string }],
  "certifications": [{ "name": string, "issuer"?: string, "date"?: string }],
  "resumeLibrary": [{ "label": string, "job": string, "date": string }]
}`;

  const user = `Format this profile into export sections:\n\n${JSON.stringify(snapshot, null, 2)}`;

  return { system, user };
}

export function parseProfileExportResponse(
  text: string,
  profile: MockProfile,
): ProfileExportDocument {
  const fallback = buildProfileExportDocument(profile);

  try {
    const parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>;
    const experience = parseExperience(parsed.experience);
    const projects = parseProjects(parsed.projects);
    const education = parseEducation(parsed.education);
    const links = parseLinks(parsed.links);
    const languages = parseLanguages(parsed.languages);
    const certifications = parseCertifications(parsed.certifications);
    const resumeLibrary = parseResumeLibrary(parsed.resumeLibrary);

    return {
      name: asString(parsed.name, fallback.name),
      contactLine: asString(parsed.contactLine, fallback.contactLine),
      targetRole: asString(parsed.targetRole, fallback.targetRole),
      experienceLevel: asString(parsed.experienceLevel, fallback.experienceLevel),
      summary: asString(parsed.summary, fallback.summary),
      links: links.length ? links : fallback.links,
      experience: experience.length ? experience : fallback.experience,
      projects: projects.length ? projects : fallback.projects,
      education: education.length ? education : fallback.education,
      skills: asStringArray(parsed.skills).length
        ? asStringArray(parsed.skills)
        : fallback.skills,
      languages: languages.length ? languages : fallback.languages,
      certifications: certifications.length ? certifications : fallback.certifications,
      resumeLibrary: resumeLibrary.length ? resumeLibrary : fallback.resumeLibrary,
    };
  } catch {
    throw new Error("AI returned an unreadable profile export format.");
  }
}

export function profileToExportSnapshot(profile: MockProfile): ProfileSnapshot {
  return profileToSnapshot(profile);
}
