"use client";

import { ErrorBanner, LoadingAI } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoBadge } from "@/components/ui/neo-badge";
import {
  NeoInput,
  NeoLabel,
  NeoTextarea,
} from "@/components/ui/neo-input";
import { analyzeJobPostingUrl } from "@/lib/analyze-job-url";
import type { AnalyzedJobPosting } from "@/lib/job-types";
import type { JobMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link2, Sparkles } from "lucide-react";
import { useState } from "react";

export type AddJobFormData = {
  jobTitle: string;
  company: string;
  jdText: string;
  url: string;
  source: string;
  metadata?: JobMetadata;
};

function MetadataGrid({ metadata }: { metadata: JobMetadata }) {
  const rows = [
    ["Location", metadata.location || "—"],
    ["Type of work", metadata.typeOfWork || "—"],
    ["Salary", metadata.typeOfSalary || "—"],
    ["Application date", metadata.applicationDate ?? "—"],
    ["Job key", metadata.jobKey || "—"],
  ];
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border-2 border-neo-ink/20 bg-white p-2">
          <dt className="text-xs font-black uppercase opacity-70">{label}</dt>
          <dd className="font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AddJobForm({
  onSubmit,
  onCancel,
  submitLabel = "Save & tailor resume",
}: {
  onSubmit: (data: AddJobFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [form, setForm] = useState<AddJobFormData>({
    jobTitle: "",
    company: "",
    jdText: "",
    url: "",
    source: "Manual",
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<AnalyzedJobPosting | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyAnalysis = (result: AnalyzedJobPosting) => {
    setAnalyzed(result);
    setForm({
      jobTitle: result.jobTitle,
      company: result.company,
      jdText: result.jdText,
      url: result.url,
      source: result.source,
      metadata: result.metadata,
    });
  };

  const analyzeUrl = async () => {
    const url = form.url.trim();
    if (!url) {
      setError("Paste a job posting URL first.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeJobPostingUrl(url);
      applyAnalysis(result);
    } catch (e) {
      setAnalyzed(null);
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canSubmit =
    form.jdText.trim().length >= 80 &&
    form.jobTitle.trim() &&
    form.company.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["url", "manual"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "neo-btn flex-1 px-3 py-2 text-sm",
              mode === m ? "bg-neo-lime" : "bg-white"
            )}
          >
            {m === "url" ? "Indeed / URL" : "Paste JD"}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <>
          <div>
            <NeoLabel htmlFor="job-url">Job posting URL</NeoLabel>
            <NeoInput
              id="job-url"
              type="url"
              placeholder="https://ca.indeed.com/viewjob?jk=…"
              value={form.url}
              onChange={(e) => {
                setForm({ ...form, url: e.target.value });
                setAnalyzed(null);
              }}
            />
            <p className="mt-1.5 text-xs font-medium opacity-80">
              Indeed links use our Python scraper, then AI extracts metadata and tailors
              your resume.
            </p>
          </div>

          <NeoButton
            type="button"
            variant="primary"
            className="w-full"
            onClick={analyzeUrl}
            disabled={analyzing || !form.url.trim()}
          >
            <Sparkles className="h-4 w-4" />
            {analyzing
              ? "Scraping & analyzing…"
              : analyzed
                ? "Re-analyze URL"
                : "Analyze posting"}
          </NeoButton>

          {analyzing && (
            <LoadingAI label="Running scraper → AI metadata → ready to tailor…" />
          )}

          {analyzed && (
            <NeoCard className="space-y-4 bg-neo-lime/30 !p-4">
              <div>
                <p className="font-black">AI analysis complete</p>
                <p className="mt-1 text-sm font-medium">
                  {form.jdText.length.toLocaleString()} chars · {form.source}
                </p>
              </div>
              <MetadataGrid metadata={analyzed.metadata} />
              {analyzed.metadata.identifiedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analyzed.metadata.identifiedSkills.map((s) => (
                    <NeoBadge key={s} className="bg-neo-blue text-white">
                      {s}
                    </NeoBadge>
                  ))}
                </div>
              )}
              <p className="rounded-md border-2 border-neo-ink/30 bg-white p-3 text-sm font-medium">
                {analyzed.metadata.aiInsights}
              </p>
            </NeoCard>
          )}
        </>
      ) : (
        <div>
          <NeoLabel htmlFor="jd-manual">Job description</NeoLabel>
          <NeoTextarea
            id="jd-manual"
            rows={8}
            placeholder="Paste the full job description…"
            value={form.jdText}
            onChange={(e) => setForm({ ...form, jdText: e.target.value })}
          />
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onRetry={mode === "url" ? analyzeUrl : undefined} />
      )}

      {(analyzed || mode === "manual") && (
        <NeoCard flat className="space-y-3 !p-4">
          <p className="text-xs font-black uppercase">Details (edit if needed)</p>
          <div>
            <NeoLabel htmlFor="jt">Job title</NeoLabel>
            <NeoInput
              id="jt"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
          </div>
          <div>
            <NeoLabel htmlFor="co">Company</NeoLabel>
            <NeoInput
              id="co"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          {mode === "url" && form.jdText && (
            <details className="text-sm">
              <summary className="cursor-pointer font-bold">View full job description</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border-2 border-neo-ink/20 bg-neo-bg/50 p-2 text-xs">
                {form.jdText.slice(0, 3000)}
                {form.jdText.length > 3000 ? "\n…" : ""}
              </pre>
            </details>
          )}
        </NeoCard>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <NeoButton type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </NeoButton>
        )}
        <NeoButton
          type="button"
          variant="lime"
          className="flex-1"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          <Link2 className="h-4 w-4" /> {submitLabel}
        </NeoButton>
      </div>

      {!canSubmit && (analyzed || mode === "manual") && (
        <p className="text-xs font-bold text-neo-orange">
          Analyze a URL first, or add title, company, and description (80+ characters).
        </p>
      )}
    </div>
  );
}
