"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner, LoadingAI } from "@/components/ui/empty-state";
import { analyzeJobPostingUrl } from "@/lib/analyze-job-url";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoSelect, NeoLabel } from "@/components/ui/neo-input";
import { STATUS_LABELS } from "@/lib/constants";
import { generateCoverLetter, generateInterviewPrep } from "@/lib/mock-ai";
import { useRezume } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";
import {
  ArrowLeft,
  FileText,
  Mail,
  MessageCircleQuestion,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getApplication, updateApplication, profile, apiKey } = useRezume();
  const app = getApplication(id);

  const [loadingCover, setLoadingCover] = useState(false);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshingJd, setRefreshingJd] = useState(false);

  const refreshFromUrl = async () => {
    if (!app?.url) return;
    setRefreshingJd(true);
    setError(null);
    try {
      const result = await analyzeJobPostingUrl(app.url);
      updateApplication(id, {
        jdText: result.jdText,
        jobTitle: result.jobTitle || app.jobTitle,
        company: result.company || app.company,
        source: result.source,
        metadata: result.metadata,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refresh from URL.");
    } finally {
      setRefreshingJd(false);
    }
  };

  if (!app) {
    return (
      <AppShell title="Job not found">
        <NeoCard>
          <p className="font-bold">This job doesn&apos;t exist.</p>
          <Link href="/jobs" className="mt-4 inline-block">
            <NeoButton>Back to board</NeoButton>
          </Link>
        </NeoCard>
      </AppShell>
    );
  }

  const handleCoverLetter = async () => {
    if (!apiKey?.verified) {
      setError("Connect a valid API key in Settings.");
      return;
    }
    setLoadingCover(true);
    setError(null);
    try {
      const body = await generateCoverLetter(
        profile,
        app.jobTitle,
        app.company,
        app.jdText
      );
      updateApplication(id, {
        coverLetter: { body, generatedAt: new Date().toISOString() },
      });
      setCoverPreview(body);
    } catch {
      setError("Cover letter generation failed.");
    } finally {
      setLoadingCover(false);
    }
  };

  const handleInterviewPrep = async () => {
    if (!apiKey?.verified) {
      setError("Connect a valid API key in Settings.");
      return;
    }
    setLoadingInterview(true);
    setError(null);
    try {
      const prep = await generateInterviewPrep(app.jobTitle, app.company, app.jdText);
      updateApplication(id, { interviewPrep: prep });
      router.push(`/jobs/${id}/interview`);
    } catch {
      setError("Interview prep generation failed.");
    } finally {
      setLoadingInterview(false);
    }
  };

  const displayCover = coverPreview ?? app.coverLetter?.body;

  return (
    <AppShell title={app.jobTitle}>
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Job board
      </Link>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <NeoCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{app.jobTitle}</h2>
              <p className="text-lg font-bold text-neo-blue">{app.company}</p>
            </div>
            <NeoBadge className={STATUS_LABELS[app.status].color}>
              {STATUS_LABELS[app.status].label}
            </NeoBadge>
          </div>

          <div>
            <NeoLabel htmlFor="status">Application stage</NeoLabel>
            <NeoSelect
              id="status"
              value={app.status}
              onChange={(e) =>
                updateApplication(id, {
                  status: e.target.value as ApplicationStatus,
                })
              }
            >
              {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NeoSelect>
          </div>

          {app.metadata && (
            <NeoCard flat className="!p-4">
              <p className="mb-3 text-sm font-black uppercase">Job metadata</p>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li>
                  <span className="font-bold">Location:</span>{" "}
                  {app.metadata.location || "—"}
                </li>
                <li>
                  <span className="font-bold">Work type:</span>{" "}
                  {app.metadata.typeOfWork || "—"}
                </li>
                <li>
                  <span className="font-bold">Salary:</span>{" "}
                  {app.metadata.typeOfSalary || "—"}
                </li>
                <li>
                  <span className="font-bold">Applied:</span>{" "}
                  {app.metadata.applicationDate ?? "—"}
                </li>
              </ul>
              {app.metadata.identifiedSkills.length > 0 && (
                <p className="mt-2 text-xs font-medium">
                  AI skills: {app.metadata.identifiedSkills.join(", ")}
                </p>
              )}
            </NeoCard>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black uppercase">
                Job description {app.url ? "(from URL)" : ""}
              </p>
              {app.url && (
                <NeoButton
                  size="sm"
                  variant="outline"
                  disabled={refreshingJd}
                  onClick={refreshFromUrl}
                >
                  <RefreshCw className="h-3 w-3" />
                  {refreshingJd ? "Refreshing…" : "Re-analyze URL"}
                </NeoButton>
              )}
            </div>
            {refreshingJd && (
              <div className="mt-2">
                <LoadingAI label="Re-fetching job posting…" />
              </div>
            )}
            <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border-2 border-neo-ink bg-neo-bg/50 p-4 text-sm font-medium whitespace-pre-wrap">
              {app.jdText}
            </div>
          </div>

          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-neo-blue underline"
            >
              View original posting
            </a>
          )}
        </NeoCard>

        <div className="space-y-4">
          <NeoCard className="bg-neo-orange/20">
            <h3 className="font-black uppercase">Actions</h3>
            <div className="mt-4 space-y-3">
              <Link href={`/jobs/${id}/resume`} className="block">
                <NeoButton variant="primary" className="w-full justify-start">
                  <Sparkles className="h-4 w-4" /> Tailor resume
                </NeoButton>
              </Link>
              <NeoButton
                className="w-full justify-start"
                onClick={handleCoverLetter}
                disabled={loadingCover}
              >
                <Mail className="h-4 w-4" /> Generate cover letter
              </NeoButton>
              <NeoButton
                className="w-full justify-start"
                variant="lime"
                onClick={handleInterviewPrep}
                disabled={loadingInterview}
              >
                <MessageCircleQuestion className="h-4 w-4" /> Interview prep
              </NeoButton>
            </div>
          </NeoCard>

          {app.tailoredResume && (
            <NeoCard flat>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <p className="font-black">Resume generated</p>
              </div>
              <Link href={`/jobs/${id}/resume`} className="mt-2 inline-block text-sm font-bold underline">
                Open builder
              </Link>
            </NeoCard>
          )}

          {loadingCover && <LoadingAI label="Writing cover letter…" />}
          {displayCover && (
            <NeoCard>
              <div className="flex items-center justify-between">
                <p className="font-black uppercase">Cover letter preview</p>
                <Link href={`/jobs/${id}/cover-letter`}>
                  <NeoButton size="sm">Full view</NeoButton>
                </Link>
              </div>
              <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm font-medium">
                {displayCover.slice(0, 400)}
                {displayCover.length > 400 ? "…" : ""}
              </p>
            </NeoCard>
          )}

          {loadingInterview && <LoadingAI label="Building question bank…" />}

          {app.interviewPrep && (
            <NeoCard className="bg-neo-purple/10">
              <p className="font-black">Interview prep ready</p>
              <Link href={`/jobs/${id}/interview`} className="mt-2 inline-block">
                <NeoButton size="sm">Open prep</NeoButton>
              </Link>
            </NeoCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
