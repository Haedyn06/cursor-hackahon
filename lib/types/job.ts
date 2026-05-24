import type { JobStatus } from "@/lib/constants";
import type { JobStoredCoverLetter } from "@/lib/types/job-cover-letter";
import type { JobStoredInterviewPrep } from "@/lib/types/job-interview-prep";
import type { JobStoredResume } from "@/lib/types/job-resume";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  status: JobStatus;
  matchScore: number | null;
  source: string;
  dateAdded: string;
  url: string;
  jd: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  resumeGenerated: boolean;
  storedResume: JobStoredResume | null;
  coverLetterGenerated: boolean;
  storedCoverLetter: JobStoredCoverLetter | null;
  interviewPrepGenerated: boolean;
  storedInterviewPrep: JobStoredInterviewPrep | null;
  salary: string;
  deadline: string | null;
  dateApplied: string | null;
  followUp: string | null;
  excitement: number;
};

export type CreateJobInput = {
  title: string;
  company: string;
  location?: string;
  url?: string;
  jd?: string;
  source?: string;
  status?: JobStatus;
  salary?: string;
  deadline?: string | null;
};

export type UpdateJobInput = Partial<
  Omit<Job, "id" | "dateAdded">
>;

/** @deprecated Use `Job` — kept for existing imports */
export type MockJob = Job;
