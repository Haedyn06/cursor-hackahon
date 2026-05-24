export type JobCoverLetter = {
  content: string;
  updatedAt: string;
};

/** @deprecated Use `JobCoverLetter` */
export type JobStoredCoverLetter = JobCoverLetter;

export function hasCoverLetter(
  coverLetter: JobCoverLetter | null | undefined,
): coverLetter is JobCoverLetter {
  return !!coverLetter?.content?.trim();
}

/** @deprecated Use `hasCoverLetter` */
export const hasStoredCoverLetter = hasCoverLetter;
