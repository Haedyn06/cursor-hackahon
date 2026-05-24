import { extractJsonPayload } from "@/lib/ai/json-response";
import type { MockProfile } from "@/lib/mock-data";
import type { ResumeDocument } from "@/lib/resume-document";
import {
  profileToSnapshot,
  type JobContext,
  type ProfileSnapshot,
} from "@/lib/ai/resume-generation";

export type GeneratedCoverLetter = {
  content: string;
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function buildCoverLetterGenerationMessages(params: {
  job: JobContext;
  profile: ProfileSnapshot;
  resume?: ResumeDocument | null;
  sourceMaterialContext?: string;
}): { system: string; user: string } {
  const system = `You are an expert cover letter writer.

Your task: write a tailored, professional cover letter for a specific job application.

Rules:
- Use ONLY facts from the candidate profile (and optional resume). Do NOT invent employers, degrees, dates, or achievements.
- Sound like a real person — confident, specific, and warm. Avoid clichés and generic filler.
- Reference the target company and role naturally; show genuine interest without flattery.
- Keep it concise: roughly 3–4 paragraphs, suitable for one page.
- Include a header block with the candidate's name and contact line, today's date, and a greeting.
- End with an appropriate sign-off using the candidate's name.
- Return ONLY valid JSON with no markdown fences or commentary.

JSON schema:
{
  "content": string (full cover letter text with line breaks between sections)
}`;

  const resumeBlock = params.resume
    ? `\nTAILORED RESUME (for alignment — do not contradict it)
${JSON.stringify(params.resume, null, 2)}
`
    : "";

  const user = `JOB POSTING
Title: ${params.job.position}
Company: ${params.job.company}

Job Description:
${params.job.jobDesc.trim() || "No detailed description provided. Tailor using the title and company context only."}

CANDIDATE PROFILE
${JSON.stringify(params.profile, null, 2)}
${resumeBlock}${params.sourceMaterialContext?.trim() ? `\nADDITIONAL SOURCE MATERIALS\n${params.sourceMaterialContext.trim()}\n` : ""}
Write the cover letter JSON now.`;

  return { system, user };
}

export function parseCoverLetterGenerationResponse(text: string): GeneratedCoverLetter {
  const payload = extractJsonPayload(text);
  if (!payload || typeof payload !== "object") {
    throw new Error("AI response missing cover letter payload.");
  }

  const content = asString((payload as Record<string, unknown>).content);
  if (!content) {
    throw new Error("AI response missing cover letter content.");
  }

  return { content };
}

export function profileToCoverLetterSnapshot(profile: MockProfile): ProfileSnapshot {
  return profileToSnapshot(profile);
}
