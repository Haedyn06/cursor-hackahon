import { MOCK_PROFILE, type MockProfile } from "@/lib/mock-data";

export type ResumeExperience = {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
};

export type ResumeProject = {
  title: string;
  url?: string;
  description?: string;
  bullets?: string[];
};

export type ResumeEducation = {
  degree: string;
  school: string;
  dates?: string;
  details?: string;
};

export type ResumeCertification = {
  name: string;
  issuer?: string;
  date?: string;
};

export type ResumeDocument = {
  name: string;
  contactLine: string;
  summary?: string;
  experience: ResumeExperience[];
  projects?: ResumeProject[];
  education?: ResumeEducation[];
  skills?: string[];
  certifications?: ResumeCertification[];
};

const SECTION_HEADERS = new Set([
  "SUMMARY",
  "EXPERIENCE",
  "WORK EXPERIENCE",
  "PROJECTS",
  "EDUCATION",
  "SKILLS",
  "CERTIFICATIONS",
  "LANGUAGES",
]);

function isSectionHeader(line: string) {
  return SECTION_HEADERS.has(line.trim().toUpperCase());
}

function parseExperienceBlock(lines: string[]): ResumeExperience[] {
  const entries: ResumeExperience[] = [];
  let current: ResumeExperience | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const roleMatch = trimmed.match(
      /^(.+?)\s*[—–-]\s*(.+?)\s*\(([^)]+)\)\s*$/,
    );
    if (roleMatch) {
      if (current) entries.push(current);
      current = {
        title: roleMatch[1].trim(),
        company: roleMatch[2].trim(),
        dates: roleMatch[3].trim(),
        bullets: [],
      };
      continue;
    }

    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      current?.bullets.push(trimmed.replace(/^[-•*]\s*/, "").trim());
    }
  }

  if (current) entries.push(current);
  return entries;
}

function parseProjectBlock(lines: string[]): ResumeProject[] {
  const projects: ResumeProject[] = [];
  let current: ResumeProject | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^(.+?)\s*[—–-]\s*(.+)$/);
    if (headerMatch && !trimmed.startsWith("•")) {
      if (current) projects.push(current);
      current = {
        title: headerMatch[1].trim(),
        url: headerMatch[2].trim(),
        bullets: [],
      };
      continue;
    }

    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      if (!current) {
        current = { title: "Project", bullets: [] };
      }
      current.bullets?.push(trimmed.replace(/^[-•*]\s*/, "").trim());
    } else if (current && !current.description) {
      current.description = trimmed;
    }
  }

  if (current) projects.push(current);
  return projects;
}

/** Parse plain-text resume content into a structured document. */
export function parseResumeText(text: string): ResumeDocument {
  const lines = text.split("\n");
  const nonEmpty = lines.map((line) => line.trimEnd());

  let name = "Your Name";
  let contactLine = "";
  let bodyStart = 0;

  for (let i = 0; i < nonEmpty.length; i++) {
    const line = nonEmpty[i].trim();
    if (!line) continue;
    name = line;
    contactLine = nonEmpty[i + 1]?.trim() ?? "";
    bodyStart = i + 2;
    break;
  }

  const doc: ResumeDocument = {
    name,
    contactLine,
    experience: [],
    skills: [],
  };

  let currentSection = "";
  let sectionLines: string[] = [];

  const flushSection = () => {
    if (!currentSection) return;
    const header = currentSection.toUpperCase();
    const content = sectionLines.slice();

    if (header === "SUMMARY") {
      doc.summary = content.join("\n").trim();
    } else if (header === "EXPERIENCE" || header === "WORK EXPERIENCE") {
      doc.experience = parseExperienceBlock(content);
    } else if (header === "PROJECTS") {
      doc.projects = parseProjectBlock(content);
    } else if (header === "EDUCATION") {
      doc.education = content
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(" — ");
          if (parts.length >= 2) {
            return { degree: parts[0].trim(), school: parts[1].trim() };
          }
          return { degree: line, school: "" };
        });
    } else if (header === "SKILLS") {
      doc.skills = content
        .join(" ")
        .split(/[·,|]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
    } else if (header === "CERTIFICATIONS") {
      doc.certifications = content.map((line) => ({ name: line }));
    }

    sectionLines = [];
  };

  for (let i = bodyStart; i < nonEmpty.length; i++) {
    const line = nonEmpty[i].trim();

    if (isSectionHeader(line)) {
      flushSection();
      currentSection = line;
      continue;
    }

    if (line) sectionLines.push(line);
  }

  flushSection();
  return doc;
}

export function profileToResumeDocument(
  profile: MockProfile,
  options?: { jobTitle?: string; company?: string },
): ResumeDocument {
  const contactParts = [
    profile.email,
    profile.phone,
    profile.location,
    ...profile.links.map((link) => link.url).filter(Boolean),
  ].filter(Boolean);

  const targetRole = options?.jobTitle ?? profile.targetRole;
  let summary = profile.about;

  if (options?.jobTitle && options?.company) {
    summary = `${targetRole} with strong experience building products for teams like ${options.company}. ${profile.about}`;
  }

  return {
    name: profile.name,
    contactLine: contactParts.join(" · "),
    summary,
    experience: profile.experience_entries.map((entry) => ({
      title: entry.title,
      company: entry.company,
      dates: entry.dates,
      bullets: entry.bullets.filter((bullet) => bullet.active).map((bullet) => bullet.text),
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

export function buildResumeDocument(jobTitle: string, company: string): ResumeDocument {
  return profileToResumeDocument(MOCK_PROFILE, { jobTitle, company });
}

export function resumeDocumentToPlainText(document: ResumeDocument): string {
  const lines: string[] = [
    document.name.toUpperCase(),
    document.contactLine,
    "",
  ];

  if (document.summary) {
    lines.push("SUMMARY", document.summary, "");
  }

  if (document.experience.length > 0) {
    lines.push("EXPERIENCE", "");
    for (const role of document.experience) {
      lines.push(`${role.title} — ${role.company} (${role.dates})`);
      for (const bullet of role.bullets) {
        lines.push(`• ${bullet}`);
      }
      lines.push("");
    }
  }

  if (document.projects && document.projects.length > 0) {
    lines.push("PROJECTS", "");
    for (const project of document.projects) {
      lines.push(
        project.url
          ? `${project.title} — ${project.url}`
          : project.title,
      );
      if (project.description) lines.push(project.description);
      for (const bullet of project.bullets ?? []) {
        lines.push(`• ${bullet}`);
      }
      lines.push("");
    }
  }

  if (document.education && document.education.length > 0) {
    lines.push("EDUCATION", "");
    for (const edu of document.education) {
      lines.push(`${edu.degree} — ${edu.school}${edu.dates ? `, ${edu.dates}` : ""}`);
      if (edu.details) lines.push(edu.details);
    }
    lines.push("");
  }

  if (document.skills && document.skills.length > 0) {
    lines.push("SKILLS", document.skills.join(" · "), "");
  }

  if (document.certifications && document.certifications.length > 0) {
    lines.push("CERTIFICATIONS", "");
    for (const cert of document.certifications) {
      lines.push(
        [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — "),
      );
    }
  }

  return lines.join("\n").trim();
}
