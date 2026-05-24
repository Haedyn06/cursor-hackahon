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

export function getResumeTabEmptyState(params: {
  hasLibraryResumes: boolean;
  hasSelectedResume: boolean;
}) {
  if (params.hasLibraryResumes && !params.hasSelectedResume) {
    return {
      title: "Select a resume",
      description:
        "Choose one of your saved resumes to see the match score and tailor it for this job.",
      actionLabel: null,
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
    title: job.title,
    company: job.company,
    description: job.jd.trim() || `${job.title} at ${job.company}`,
  });
}

export function computeResumeMatchForDescription(
  resume: ResumeDocument,
  job: { title: string; company: string; description: string },
) {
  const keywords = extractKeywordsForJob({
    title: job.title,
    company: job.company,
    description: job.description.trim() || `${job.title} at ${job.company}`,
  });

  return computeKeywordCoverage(resumeDocumentToPlainText(resume), keywords);
}
