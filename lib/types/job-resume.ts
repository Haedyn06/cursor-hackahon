import type { ResumeDocument } from "@/lib/resume-document";

export type JobResume = {
  document: ResumeDocument;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  updatedAt: string;
};

/** @deprecated Use `JobResume` */
export type JobStoredResume = JobResume;

export function hasResume(
  resume: JobResume | null | undefined,
): resume is JobResume {
  return !!resume?.document;
}

/** @deprecated Use `hasResume` */
export const hasStoredResume = hasResume;
