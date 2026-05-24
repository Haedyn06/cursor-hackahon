import type { UpdateJobInput } from "@/lib/types/job";
import type { JobStoredCoverLetter } from "@/lib/types/job-cover-letter";
import type {
  InterviewPrepContent,
  JobStoredInterviewPrep,
} from "@/lib/types/job-interview-prep";
import type { JobStoredResume } from "@/lib/types/job-resume";
import type { ResumeDocument } from "@/lib/resume-document";

export function buildStoredResumeUpdate(params: {
  document: ResumeDocument;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}): UpdateJobInput {
  const stored: JobStoredResume = {
    document: params.document,
    matchScore: params.matchScore,
    matchedKeywords: params.matchedKeywords,
    missingKeywords: params.missingKeywords,
    updatedAt: new Date().toISOString(),
  };

  return {
    storedResume: stored,
    resumeGenerated: true,
    matchScore: params.matchScore,
    matchedKeywords: params.matchedKeywords,
    missingKeywords: params.missingKeywords,
  };
}

export function buildStoredCoverLetterUpdate(content: string): UpdateJobInput {
  const stored: JobStoredCoverLetter = {
    content,
    updatedAt: new Date().toISOString(),
  };

  return {
    storedCoverLetter: stored,
    coverLetterGenerated: true,
  };
}

export function buildStoredInterviewPrepUpdate(
  prep: InterviewPrepContent,
): UpdateJobInput {
  const stored: JobStoredInterviewPrep = {
    categories: prep.categories,
    questions: prep.questions,
    updatedAt: new Date().toISOString(),
  };

  return {
    storedInterviewPrep: stored,
    interviewPrepGenerated: true,
  };
}
