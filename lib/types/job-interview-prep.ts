export type InterviewQuestion = { q: string; a: string };

export type InterviewPrepCategory = { id: string; label: string };

export type InterviewPrepContent = {
  categories: InterviewPrepCategory[];
  questions: Record<string, InterviewQuestion[]>;
};

export type JobStoredInterviewPrep = InterviewPrepContent & {
  updatedAt: string;
};

export function hasStoredInterviewPrep(
  stored: JobStoredInterviewPrep | null | undefined,
): stored is JobStoredInterviewPrep {
  if (!stored?.categories?.length) return false;
  return Object.values(stored.questions).some((items) => items.length > 0);
}

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
