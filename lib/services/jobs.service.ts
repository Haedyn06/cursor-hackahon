import { randomUUID } from "crypto";
import type { JobStatus } from "@/lib/constants";
import type { CreateJobInput, Job, UpdateJobInput } from "@/lib/types/job";
import { applyStatusMetadata } from "@/lib/services/job-status";
import { readJsonFile, writeJsonFile } from "@/lib/services/json-store";

const JOBS_FILE = "jobs.json";

export class JobsServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "JobsServiceError";
  }
}

async function readJobs(): Promise<Job[]> {
  const jobs = await readJsonFile<Job[]>(JOBS_FILE);
  return jobs.map(normalizeJob);
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    storedResume: job.storedResume ?? null,
    coverLetterGenerated: job.coverLetterGenerated ?? false,
    storedCoverLetter: job.storedCoverLetter ?? null,
    interviewPrepGenerated: job.interviewPrepGenerated ?? false,
    storedInterviewPrep: job.storedInterviewPrep ?? null,
  };
}

async function writeJobs(jobs: Job[]): Promise<void> {
  await writeJsonFile(JOBS_FILE, jobs);
}

export async function listJobs(): Promise<Job[]> {
  return readJobs();
}

export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await readJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const title = input.title.trim();
  const company = input.company.trim();

  if (!title || !company) {
    throw new JobsServiceError("Title and company are required.", 400);
  }

  const jobs = await readJobs();
  const status: JobStatus = input.status ?? "Saved";

  const job: Job = {
    id: randomUUID(),
    title,
    company,
    location: input.location?.trim() || "Remote",
    status,
    matchScore: null,
    source: input.source?.trim() || "Other",
    dateAdded: "just now",
    url: input.url?.trim() || "",
    jd: input.jd?.trim() || "",
    matchedKeywords: [],
    missingKeywords: [],
    resumeGenerated: false,
    storedResume: null,
    coverLetterGenerated: false,
    storedCoverLetter: null,
    interviewPrepGenerated: false,
    storedInterviewPrep: null,
    salary: input.salary?.trim() || "$0",
    deadline: input.deadline ?? null,
    dateApplied: null,
    followUp: null,
    excitement: 0,
  };

  const withStatusMeta = {
    ...job,
    ...applyStatusMetadata(job, status),
  };

  jobs.unshift(withStatusMeta);
  await writeJobs(jobs);
  return withStatusMeta;
}

export async function updateJob(
  id: string,
  input: UpdateJobInput,
): Promise<Job> {
  const jobs = await readJobs();
  const index = jobs.findIndex((job) => job.id === id);

  if (index === -1) {
    throw new JobsServiceError("Job not found.", 404);
  }

  const current = jobs[index];
  let patch: Partial<Job> = { ...input };

  if (input.status !== undefined && input.status !== current.status) {
    patch = {
      ...patch,
      ...applyStatusMetadata(current, input.status),
    };
  }

  const updated: Job = { ...current, ...patch };
  jobs[index] = updated;
  await writeJobs(jobs);
  return updated;
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
): Promise<Job> {
  return updateJob(id, { status });
}

export async function deleteJob(id: string): Promise<void> {
  await deleteJobs([id]);
}

export async function deleteJobs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const idSet = new Set(ids);
  const jobs = await readJobs();
  const next = jobs.filter((job) => !idSet.has(job.id));

  if (next.length === jobs.length) {
    throw new JobsServiceError("Job not found.", 404);
  }

  await writeJobs(next);
}
