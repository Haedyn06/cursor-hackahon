import type { UpdateJobInput } from "@/lib/types/job";
import type { JobCoverLetter } from "@/lib/types/job-cover-letter";
import type {
  InterviewPrepContent,
  JobInterviewPrep,
} from "@/lib/types/job-interview-prep";
import type { JobResume } from "@/lib/types/job-resume";
import type { ResumeDocument } from "@/lib/resume-document";

export function buildResumeUpdate(params: {
  document: ResumeDocument;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}): UpdateJobInput {
  const resume: JobResume = {
    document: params.document,
    matchScore: params.matchScore,
    matchedKeywords: params.matchedKeywords,
    missingKeywords: params.missingKeywords,
    updatedAt: new Date().toISOString(),
  };

  return {
    resume,
    matchScore: params.matchScore,
  };
}

/** @deprecated Use `buildResumeUpdate` */
export const buildStoredResumeUpdate = buildResumeUpdate;

export function buildCoverLetterUpdate(content: string): UpdateJobInput {
  const coverLetter: JobCoverLetter = {
    content,
    updatedAt: new Date().toISOString(),
  };

  return { coverLetter };
}

/** @deprecated Use `buildCoverLetterUpdate` */
export const buildStoredCoverLetterUpdate = buildCoverLetterUpdate;

export function buildInterviewPrepUpdate(
  prep: InterviewPrepContent,
): UpdateJobInput {
  const interviewPrep: JobInterviewPrep = {
    categories: prep.categories,
    questions: prep.questions,
    updatedAt: new Date().toISOString(),
  };

  return { interviewPrep };
}

/** @deprecated Use `buildInterviewPrepUpdate` */
export const buildStoredInterviewPrepUpdate = buildInterviewPrepUpdate;
