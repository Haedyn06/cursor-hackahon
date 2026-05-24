import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { JobStatus } from "@/lib/constants";
import type { CreateJobInput, Job, UpdateJobInput } from "@/lib/types/job";
import { applyStatusMetadata, formatJobDate } from "@/lib/services/job-status";

const CLERK_CONVEX_TEMPLATE = "convex";

type ConvexJob = {
  _id: Id<"jobs">;
  title: string;
  company: string;
  location: string;
  status: string;
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

export type JobsServiceOptions = {
  token?: string | null;
};

export class JobsServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "JobsServiceError";
  }
}

function requireToken(options?: JobsServiceOptions) {
  const token = options?.token;
  if (!token) {
    throw new JobsServiceError("Unauthorized", 401);
  }
  return token;
}

function toJob(job: ConvexJob): Job {
  return {
    id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
    status: job.status as JobStatus,
    matchScore: job.matchScore,
    source: job.source,
    dateAdded: job.dateAdded,
    url: job.url,
    jd: job.jd,
    matchedKeywords: job.matchedKeywords,
    missingKeywords: job.missingKeywords,
    resumeGenerated: job.resumeGenerated,
    salary: job.salary,
    deadline: job.deadline,
    dateApplied: job.dateApplied,
    followUp: job.followUp,
    excitement: job.excitement,
  };
}

function buildBaseJob(input: CreateJobInput): Job {
  const status: JobStatus = input.status ?? "Saved";
  return {
    id: "",
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location?.trim() || "Remote",
    status,
    matchScore: null,
    source: input.source?.trim() || "Other",
    dateAdded: formatJobDate(),
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
}

function toConvexPatch(input: UpdateJobInput): UpdateJobInput {
  return {
    ...input,
    title: input.title?.trim(),
    company: input.company?.trim(),
    location: input.location?.trim(),
    source: input.source?.trim(),
    url: input.url?.trim(),
    jd: input.jd?.trim(),
    salary: input.salary?.trim(),
  };
}

export { CLERK_CONVEX_TEMPLATE };

export async function listJobs(options?: JobsServiceOptions): Promise<Job[]> {
  const token = requireToken(options);
  const jobs = await fetchQuery(api.jobs.listJobs, {}, { token });
  return jobs.map((job) => toJob(job as ConvexJob));
}

export async function getJobById(
  id: string,
  options?: JobsServiceOptions,
): Promise<Job | null> {
  const token = requireToken(options);
  const job = await fetchQuery(api.jobs.getJob, { id: id as Id<"jobs"> }, { token });
  return job ? toJob(job as ConvexJob) : null;
}

export async function createJob(
  input: CreateJobInput,
  options?: JobsServiceOptions,
): Promise<Job> {
  if (!input.title.trim() || !input.company.trim()) {
    throw new JobsServiceError("Title and company are required.", 400);
  }

  const token = requireToken(options);
  const baseJob = buildBaseJob(input);
  const jobToCreate = {
    ...baseJob,
    ...applyStatusMetadata(baseJob, baseJob.status),
  };

  const created = await fetchMutation(
    api.jobs.createJob,
    {
      title: jobToCreate.title,
      company: jobToCreate.company,
      location: jobToCreate.location,
      status: jobToCreate.status,
      matchScore: jobToCreate.matchScore,
      source: jobToCreate.source,
      dateAdded: jobToCreate.dateAdded,
      url: jobToCreate.url,
      jd: jobToCreate.jd,
      matchedKeywords: jobToCreate.matchedKeywords,
      missingKeywords: jobToCreate.missingKeywords,
      resumeGenerated: jobToCreate.resumeGenerated,
      salary: jobToCreate.salary,
      deadline: jobToCreate.deadline,
      dateApplied: jobToCreate.dateApplied,
      followUp: jobToCreate.followUp,
      excitement: jobToCreate.excitement,
    },
    { token },
  );

  return toJob(created as ConvexJob);
}

export async function updateJob(
  id: string,
  input: UpdateJobInput,
  options?: JobsServiceOptions,
): Promise<Job> {
  const current = await getJobById(id, options);
  if (!current) {
    throw new JobsServiceError("Job not found.", 404);
  }

  let patch: UpdateJobInput = toConvexPatch(input);
  if (input.status !== undefined && input.status !== current.status) {
    patch = {
      ...patch,
      ...applyStatusMetadata(current, input.status),
    };
  }

  const token = requireToken(options);
  const updated = await fetchMutation(
    api.jobs.updateJob,
    {
      id: id as Id<"jobs">,
      patch,
    },
    { token },
  );

  if (!updated) {
    throw new JobsServiceError("Job not found.", 404);
  }

  return toJob(updated as ConvexJob);
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  options?: JobsServiceOptions,
): Promise<Job> {
  return updateJob(id, { status }, options);
}

export async function deleteJob(
  id: string,
  options?: JobsServiceOptions,
): Promise<void> {
  const token = requireToken(options);

  try {
    await fetchMutation(api.jobs.deleteJob, { id: id as Id<"jobs"> }, { token });
  } catch {
    throw new JobsServiceError("Job not found.", 404);
  }
}

export async function deleteJobs(
  ids: string[],
  options?: JobsServiceOptions,
): Promise<void> {
  if (ids.length === 0) return;

  const token = requireToken(options);
  const result = await fetchMutation(
    api.jobs.deleteJobs,
    { ids: ids as Id<"jobs">[] },
    { token },
  );

  if (result.deleted === 0) {
    throw new JobsServiceError("Job not found.", 404);
  }
}
