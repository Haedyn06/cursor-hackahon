import type { JobStatus } from "@/lib/constants";

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
