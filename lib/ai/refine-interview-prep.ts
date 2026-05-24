import { extractJsonPayload } from "@/lib/ai/json-response";
import {
  normalizeInterviewPrepContent,
  type GeneratedInterviewPrep,
} from "@/lib/ai/interview-prep-generation";
import type { JobContext } from "@/lib/ai/resume-generation";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";

export type RefineInterviewPrepResult = {
  reply: string;
} & InterviewPrepContent;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeRefinedInterviewPrep(
  payload: unknown,
  current: InterviewPrepContent,
): RefineInterviewPrepResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing refine payload.");
  }

  const record = payload as Record<string, unknown>;
  const mergedPayload = {
    categories: record.categories ?? current.categories,
    questions: record.questions ?? current.questions,
  };

  const normalized = normalizeInterviewPrepContent(mergedPayload);
  const reply =
    asString(record.reply) ||
    "I've updated the interview prep based on your request.";

  return { reply, ...normalized };
}

export function buildInterviewPrepRefineMessages(params: {
  prep: InterviewPrepContent;
  instruction: string;
  job?: JobContext;
}): { system: string; user: string } {
  const system = `You are an expert interview coach helping a candidate refine their interview prep guide.

Rules:
- Apply the user's requested edits to the interview prep JSON.
- Do NOT invent candidate experience that isn't supported by context.
- You MAY add/remove/reword questions, improve answer frameworks, or shift emphasis across categories.
- Keep category ids stable when possible (behavioral, technical, culture, competitors, products).
- Return ONLY valid JSON with no markdown fences.

JSON schema:
{
  "reply": string (short confirmation of what you changed),
  "categories": [{ "id": string, "label": string }],
  "questions": {
    "<categoryId>": [{ "q": string, "a": string }]
  }
}`;

  const jobBlock = params.job
    ? `TARGET JOB
Title: ${params.job.title}
Company: ${params.job.company}

Job Description:
${params.job.description.trim() || "No description provided."}

`
    : "";

  const user = `${jobBlock}CURRENT INTERVIEW PREP (JSON)
${JSON.stringify(params.prep, null, 2)}

USER REQUEST
${params.instruction.trim()}

Return the updated interview prep JSON and a short reply.`;

  return { system, user };
}

export function parseInterviewPrepRefineResponse(
  text: string,
  current: InterviewPrepContent,
): RefineInterviewPrepResult {
  const payload = extractJsonPayload(text);
  return normalizeRefinedInterviewPrep(payload, current);
}
