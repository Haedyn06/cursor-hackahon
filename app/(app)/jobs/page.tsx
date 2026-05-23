"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AddJobForm } from "@/components/jobs/add-job-form";
import { EmptyState } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoBadge } from "@/components/ui/neo-badge";
import { SlideOver } from "@/components/ui/slide-over";
import { STATUS_LABELS } from "@/lib/constants";
import { useRezume } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Briefcase, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function JobBoardContent() {
  const { applications, addApplication } = useRezume();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [slideOpen, setSlideOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("add") === "1") setSlideOpen(true);
  }, [searchParams]);

  return (
    <AppShell title="Job Board">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="font-medium">
          Paste a job posting URL — we analyze the description and tailor your resume.
          Track every application from Apply → Offer.
        </p>
        <NeoButton variant="primary" onClick={() => setSlideOpen(true)}>
          <Plus className="h-4 w-4" /> Add job
        </NeoButton>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Your job board is empty"
          description="Add a job posting URL. Rezume fetches the description, analyzes it, and tailors your resume."
          actionLabel="Add job from URL"
          onAction={() => setSlideOpen(true)}
        />
      ) : (
        <div className="neo-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b-[3px] border-neo-ink bg-neo-purple text-white">
                <tr>
                  <th className="px-4 py-3 font-black uppercase">Role</th>
                  <th className="px-4 py-3 font-black uppercase">Company</th>
                  <th className="px-4 py-3 font-black uppercase">Status</th>
                  <th className="px-4 py-3 font-black uppercase">Added</th>
                  <th className="px-4 py-3 font-black uppercase">Source</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="cursor-pointer border-b border-neo-ink/20 transition-colors hover:bg-neo-lime/40"
                    onClick={() => router.push(`/jobs/${app.id}`)}
                  >
                    <td className="px-4 py-3 font-bold">{app.jobTitle}</td>
                    <td className="px-4 py-3">{app.company}</td>
                    <td className="px-4 py-3">
                      <NeoBadge className={STATUS_LABELS[app.status].color}>
                        {STATUS_LABELS[app.status].label}
                      </NeoBadge>
                    </td>
                    <td className="px-4 py-3">{formatDate(app.createdAt)}</td>
                    <td className="px-4 py-3">{app.source ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        title="Add job from URL"
        wide
      >
        <AddJobForm
          onCancel={() => setSlideOpen(false)}
          submitLabel="Save & tailor resume"
          onSubmit={(data) => {
            const id = addApplication(data);
            setSlideOpen(false);
            router.push(`/jobs/${id}/resume`);
          }}
        />
      </SlideOver>
    </AppShell>
  );
}

export default function JobBoardPage() {
  return (
    <Suspense fallback={<div className="p-8 font-bold">Loading job board…</div>}>
      <JobBoardContent />
    </Suspense>
  );
}
