"use client";

import { useMemo, useState } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";

export type InterviewQuestion = { q: string; a: string };

export type GeneratedInterviewPrep = {
  id: number;
  title: string;
  matchJob: string;
  company: string;
  categories: { id: string; label: string }[];
  questions: Record<string, InterviewQuestion[]>;
};

type InterviewPrepPreviewPanelProps = {
  prep: GeneratedInterviewPrep;
  onBack: () => void;
  onSave: (prep: GeneratedInterviewPrep) => void;
};

export function buildMockInterviewPrep(
  jobTitle: string,
  company: string,
): Pick<GeneratedInterviewPrep, "categories" | "questions" | "company"> {
  const categories = [
    { id: "behavioral", label: "Behavioral" },
    { id: "technical", label: "Technical" },
    { id: "culture", label: "Culture" },
    { id: "competitors", label: "Competitors" },
    { id: "products", label: "Products" },
  ];

  const questions: Record<string, InterviewQuestion[]> = {
    behavioral: [
      {
        q: "Tell me about a time you had a conflict with a teammate over a technical decision.",
        a: "STAR format: Situation — set context. Task — your role. Action — how you navigated it. Result — what happened.",
      },
      {
        q: "Describe a project where you had to learn something new quickly.",
        a: "Pick a real example. Emphasize learning velocity and what you shipped.",
      },
      {
        q: `Why are you interested in the ${jobTitle} role?`,
        a: "Connect your background to the role's core responsibilities and growth path.",
      },
    ],
    technical: [
      {
        q: "How do you approach optimizing a slow React application?",
        a: "Talk about profiling, React.memo, lazy loading, and bundle analysis.",
      },
      {
        q: "Walk me through how you would design a component library.",
        a: "Cover API design, accessibility, documentation, and adoption strategy.",
      },
    ],
    culture: [
      {
        q: `Why do you want to work at ${company}?`,
        a: "Research 3 specific things about the company and back up your interest.",
      },
      {
        q: "What kind of team environment helps you do your best work?",
        a: "Be honest and tie your answer to how you've seen ${company} operate.",
      },
    ],
    competitors: [
      {
        q: `How does ${company} compare to its main competitors?`,
        a: "Identify 2–3 competitors and articulate differentiation without bashing anyone.",
      },
    ],
    products: [
      {
        q: "What would you improve about our product if you started tomorrow?",
        a: "Pick ONE specific thing. Be concrete. Show product instinct.",
      },
      {
        q: `How have you used ${company}'s product, and what stood out?`,
        a: "Share genuine usage notes and one thoughtful improvement idea.",
      },
    ],
  };

  return { company, categories, questions };
}

export function countInterviewQuestions(
  questions: Record<string, InterviewQuestion[]>,
): number {
  return Object.values(questions).reduce((sum, items) => sum + items.length, 0);
}

export function InterviewPrepPreviewPanel({
  prep,
  onBack,
  onSave,
}: InterviewPrepPreviewPanelProps) {
  const [activeCategory, setActiveCategory] = useState(prep.categories[0]?.id ?? "behavioral");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const questionCount = useMemo(
    () => countInterviewQuestions(prep.questions),
    [prep.questions],
  );

  const activeQuestions = prep.questions[activeCategory] ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b-[2.5px] border-[var(--foreground)] bg-white px-8 py-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors hover:text-[var(--foreground)]"
          >
            ← Back to library
          </button>
          <h1 className="font-heading text-[22px] font-extrabold">{prep.title}</h1>
          <p className="text-sm font-medium text-[#666]">
            {prep.matchJob} · {questionCount} questions
          </p>
        </div>
        <NeoButton variant="primary" size="sm" onClick={() => onSave(prep)}>
          Save to Library
        </NeoButton>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap gap-1.5 border-b-2 border-[var(--foreground)] bg-white px-8 pt-4 pb-0">
          {prep.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className="cursor-pointer rounded-full px-4 py-1.5 font-sans text-xs font-bold neo-border-sm"
              style={{
                background:
                  activeCategory === cat.id ? "var(--lav)" : "transparent",
                border:
                  activeCategory === cat.id
                    ? "2px solid var(--foreground)"
                    : "2px solid transparent",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-8">
          <div className="mx-auto w-full max-w-[820px]">
            {activeQuestions.map((item, i) => (
              <div
                key={i}
                className="mb-3 overflow-hidden rounded-2xl bg-white neo-border"
              >
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold">{item.q}</span>
                  <span className="shrink-0 text-[#888]">{expanded[i] ? "▲" : "▼"}</span>
                </button>
                {expanded[i] && (
                  <div className="border-t-2 border-[var(--foreground)] px-5 pt-3 pb-4">
                    <NeoBadge color="var(--lav)" className="mb-2 text-[11px]">
                      Answer framework
                    </NeoBadge>
                    <p className="text-[13px] leading-relaxed font-medium text-[#444]">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
