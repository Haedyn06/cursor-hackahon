import type { MockProfile } from "@/lib/mock-data";
import type {
  ResumeCertification,
  ResumeDocument,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
} from "@/lib/resume-document";

export type ProfileLink = {
  name: string;
  url: string;
};

export type ProfileLanguage = {
  name: string;
  level: string;
};

export type ProfileLibraryEntry = {
  label: string;
  job: string;
  date: string;
};

export type ProfileExportDocument = {
  name: string;
  contactLine: string;
  targetRole: string;
  experienceLevel: string;
  summary: string;
  links: ProfileLink[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  skills: string[];
  languages: ProfileLanguage[];
  certifications: ResumeCertification[];
  resumeLibrary: ProfileLibraryEntry[];
};

export function buildProfileExportDocument(profile: MockProfile): ProfileExportDocument {
  const contactParts = [profile.email, profile.phone, profile.location].filter(Boolean);

  return {
    name: profile.name,
    contactLine: contactParts.join(" · "),
    targetRole: profile.targetRole,
    experienceLevel: profile.experience,
    summary: profile.about,
    links: profile.links.map((link) => ({ name: link.name, url: link.url })),
    experience: profile.experience_entries.map((entry) => ({
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
      details: entry.gpa ? `GPA: ${entry.gpa}` : undefined,
    })),
    skills: profile.skills,
    languages: profile.languages.map((language) => ({
      name: language.name,
      level: language.level,
    })),
    certifications: profile.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
    })),
    resumeLibrary: (profile.resumeLibrary ?? []).map((entry) => ({
      label: entry.label,
      job: entry.job,
      date: entry.date,
    })),
  };
}

export function profileExportToResumeDocument(
  document: ProfileExportDocument,
): ResumeDocument {
  return {
    name: document.name,
    contactLine: document.contactLine,
    summary: document.summary,
    experience: document.experience,
    projects: document.projects,
    education: document.education,
    skills: document.skills,
    certifications: document.certifications,
  };
}

export function profileExportToPlainText(document: ProfileExportDocument): string {
  const lines: string[] = [document.name.toUpperCase(), document.contactLine];

  if (document.targetRole || document.experienceLevel) {
    lines.push(
      [document.targetRole, document.experienceLevel].filter(Boolean).join(" · "),
    );
  }

  lines.push("");

  if (document.summary) {
    lines.push("PROFESSIONAL SUMMARY", document.summary, "");
  }

  if (document.links.length > 0) {
    lines.push("LINKS", "");
    for (const link of document.links) {
      lines.push(`${link.name}: ${link.url}`);
    }
    lines.push("");
  }

  if (document.experience.length > 0) {
    lines.push("WORK EXPERIENCE", "");
    for (const role of document.experience) {
      lines.push(`${role.title} — ${role.company} (${role.dates})`);
      for (const bullet of role.bullets) {
        lines.push(`• ${bullet}`);
      }
      lines.push("");
    }
  }

  if (document.projects.length > 0) {
    lines.push("PROJECTS", "");
    for (const project of document.projects) {
      lines.push(
        project.url ? `${project.title} — ${project.url}` : project.title,
      );
      if (project.description) lines.push(project.description);
      for (const bullet of project.bullets ?? []) {
        lines.push(`• ${bullet}`);
      }
      lines.push("");
    }
  }

  if (document.skills.length > 0) {
    lines.push("SKILLS", document.skills.join(" · "), "");
  }

  if (document.languages.length > 0) {
    lines.push("LANGUAGES", "");
    for (const language of document.languages) {
      lines.push(`${language.name} — ${language.level}`);
    }
    lines.push("");
  }

  if (document.certifications.length > 0) {
    lines.push("CERTIFICATIONS", "");
    for (const cert of document.certifications) {
      lines.push(
        [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — "),
      );
    }
    lines.push("");
  }

  if (document.education.length > 0) {
    lines.push("EDUCATION", "");
    for (const edu of document.education) {
      lines.push(
        `${edu.degree} — ${edu.school}${edu.dates ? ` (${edu.dates})` : ""}`,
      );
      if (edu.details) lines.push(edu.details);
    }
    lines.push("");
  }

  if (document.resumeLibrary.length > 0) {
    lines.push("RESUME LIBRARY", "");
    for (const entry of document.resumeLibrary) {
      lines.push(`${entry.label} — ${entry.job} (${entry.date})`);
    }
  }

  return lines.join("\n").trim();
}
