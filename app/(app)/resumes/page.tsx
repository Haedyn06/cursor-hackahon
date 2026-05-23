"use client";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { useRezume } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function ResumesPage() {
  const { savedResumes, applications } = useRezume();

  const fromJobs = applications.filter((a) => a.tailoredResume);

  return (
    <AppShell title="Resumes">
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <p className="font-medium">
          Saved resumes from tailoring sessions and your library.
        </p>
        <Link href="/jobs?add=1">
          <NeoButton variant="primary">
            <Plus className="h-4 w-4" /> New from job
          </NeoButton>
        </Link>
      </div>

      {savedResumes.length === 0 && fromJobs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Tailor a resume from any job on your board, then save it to your library."
          actionLabel="Open job board"
          actionHref="/jobs"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fromJobs.map((app) => (
            <NeoCard key={app.id}>
              <p className="text-xs font-bold uppercase text-neo-purple">From job</p>
              <p className="mt-1 font-black">{app.jobTitle}</p>
              <p className="text-sm font-medium">{app.company}</p>
              <p className="mt-2 text-xs opacity-70">{formatDate(app.createdAt)}</p>
              <Link href={`/jobs/${app.id}/resume`} className="mt-4 inline-block">
                <NeoButton size="sm">Open builder</NeoButton>
              </Link>
            </NeoCard>
          ))}
          {savedResumes.map((r) => (
            <NeoCard key={r.id}>
              <p className="text-xs font-bold uppercase text-neo-blue">Library</p>
              <p className="mt-1 font-black">{r.label}</p>
              <p className="text-xs opacity-70">{formatDate(r.createdAt)}</p>
              <p className="mt-3 line-clamp-3 text-sm opacity-80">
                {r.extractedText.slice(0, 120)}…
              </p>
            </NeoCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
