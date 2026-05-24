import type { CreateJobInput, Job, UpdateJobInput } from "@/lib/types/job";
import type { JobStatus } from "@/lib/constants";

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    job?: T;
    jobs?: T;
  };

  if (!res.ok) {
    throw new Error(body.error ?? "Request failed.");
  }

  if ("job" in body && body.job !== undefined) return body.job as T;
  if ("jobs" in body && body.jobs !== undefined) return body.jobs as T;
  return body as T;
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch("/api/jobs", { cache: "no-store" });
  return parseResponse<Job[]>(res);
}

export async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
  return parseResponse<Job>(res);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<Job>(res);
}

export async function updateJob(
  id: string,
  input: UpdateJobInput,
): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<Job>(res);
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
): Promise<Job> {
  return updateJob(id, { status });
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to delete job.");
  }
}

export async function deleteJobs(ids: string[]): Promise<void> {
  const res = await fetch("/api/jobs/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to delete jobs.");
  }
}
