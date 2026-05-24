export type AutofillLink = {
  name: string;
  url: string;
};

export type AutofillLanguage = {
  name: string;
  level: string;
};

export type AutofillCertification = {
  name: string;
  issuer: string;
  date: string;
};

export type AutofillExperienceEntry = {
  title: string;
  company: string;
  dates: string;
  bullets: string;
};

export type AutofillEducationEntry = {
  degree: string;
  school: string;
  dates: string;
  gpa: string;
};

export type AutofillProfilePayload = {
  name: string;
  location: string;
  email: string;
  phone: string;
  links: AutofillLink[];
  targetRole: string;
  experience: string;
  about: string;
  skills: string[];
  languages: AutofillLanguage[];
  certifications: AutofillCertification[];
  experience_entries: AutofillExperienceEntry[];
  education: AutofillEducationEntry[];
};

const EXPERIENCE_LEVELS = [
  "Internship",
  "Entry Level (0-2 yrs)",
  "Mid Level (2-5 yrs)",
  "Senior (5+ yrs)",
] as const;

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Professional",
  "Conversational",
  "Basic",
] as const;

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
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeExperienceLevel(value: string): string {
  if (!value) return "";
  const exact = EXPERIENCE_LEVELS.find(
    (level) => level.toLowerCase() === value.toLowerCase(),
  );
  if (exact) return exact;

  const lower = value.toLowerCase();
  if (lower.includes("intern")) return "Internship";
  if (lower.includes("senior") || lower.includes("5+") || lower.includes("lead")) {
    return "Senior (5+ yrs)";
  }
  if (lower.includes("mid") || lower.includes("2-5") || lower.includes("3")) {
    return "Mid Level (2-5 yrs)";
  }
  if (lower.includes("entry") || lower.includes("junior") || lower.includes("0-2")) {
    return "Entry Level (0-2 yrs)";
  }
  return value;
}

function normalizeLanguageLevel(value: string): string {
  if (!value) return "Conversational";
  const exact = LANGUAGE_LEVELS.find(
    (level) => level.toLowerCase() === value.toLowerCase(),
  );
  if (exact) return exact;

  const lower = value.toLowerCase();
  if (lower.includes("native")) return "Native";
  if (lower.includes("fluent")) return "Fluent";
  if (lower.includes("professional")) return "Professional";
  if (lower.includes("basic") || lower.includes("beginner")) return "Basic";
  return "Conversational";
}

function parseLinks(value: unknown): AutofillLink[] {
  if (!Array.isArray(value)) return [];
  const links: AutofillLink[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    const url = asString(row.url);
    if (!name && !url) continue;
    links.push({ name: name || "Link", url });
  }
  return links;
}

function parseLanguages(value: unknown): AutofillLanguage[] {
  if (!Array.isArray(value)) return [];
  const languages: AutofillLanguage[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    if (!name) continue;
    languages.push({
      name,
      level: normalizeLanguageLevel(asString(row.level)),
    });
  }
  return languages;
}

function parseCertifications(value: unknown): AutofillCertification[] {
  if (!Array.isArray(value)) return [];
  const certifications: AutofillCertification[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = asString(row.name);
    if (!name) continue;
    certifications.push({
      name,
      issuer: asString(row.issuer),
      date: asString(row.date),
    });
  }
  return certifications;
}

function bulletsToString(value: unknown): string {
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
      .filter(Boolean)
      .join("\n");
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().replace(/^[-•*]\s*/, ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function parseExperienceEntries(value: unknown): AutofillExperienceEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: AutofillExperienceEntry[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = asString(row.title);
    const company = asString(row.company);
    if (!title && !company) continue;
    entries.push({
      title,
      company,
      dates: asString(row.dates),
      bullets: bulletsToString(row.bullets),
    });
  }

  return entries;
}

function parseEducationEntries(value: unknown): AutofillEducationEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: AutofillEducationEntry[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const degree = asString(row.degree);
    const school = asString(row.school);
    if (!degree && !school) continue;
    entries.push({
      degree,
      school,
      dates: asString(row.dates),
      gpa: asString(row.gpa),
    });
  }

  return entries;
}

export function buildProfileAutofillMessages(sourceText: string) {
  const system = `You extract structured profile data from resumes, bios, LinkedIn text, and career documents.

Rules:
- Use ONLY information explicitly present in the source text. Never invent employers, dates, or credentials.
- Infer the closest experience level from years of experience when stated.
- For experience level, use one of: "Internship", "Entry Level (0-2 yrs)", "Mid Level (2-5 yrs)", "Senior (5+ yrs)".
- For language levels, use one of: "Native", "Fluent", "Professional", "Conversational", "Basic".
- Put work history bullets in each experience entry as a single "bullets" string with one bullet per line (no leading dashes required).
- Include links when URLs or platform names appear (LinkedIn, GitHub, Portfolio, etc.).
- Return ONLY valid JSON matching the schema below. No markdown fences or commentary.

Schema:
{
  "name": string,
  "location": string,
  "email": string,
  "phone": string,
  "links": [{ "name": string, "url": string }],
  "targetRole": string,
  "experience": string,
  "about": string,
  "skills": string[],
  "languages": [{ "name": string, "level": string }],
  "certifications": [{ "name": string, "issuer": string, "date": string }],
  "experience_entries": [{ "title": string, "company": string, "dates": string, "bullets": string }],
  "education": [{ "degree": string, "school": string, "dates": string, "gpa": string }]
}`;

  const user = `Extract profile fields from this source material:\n\n${sourceText}`;

  return { system, user };
}

export function parseProfileAutofillResponse(text: string): AutofillProfilePayload {
  const parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>;

  return {
    name: asString(parsed.name),
    location: asString(parsed.location),
    email: asString(parsed.email),
    phone: asString(parsed.phone),
    links: parseLinks(parsed.links),
    targetRole: asString(parsed.targetRole),
    experience: normalizeExperienceLevel(asString(parsed.experience)),
    about: asString(parsed.about),
    skills: asStringArray(parsed.skills),
    languages: parseLanguages(parsed.languages),
    certifications: parseCertifications(parsed.certifications),
    experience_entries: parseExperienceEntries(parsed.experience_entries),
    education: parseEducationEntries(parsed.education),
  };
}

export function summarizeAutofillPayload(payload: AutofillProfilePayload): string {
  const parts: string[] = [];

  if (payload.name) parts.push("name");
  if (payload.location) parts.push("location");
  if (payload.email) parts.push("email");
  if (payload.phone) parts.push("phone");
  if (payload.links.length) parts.push(`${payload.links.length} link${payload.links.length === 1 ? "" : "s"}`);
  if (payload.targetRole) parts.push("target role");
  if (payload.experience) parts.push("experience level");
  if (payload.about) parts.push("about");
  if (payload.skills.length) {
    parts.push(`${payload.skills.length} skill${payload.skills.length === 1 ? "" : "s"}`);
  }
  if (payload.languages.length) {
    parts.push(`${payload.languages.length} language${payload.languages.length === 1 ? "" : "s"}`);
  }
  if (payload.certifications.length) {
    parts.push(
      `${payload.certifications.length} certification${payload.certifications.length === 1 ? "" : "s"}`,
    );
  }
  if (payload.experience_entries.length) {
    parts.push(
      `${payload.experience_entries.length} work experience${payload.experience_entries.length === 1 ? "" : " entries"}`,
    );
  }
  if (payload.education.length) {
    parts.push(
      `${payload.education.length} education entr${payload.education.length === 1 ? "y" : "ies"}`,
    );
  }

  return parts.length > 0 ? parts.join(", ") : "profile fields";
}
