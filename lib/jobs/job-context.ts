import type { Job } from "@/lib/types/job";

/** Context passed to AI generation and refinement for a job application. */
export type JobContext = {
  position: string;
  company: string;
  jobDesc: string;
  location?: string;
  incomeRange?: string;
  workType?: string;
  environmentType?: string;
};

export function jobDescription(
  job: Pick<Job, "position" | "company" | "jobDesc">,
): string {
  return job.jobDesc.trim() || `${job.position} at ${job.company}`;
}

export function jobMatchLabel(
  job: Pick<Job, "position" | "company">,
): string {
  return `${job.position} @ ${job.company}`;
}

export function jobToAiContext(job: Job): JobContext {
  return {
    position: job.position,
    company: job.company,
    jobDesc: jobDescription(job),
    location: job.location || undefined,
    incomeRange: job.incomeRange || undefined,
    workType: job.workType || undefined,
    environmentType: job.environmentType || undefined,
  };
}

export function wizardContextToAiContext(context: {
  position: string;
  company: string;
  description: string;
  location?: string;
  incomeRange?: string;
  workType?: string;
  environmentType?: string;
}): JobContext {
  return {
    position: context.position,
    company: context.company,
    jobDesc: context.description,
    location: context.location,
    incomeRange: context.incomeRange,
    workType: context.workType,
    environmentType: context.environmentType,
  };
}

export function parseJobContext(value: unknown): JobContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const position =
    (typeof record.position === "string" ? record.position.trim() : "") ||
    (typeof record.title === "string" ? record.title.trim() : "");
  const company =
    typeof record.company === "string" ? record.company.trim() : "";
  const jobDesc =
    (typeof record.jobDesc === "string" ? record.jobDesc.trim() : "") ||
    (typeof record.description === "string" ? record.description.trim() : "") ||
    (typeof record.jd === "string" ? record.jd.trim() : "");

  if (!position || !company) {
    return null;
  }

  return {
    position,
    company,
    jobDesc: jobDesc || `${position} at ${company}`,
    location:
      typeof record.location === "string" ? record.location.trim() : undefined,
    incomeRange:
      (typeof record.incomeRange === "string" ? record.incomeRange.trim() : "") ||
      (typeof record.salary === "string" ? record.salary.trim() : "") ||
      undefined,
    workType:
      typeof record.workType === "string" ? record.workType.trim() : undefined,
    environmentType:
      typeof record.environmentType === "string"
        ? record.environmentType.trim()
        : undefined,
  };
}
