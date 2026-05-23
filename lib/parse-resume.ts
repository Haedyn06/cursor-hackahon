import type { ExperienceLevel, UserProfile } from "./types";

export type ParsedResumeFields = Partial<
  Pick<
    UserProfile,
    | "targetRole"
    | "topSkills"
    | "aboutYou"
    | "linkedin"
    | "github"
    | "portfolio"
    | "experienceLevel"
  >
>;

const SECTION_HEADERS =
  /^(summary|professional summary|about me|about|profile|objective|skills|technical skills|core competencies|experience|work experience|education)$/i;

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSection(text: string, names: string[]): string {
  const lines = text.split("\n");
  let capturing = false;
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const header = trimmed.replace(/[:\-#*]+$/g, "").trim();

    if (SECTION_HEADERS.test(header) || names.some((n) => header.toLowerCase() === n)) {
      if (names.some((n) => header.toLowerCase().startsWith(n))) {
        capturing = true;
        continue;
      }
      if (capturing) break;
    }

    if (capturing && trimmed) {
      parts.push(trimmed);
    }
  }

  return parts.join(" ").trim();
}

function extractUrls(text: string) {
  const urlRegex = /https?:\/\/[^\s)>\]]+/gi;
  return [...text.matchAll(urlRegex)].map((m) => m[0].replace(/[.,;]+$/, ""));
}

function inferExperienceLevel(text: string): ExperienceLevel | undefined {
  const lower = text.toLowerCase();
  if (/\b(student|pursuing|expected graduation|co-op|coop)\b/.test(lower)) {
    return "student";
  }
  if (/\b(new grad|recent grad|graduate|diploma|bachelor|master's)\b/.test(lower)) {
    return "new_grad";
  }
  if (/\b(career change|transitioning|bootcamp)\b/.test(lower)) {
    return "career_changer";
  }
  if (/\b(\d+)\+?\s*years?\s+(of\s+)?experience\b/.test(lower)) {
    return "early_career";
  }
  return undefined;
}

function inferTargetRole(text: string): string | undefined {
  const objective = extractSection(text, ["objective", "summary", "profile"]);
  if (objective && objective.length < 120) {
    const firstSentence = objective.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length < 80) return firstSentence;
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines[0];
  if (first && first.length < 60 && !first.includes("@") && !/^https?:/i.test(first)) {
    return first;
  }

  const titleLine = lines.find((l) =>
    /\b(developer|engineer|designer|analyst|intern|manager|consultant|architect)\b/i.test(l)
  );
  if (titleLine && titleLine.length < 80) return titleLine;

  return undefined;
}

function inferSkills(text: string): string | undefined {
  const block = extractSection(text, [
    "skills",
    "technical skills",
    "core competencies",
  ]);
  if (block) {
    const cleaned = block
      .replace(/[•●▪◦·]/g, ",")
      .replace(/\s*\|\s*/g, ", ")
      .replace(/\s*;\s*/g, ", ");
    const skills = cleaned
      .split(/[,/\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40);
    if (skills.length) return skills.slice(0, 12).join(", ");
  }

  const common = [
    "JavaScript",
    "TypeScript",
    "Python",
    "React",
    "Next.js",
    "Node.js",
    "Java",
    "C++",
    "SQL",
    "Git",
    "AWS",
    "Docker",
  ];
  const found = common.filter((s) => text.toLowerCase().includes(s.toLowerCase()));
  if (found.length >= 3) return found.join(", ");
  return undefined;
}

function inferAbout(text: string): string | undefined {
  const summary = extractSection(text, [
    "summary",
    "professional summary",
    "about me",
    "about",
    "profile",
  ]);
  if (summary && summary.length >= 40) return summary.slice(0, 600);
  return undefined;
}

export function parseResumeForAutofill(rawText: string): ParsedResumeFields {
  const text = normalizeText(rawText);
  const urls = extractUrls(text);

  const linkedin = urls.find((u) => /linkedin\.com/i.test(u));
  const github = urls.find((u) => /github\.com/i.test(u));
  const portfolio = urls.find(
    (u) =>
      !/linkedin\.com|github\.com|mailto:/i.test(u) &&
      /\.(dev|app|io|com|me|xyz)/i.test(u)
  );

  return {
    targetRole: inferTargetRole(text),
    topSkills: inferSkills(text),
    aboutYou: inferAbout(text),
    linkedin: linkedin ?? "",
    github: github ?? "",
    portfolio: portfolio ?? "",
    experienceLevel: inferExperienceLevel(text),
  };
}

export async function extractTextFromResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type === "text/plain") {
    return normalizeText(await file.text());
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(pageText);
    }

    return normalizeText(pages.join("\n\n"));
  }

  throw new Error("Unsupported file type. Upload a PDF, .txt, or .md file.");
}

export type AutofillMergeMode = "empty" | "overwrite";

export function mergeAutofillIntoProfile<
  T extends ParsedResumeFields & { experienceLevel?: ExperienceLevel },
>(current: T, parsed: ParsedResumeFields, mode: AutofillMergeMode): T {
  const next = { ...current };

  const assign = <K extends keyof ParsedResumeFields>(key: K) => {
    const value = parsed[key];
    if (value === undefined || value === "") return;
    const cur = next[key as keyof T];
    if (mode === "overwrite" || !cur || (typeof cur === "string" && !cur.trim())) {
      (next as ParsedResumeFields)[key] = value;
    }
  };

  assign("targetRole");
  assign("topSkills");
  assign("aboutYou");
  assign("linkedin");
  assign("github");
  assign("portfolio");
  assign("experienceLevel");

  return next;
}

export const AUTOFILL_FIELD_LABELS: Record<keyof ParsedResumeFields, string> = {
  targetRole: "Target role",
  topSkills: "Top skills",
  aboutYou: "About you",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  experienceLevel: "Experience level",
};

export function listFilledFields(parsed: ParsedResumeFields): string[] {
  return (Object.keys(parsed) as (keyof ParsedResumeFields)[])
    .filter((k) => {
      const v = parsed[k];
      return v !== undefined && v !== "";
    })
    .map((k) => AUTOFILL_FIELD_LABELS[k]);
}
