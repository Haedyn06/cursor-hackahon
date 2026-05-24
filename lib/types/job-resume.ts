import type { ResumeDocument } from "@/lib/resume-document";

export type JobStoredResume = {
  document: ResumeDocument;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  updatedAt: string;
};

export function hasStoredResume(
  stored: JobStoredResume | null | undefined,
): stored is JobStoredResume {
  return !!stored?.document;
}
