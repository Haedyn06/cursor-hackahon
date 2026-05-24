import type { JobStatus } from "@/lib/constants";
import type { Job } from "@/lib/types/job";

export function formatJobDate(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Applies metadata side-effects when a job moves to a new pipeline status.
 */
export function applyStatusMetadata(
  job: Job,
  nextStatus: JobStatus,
): Partial<Job> {
  const updates: Partial<Job> = { status: nextStatus };
  const today = formatJobDate();

  switch (nextStatus) {
    case "Applied":
      if (!job.dateApplied) {
        updates.dateApplied = today;
      }
      break;
    case "Interview":
      if (job.dateApplied && !job.followUp) {
        updates.followUp = null;
      }
      break;
    case "Saved":
    case "Applying":
      break;
    case "Offer":
    case "Accepted":
    case "Rejected":
      break;
    default:
      break;
  }

  return updates;
}
