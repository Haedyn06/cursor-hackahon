import type { JobStatus } from "@/lib/constants";
import type { JobCoverLetter } from "@/lib/types/job-cover-letter";
import type { JobInterviewPrep } from "@/lib/types/job-interview-prep";
import type { JobResume } from "@/lib/types/job-resume";

/** Canonical job application metadata stored for each saved application. */
export type Job = {
  id: string;
  userId: string;
  company: string;
  position: string;
  jobDesc: string;
  status: JobStatus;
  matchScore: number | null;
  resume: JobResume | null;
  coverLetter: JobCoverLetter | null;
  interviewPrep: JobInterviewPrep | null;
  incomeRange: string;
  location: string;
  workType: string;
  environmentType: string;
};

export type CreateJobInput = {
  position: string;
  company: string;
  location?: string;
  jobDesc?: string;
  status?: JobStatus;
  incomeRange?: string;
  workType?: string;
  environmentType?: string;
};

export type UpdateJobInput = Partial<Omit<Job, "id" | "userId">>;

/** @deprecated Use `Job` — kept for existing imports */
export type MockJob = Job;
