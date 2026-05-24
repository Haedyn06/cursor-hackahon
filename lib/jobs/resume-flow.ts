import { computeKeywordCoverage, extractKeywordsForJob } from "@/lib/ai/job-keywords";
import { resumeDocumentToPlainText } from "@/lib/resume-document";
import type { ResumeDocument } from "@/lib/resume-document";
import type { Job } from "@/lib/types/job";

export type ResumeMatchSummary = {
  ready: boolean;
  score: number | null;
  matchedKeywords: string[];
  missingKeywords: string[];
};

export function buildResumeMatchSummary(params: {
  selectedResumeId: string | null;
  storedResumeId: string | null;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}): ResumeMatchSummary {
  if (!params.selectedResumeId) {
    return {
      ready: false,
      score: null,
      matchedKeywords: [],
      missingKeywords: [],
    };
  }

  return {
    ready: true,
    score: params.matchScore,
    matchedKeywords: params.matchedKeywords,
    missingKeywords: params.missingKeywords,
  };
}

export const AUTO_TAILOR_INSTRUCTION =
  "Automatically tailor this resume for the target job. Preserve at least 80% of the original imported resume content, structure, and facts. You may supplement from the candidate profile (~20%) only where it improves keyword match with verifiable profile facts. Maximize the ATS match score while keeping the resume truthful.";

export function getResumeTabEmptyState(params: {
  hasLibraryResumes: boolean;
  hasSelectedResume: boolean;
}) {
  if (params.hasLibraryResumes && !params.hasSelectedResume) {
    return {
      title: "Select a resume",
      description:
        "Choose one of your saved resumes to see the match score and tailor it for this job — or generate a fresh resume from your profile.",
      actionLabel: "Generate from profile",
    };
  }

  return {
    title: "No resume yet",
    description: "Generate a tailored, ATS-optimized resume in seconds",
    actionLabel: "✦ Generate Resume",
  };
}

export function matchExistingResumeToJob(resume: ResumeDocument, job: Job) {
  return computeResumeMatchForDescription(resume, {
    position: job.position,
    company: job.company,
    jobDesc: job.jobDesc.trim() || `${job.position} at ${job.company}`,
  });
}

export function computeResumeMatchForDescription(
  resume: ResumeDocument,
  job: { position: string; company: string; jobDesc: string },
) {
  const keywords = extractKeywordsForJob({
    position: job.position,
    company: job.company,
    jobDesc: job.jobDesc.trim() || `${job.position} at ${job.company}`,
  });

  return computeKeywordCoverage(resumeDocumentToPlainText(resume), keywords);
}
