export type JobStoredCoverLetter = {
  content: string;
  updatedAt: string;
};

export function hasStoredCoverLetter(
  stored: JobStoredCoverLetter | null | undefined,
): stored is JobStoredCoverLetter {
  return !!stored?.content?.trim();
}
