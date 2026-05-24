import type { MockProfile } from "@/lib/mock-data";
import {
  profileToSnapshot,
  type JobContext,
  type ProfileSnapshot,
} from "@/lib/ai/resume-generation";
import type { ResumeDocument } from "@/lib/resume-document";
import type {
  InterviewPrepCategory,
  InterviewPrepContent,
  InterviewQuestion,
} from "@/lib/types/job-interview-prep";

export type GeneratedInterviewPrep = InterviewPrepContent;

const DEFAULT_CATEGORIES: InterviewPrepCategory[] = [
  { id: "behavioral", label: "Behavioral" },
  { id: "technical", label: "Technical" },
  { id: "culture", label: "Culture" },
  { id: "competitors", label: "Competitors" },
  { id: "products", label: "Products" },
];

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

function normalizeCategories(value: unknown): InterviewPrepCategory[] {
  if (!Array.isArray(value)) return DEFAULT_CATEGORIES;

  const categories = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const id = asString(record.id);
      const label = asString(record.label);
      if (!id || !label) return null;
      return { id, label };
    })
    .filter((entry): entry is InterviewPrepCategory => entry !== null);

  return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
}

function normalizeQuestions(
  value: unknown,
  categories: InterviewPrepCategory[],
): Record<string, InterviewQuestion[]> {
  const result: Record<string, InterviewQuestion[]> = {};

  for (const category of categories) {
    result[category.id] = [];
  }

  if (!value || typeof value !== "object") return result;

  const record = value as Record<string, unknown>;

  for (const category of categories) {
    const rawItems = record[category.id];
    if (!Array.isArray(rawItems)) continue;

    result[category.id] = rawItems
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        const q = asString(item.q);
        const a = asString(item.a);
        if (!q) return null;
        return { q, a: a || "Use STAR format and tie your answer to this role." };
      })
      .filter((entry): entry is InterviewQuestion => entry !== null);
  }

  return result;
}

export function normalizeInterviewPrepContent(payload: unknown): GeneratedInterviewPrep {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing interview prep payload.");
  }

  const record = payload as Record<string, unknown>;
  const categories = normalizeCategories(record.categories);
  const questions = normalizeQuestions(record.questions, categories);

  const totalQuestions = Object.values(questions).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  if (totalQuestions === 0) {
    throw new Error("AI response missing interview questions.");
  }

  return { categories, questions };
}

export function buildInterviewPrepGenerationMessages(params: {
  job: JobContext;
  profile: ProfileSnapshot;
  resume?: ResumeDocument | null;
}): { system: string; user: string } {
  const system = `You are an expert interview coach preparing a candidate for a specific job interview.

Your task: create a tailored interview prep guide with likely questions and concise answer frameworks.

Rules:
- Use ONLY facts from the candidate profile (and optional resume). Do NOT invent experience the candidate does not have.
- Tailor questions to the job title, company, and job description.
- Include categories: behavioral, technical, culture, competitors, products (use these exact ids).
- Provide 2-4 strong questions per category when relevant; skip empty categories only if truly not applicable.
- Each answer framework should be actionable (STAR hints, talking points, company-specific angles) — not full scripted answers.
- Return ONLY valid JSON with no markdown fences or commentary.

JSON schema:
{
  "categories": [{ "id": string, "label": string }],
  "questions": {
    "<categoryId>": [{ "q": string, "a": string }]
  }
}`;

  const resumeBlock = params.resume
    ? `\nTAILORED RESUME (for alignment)
${JSON.stringify(params.resume, null, 2)}
`
    : "";

  const user = `JOB POSTING
Title: ${params.job.title}
Company: ${params.job.company}

Job Description:
${params.job.description.trim() || "No detailed description provided. Tailor using the title and company context only."}

CANDIDATE PROFILE
${JSON.stringify(params.profile, null, 2)}
${resumeBlock}
Generate the interview prep JSON now.`;

  return { system, user };
}

export function parseInterviewPrepGenerationResponse(
  text: string,
): GeneratedInterviewPrep {
  const payload = extractJsonPayload(text);
  return normalizeInterviewPrepContent(payload);
}

export function profileToInterviewPrepSnapshot(
  profile: MockProfile,
): ProfileSnapshot {
  return profileToSnapshot(profile);
}
