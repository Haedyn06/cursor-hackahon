import type { GeneratedCoverLetter } from "@/components/resume/cover-letter-preview-panel";
import type { GeneratedInterviewPrep } from "@/components/resume/interview-prep-preview-panel";
import type { GeneratedResume } from "@/components/resume/resume-preview-panel";
import { jobMatchLabel } from "@/lib/resume-builder-library-storage";
import { resumeDocumentToPlainText, type ResumeDocument } from "@/lib/resume-document";
import type { Job } from "@/lib/types/job";
import type { JobInterviewPrep } from "@/lib/types/job-interview-prep";

export function buildLibraryResumeFromJob(
  job: Job,
  payload: {
    document: ResumeDocument;
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  },
): GeneratedResume {
  return {
    id: Date.now(),
    title: `${job.company} — ${job.position}`,
    matchJob: jobMatchLabel(job.position, job.company),
    templateName: "ATS Classic",
    templateId: "ats-classic",
    content: resumeDocumentToPlainText(payload.document),
    document: payload.document,
    matchScore: payload.matchScore,
    matchedKeywords: payload.matchedKeywords,
    missingKeywords: payload.missingKeywords,
    jobContext: {
      position: job.position,
      company: job.company,
      jobDesc: job.jobDesc,
    },
  };
}

export function buildLibraryCoverLetterFromJob(
  job: Job,
  content: string,
): GeneratedCoverLetter {
  return {
    id: Date.now(),
    title: `${job.company} — Cover Letter`,
    matchJob: jobMatchLabel(job.position, job.company),
    content,
  };
}

export function buildLibraryInterviewPrepFromJob(
  job: Job,
  prep: Pick<JobInterviewPrep, "categories" | "questions">,
): GeneratedInterviewPrep {
  return {
    id: Date.now(),
    title: `${job.company} — Interview Prep`,
    matchJob: jobMatchLabel(job.position, job.company),
    company: job.company,
    categories: prep.categories,
    questions: prep.questions,
  };
}
