"use client";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoBadge } from "@/components/ui/neo-badge";
import { STATUS_LABELS } from "@/lib/constants";
import { useRezume } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Briefcase, FileText, Plus, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { applications, profile, apiKey } = useRezume();
  const recent = applications.slice(0, 5);

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NeoCard className="bg-neo-lime">
            <p className="text-sm font-black uppercase">Welcome back</p>
            <h2 className="mt-1 text-2xl font-black">
              {profile.targetRole || "Your job hunt command center"}
            </h2>
            <p className="mt-2 font-medium">
              {profile.hasUltimateProfile
                ? "Your Ultimate Profile is ready. Paste a JD and tailor in one click."
                : "Complete your profile to unlock tailoring."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/jobs?add=1">
                <NeoButton variant="primary">
                  <Plus className="h-4 w-4" /> Add job
                </NeoButton>
              </Link>
              {recent[0] && (
                <Link href={`/jobs/${recent[0].id}/resume`}>
                  <NeoButton>
                    <Sparkles className="h-4 w-4" /> Generate resume
                  </NeoButton>
                </Link>
              )}
            </div>
          </NeoCard>

          <section>
            <h3 className="mb-4 text-lg font-black uppercase">Recent applications</h3>
            {recent.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No applications yet"
                description="Add a job posting to start tailoring resumes and tracking your pipeline."
                actionLabel="Add your first job"
                actionHref="/jobs?add=1"
              />
            ) : (
              <div className="space-y-3">
                {recent.map((app) => (
                  <Link key={app.id} href={`/jobs/${app.id}`}>
                    <NeoCard
                      flat
                      className="flex flex-wrap items-center justify-between gap-3 transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#0a0a0a]"
                    >
                      <div>
                        <p className="font-black">{app.jobTitle}</p>
                        <p className="text-sm font-medium">{app.company}</p>
                      </div>
                      <NeoBadge className={STATUS_LABELS[app.status].color}>
                        {STATUS_LABELS[app.status].label}
                      </NeoBadge>
                    </NeoCard>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <NeoCard>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <h3 className="font-black uppercase">AI connection</h3>
            </div>
            {apiKey?.verified ? (
              <p className="mt-3 font-medium">
                <span className="font-black capitalize">{apiKey.provider}</span> —{" "}
                {apiKey.maskedKey}
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-red-700">
                Not connected. Update in Settings.
              </p>
            )}
            <Link href="/settings" className="mt-4 inline-block">
              <NeoButton size="sm" variant="outline">
                Manage
              </NeoButton>
            </Link>
          </NeoCard>

          <NeoCard className="bg-neo-blue text-white">
            <FileText className="h-6 w-6" />
            <p className="mt-2 font-black">Quick stats</p>
            <ul className="mt-3 space-y-2 text-sm font-bold">
              <li>{applications.length} jobs tracked</li>
              <li>
                {applications.filter((a) => a.tailoredResume).length} tailored resumes
              </li>
              <li>
                {applications.filter((a) => a.status === "interview").length} in interview
              </li>
            </ul>
          </NeoCard>

          {recent[0] && (
            <NeoCard flat>
              <p className="text-xs font-bold uppercase opacity-70">Last added</p>
              <p className="font-black">{recent[0].jobTitle}</p>
              <p className="text-sm">{formatDate(recent[0].createdAt)}</p>
            </NeoCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
