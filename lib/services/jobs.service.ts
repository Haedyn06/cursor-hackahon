import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { JobStatus } from "@/lib/constants";
import type { CreateJobInput, Job, UpdateJobInput } from "@/lib/types/job";
import { normalizeJob, type RawJobRecord } from "@/lib/jobs/normalize-job";
import { applyStatusMetadata } from "@/lib/services/job-status";

const CLERK_CONVEX_TEMPLATE = "convex";

type ConvexJob = RawJobRecord & {
  _id: Id<"jobs">;
  userId: Id<"users">;
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
    throw new JobsServiceError(
      "Sign in to save jobs to your account.",
      401,
    );
  }
  return token;
}

function toJob(job: ConvexJob): Job {
  return normalizeJob(job);
}

function buildBaseJob(input: CreateJobInput, userId = ""): Job {
  const status: JobStatus = input.status ?? "Saved";
  return {
    id: "",
    userId,
    position: input.position.trim(),
    company: input.company.trim(),
    location: input.location?.trim() || "Remote",
    status,
    matchScore: null,
    jobDesc: input.jobDesc?.trim() || "",
    resume: null,
    coverLetter: null,
    interviewPrep: null,
    incomeRange: input.incomeRange?.trim() || "",
    workType: input.workType?.trim() || "",
    environmentType: input.environmentType?.trim() || "",
  };
}

function toConvexPatch(input: UpdateJobInput): UpdateJobInput {
  return {
    ...input,
    position: input.position?.trim(),
    company: input.company?.trim(),
    location: input.location?.trim(),
    jobDesc: input.jobDesc?.trim(),
    incomeRange: input.incomeRange?.trim(),
    workType: input.workType?.trim(),
    environmentType: input.environmentType?.trim(),
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
  if (!input.position.trim() || !input.company.trim()) {
    throw new JobsServiceError("Position and company are required.", 400);
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
      company: jobToCreate.company,
      position: jobToCreate.position,
      jobDesc: jobToCreate.jobDesc,
      status: jobToCreate.status,
      matchScore: jobToCreate.matchScore,
      incomeRange: jobToCreate.incomeRange,
      location: jobToCreate.location,
      workType: jobToCreate.workType,
      environmentType: jobToCreate.environmentType,
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
