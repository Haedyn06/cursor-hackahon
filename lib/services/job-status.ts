import type { JobStatus } from "@/lib/constants";
import type { Job } from "@/lib/types/job";

/**
 * Applies metadata side-effects when a job moves to a new pipeline status.
 */
export function applyStatusMetadata(
  job: Job,
  nextStatus: JobStatus,
): Partial<Job> {
  return { status: nextStatus };
}
