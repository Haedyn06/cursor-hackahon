export type InterviewQuestion = { q: string; a: string };

export type InterviewPrepCategory = { id: string; label: string };

export type InterviewPrepContent = {
  categories: InterviewPrepCategory[];
  questions: Record<string, InterviewQuestion[]>;
};

export type JobInterviewPrep = InterviewPrepContent & {
  updatedAt: string;
};

/** @deprecated Use `JobInterviewPrep` */
export type JobStoredInterviewPrep = JobInterviewPrep;

export function hasInterviewPrep(
  interviewPrep: JobInterviewPrep | null | undefined,
): interviewPrep is JobInterviewPrep {
  if (!interviewPrep?.categories?.length) return false;
  return Object.values(interviewPrep.questions).some((items) => items.length > 0);
}

/** @deprecated Use `hasInterviewPrep` */
export const hasStoredInterviewPrep = hasInterviewPrep;

export function countInterviewQuestions(
  questions: Record<string, InterviewQuestion[]>,
): number {
  return Object.values(questions).reduce((sum, items) => sum + items.length, 0);
}

export function interviewPrepToPlainText(prep: InterviewPrepContent): string {
  const lines: string[] = [];

  for (const category of prep.categories) {
    const items = prep.questions[category.id] ?? [];
    if (items.length === 0) continue;

    lines.push(category.label.toUpperCase());
    lines.push("");

    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.q}`);
      lines.push(`   ${item.a}`);
      lines.push("");
    });
  }

  return lines.join("\n").trim();
}
