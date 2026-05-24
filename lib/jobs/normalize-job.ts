import type { JobStatus } from "@/lib/constants";
import type { Job } from "@/lib/types/job";
import type { JobCoverLetter } from "@/lib/types/job-cover-letter";
import type { JobInterviewPrep } from "@/lib/types/job-interview-prep";
import type { JobResume } from "@/lib/types/job-resume";

/** Raw job payloads from API/Convex may use legacy or new field names. */
export type RawJobRecord = {
  id?: string;
  _id?: string;
  userId?: string;
  company?: string;
  position?: string;
  title?: string;
  jobDesc?: string;
  jd?: string;
  status?: string;
  matchScore?: number | null;
  resume?: JobResume | null;
  coverLetter?: JobCoverLetter | null;
  interviewPrep?: JobInterviewPrep | null;
  storedResume?: JobResume | null;
  storedCoverLetter?: JobCoverLetter | null;
  storedInterviewPrep?: JobInterviewPrep | null;
  incomeRange?: string;
  salary?: string;
  location?: string;
  workType?: string;
  environmentType?: string;
};

export function normalizeJob(raw: RawJobRecord): Job {
  const id = raw.id ?? raw._id ?? "";

  let incomeRange = (raw.incomeRange ?? raw.salary ?? "").trim();
  let workType = (raw.workType ?? "").trim();
  let environmentType = (raw.environmentType ?? "").trim();

  if (!environmentType && /full[- ]?time|part[- ]?time|contract|intern|temporary|permanent|casual/i.test(incomeRange)) {
    environmentType = incomeRange;
    incomeRange = "";
  }

  return {
    id,
    userId: raw.userId ?? "",
    company: raw.company ?? "",
    position: (raw.position ?? raw.title ?? "").trim(),
    jobDesc: (raw.jobDesc ?? raw.jd ?? "").trim(),
    status: (raw.status ?? "Saved") as JobStatus,
    matchScore: raw.matchScore ?? null,
    resume: raw.resume ?? raw.storedResume ?? null,
    coverLetter: raw.coverLetter ?? raw.storedCoverLetter ?? null,
    interviewPrep: raw.interviewPrep ?? raw.storedInterviewPrep ?? null,
    incomeRange,
    location: (raw.location ?? "").trim() || "Remote",
    workType,
    environmentType,
  };
}

export function normalizeJobs(records: RawJobRecord[]): Job[] {
  return records.map(normalizeJob);
}

/** Safe string for search/filter when legacy records slip through. */
export function normalizeResumeRefineContext(
  raw: Partial<{
    position: string;
    title: string;
    company: string;
    jobDesc: string;
    description: string;
    jd: string;
  }>,
): { position: string; company: string; jobDesc: string } {
  const position = (raw.position ?? raw.title ?? "").trim();
  const company = (raw.company ?? "").trim();
  const jobDesc =
    (raw.jobDesc ?? raw.description ?? raw.jd ?? "").trim() ||
    (position && company ? `${position} at ${company}` : "");

  return { position, company, jobDesc };
}

export function jobSearchText(job: Pick<Job, "position" | "company">): string {
  return `${job.position ?? ""} ${job.company ?? ""}`.toLowerCase();
}
