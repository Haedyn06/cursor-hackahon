"use client";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, LoadingAI, ErrorBanner } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { generateInterviewPrep } from "@/lib/mock-ai";
import { useRezume } from "@/lib/store";
import type { InterviewQuestion } from "@/lib/types";
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const TABS = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "culture", label: "Culture" },
  { id: "competitors", label: "Competitors" },
  { id: "products", label: "Products" },
];

function QuestionItem({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false);
  return (
    <NeoCard flat className="!p-4">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold">{q.question}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" />
        )}
      </button>
      {open && (
        <div className="mt-3 border-t-2 border-dashed border-neo-ink/30 pt-3">
          <p className="text-xs font-black uppercase text-neo-purple">Answer framework</p>
          <p className="mt-1 text-sm font-medium">{q.framework}</p>
        </div>
      )}
    </NeoCard>
  );
}

export default function InterviewPrepPage() {
  const params = useParams();
  const id = params.id as string;
  const { getApplication, updateApplication, apiKey } = useRezume();
  const app = getApplication(id);
  const [tab, setTab] = useState("technical");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prep = app?.interviewPrep;

  const regenerateTab = async () => {
    if (!app || !apiKey?.verified) {
      setError("Connect API key in Settings.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const full = await generateInterviewPrep(app.jobTitle, app.company, app.jdText);
      updateApplication(id, { interviewPrep: full });
    } catch {
      setError("Regeneration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!app) {
    return (
      <AppShell title="Not found">
        <p className="font-bold">Job not found.</p>
      </AppShell>
    );
  }

  const questions =
    prep?.[tab as keyof typeof prep] ?? ([] as InterviewQuestion[]);

  return (
    <AppShell title="Interview prep">
      <Link
        href={`/jobs/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {app.jobTitle} @ {app.company}
      </Link>

      {error && <ErrorBanner message={error} onRetry={regenerateTab} />}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <NeoTabs tabs={TABS} active={tab} onChange={setTab} />
        <NeoButton
          variant="outline"
          size="sm"
          onClick={regenerateTab}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" /> Regenerate tab
        </NeoButton>
      </div>

      {loading && <LoadingAI label="Generating questions…" />}

      {!prep && !loading ? (
        <EmptyState
          icon={RefreshCw}
          title="No prep yet"
          description="Generate a full question bank tailored to this job posting."
          actionLabel="Generate all tabs"
          onAction={regenerateTab}
        />
      ) : (
        <div className="space-y-3">
          {Array.isArray(questions) &&
            questions.map((q) => <QuestionItem key={q.id} q={q} />)}
        </div>
      )}
    </AppShell>
  );
}
