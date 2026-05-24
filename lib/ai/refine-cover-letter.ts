import { extractJsonPayload } from "@/lib/ai/json-response";
import type { JobContext } from "@/lib/ai/resume-generation";

export type RefineCoverLetterResult = {
  reply: string;
  content: string;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeRefinedCoverLetter(
  payload: unknown,
  current: string,
): RefineCoverLetterResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing refine payload.");
  }

  const record = payload as Record<string, unknown>;
  const content = asString(record.content, current);
  if (!content) {
    throw new Error("AI response missing cover letter content.");
  }

  const reply =
    asString(record.reply) ||
    "I've updated the cover letter based on your request.";

  return { reply, content };
}

export function buildCoverLetterRefineMessages(params: {
  content: string;
  instruction: string;
  job?: JobContext;
}): { system: string; user: string } {
  const system = `You are an expert cover letter editor helping a candidate refine their cover letter.

Rules:
- Apply the user's requested edits to the cover letter text.
- Do NOT invent new employers, degrees, dates, or credentials.
- You MAY rephrase paragraphs, adjust tone, shorten or expand sections, and tune emphasis.
- Keep the letter professional and suitable for one page.
- Return ONLY valid JSON with no markdown fences.

JSON schema:
{
  "reply": string (short confirmation of what you changed),
  "content": string (full updated cover letter text with line breaks)
}`;

  const jobBlock = params.job
    ? `TARGET JOB
Title: ${params.job.position}
Company: ${params.job.company}

Job Description:
${params.job.jobDesc.trim() || "No description provided."}

`
    : "";

  const user = `${jobBlock}CURRENT COVER LETTER
${params.content.trim()}

USER REQUEST
${params.instruction.trim()}

Return the updated cover letter JSON and a short reply.`;

  return { system, user };
}

export function parseCoverLetterRefineResponse(
  text: string,
  current: string,
): RefineCoverLetterResult {
  const payload = extractJsonPayload(text);
  return normalizeRefinedCoverLetter(payload, current);
}
