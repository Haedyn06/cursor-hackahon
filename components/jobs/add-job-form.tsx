"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { loadAiSession } from "@/lib/ai/session";
import { isIndeedJobUrl } from "@/lib/scrape/indeed";
import { cn } from "@/lib/utils";
import type { CreateJobInput } from "@/lib/types/job";

const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Company Site",
  "GitHub Jobs",
  "Referral",
  "Other",
];

const EMPTY_FORM = {
  title: "",
  company: "",
  url: "",
  jd: "",
  source: "LinkedIn",
};

type AddMode = "ai" | "manual";

type AddJobFormProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (job: import("@/lib/types/job").Job) => void;
};

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AddMode;
  onChange: (mode: AddMode) => void;
}) {
  const options: { id: AddMode; label: string; icon: ReactNode }[] = [
    {
      id: "ai",
      label: "From link",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      id: "manual",
      label: "Manual",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-5 flex overflow-hidden rounded-full neo-border">
      {options.map((opt, idx) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-none px-4 py-2.5 font-sans text-[13px] font-bold transition-[background,color,transform] duration-200 ease-out",
              active
                ? "bg-[var(--foreground)] text-white"
                : "bg-white text-[var(--foreground)] hover:bg-[var(--mint-l)]",
            )}
            style={{
              borderRight:
                idx === 0 ? "2px solid var(--foreground)" : undefined,
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function JobFormFields({
  form,
  onChange,
  showAiBanner,
}: {
  form: typeof EMPTY_FORM;
  onChange: (
    key: keyof typeof EMPTY_FORM,
  ) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  showAiBanner?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {showAiBanner && (
        <div className="animate-slide-up flex items-start gap-2.5 rounded-xl bg-[var(--mint-l)] px-3.5 py-3 neo-border-sm">
          <span className="text-lg leading-none">✦</span>
          <div>
            <div className="text-[13px] font-extrabold">AI extracted details</div>
            <div className="text-xs font-medium text-[#666]">
              Review the fields below, edit anything, then save.
            </div>
          </div>
        </div>
      )}
      <NeoInput
        label="Job Title *"
        placeholder="e.g. Frontend Engineer"
        value={form.title}
        onChange={onChange("title")}
      />
      <NeoInput
        label="Company *"
        placeholder="e.g. Stripe"
        value={form.company}
        onChange={onChange("company")}
      />
      <NeoInput
        label="Job URL"
        placeholder="https://..."
        value={form.url}
        onChange={onChange("url")}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold">Source</label>
        <select
          value={form.source}
          onChange={onChange("source")}
          className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border transition-shadow duration-150"
        >
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <NeoInput
        label="Job Description *"
        placeholder="Paste the full job description here..."
        value={form.jd}
        onChange={onChange("jd")}
        multiline
        rows={10}
      />
    </div>
  );
}

export function AddJobForm({ open, onClose, onCreated }: AddJobFormProps) {
  const toast = useToast();
  const { createJob, importJobFromUrl } = useJobs();
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<AddMode>("ai");
  const [jobUrl, setJobUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const aiSession = open ? loadAiSession() : null;

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setMode("ai");
        setJobUrl("");
        setAnalyzing(false);
        setAnalyzeError(null);
        setAnalyzed(false);
        setForm(EMPTY_FORM);
      });
    }
  }, [open]);

  const handleAdd = async () => {
    if (!form.title || !form.company || saving) return;

    const input: CreateJobInput = {
      title: form.title,
      company: form.company,
      url: form.url || jobUrl,
      jd: form.jd,
      source: form.source,
      status: "Saved",
    };

    setSaving(true);
    try {
      const job = await createJob(input);
      onCreated?.(job);
      toast("Job added!");
      onClose();
    } catch {
      toast("Failed to add job.", "error");
    } finally {
      setSaving(false);
    }
  };

  const f =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleAnalyze = async () => {
    if (!jobUrl.trim()) return;

    const indeed = isIndeedJobUrl(jobUrl);
    const session = loadAiSession();

    if (!indeed && !session) {
      const message = "No AI provider connected. Go to Settings and verify your API key.";
      setAnalyzeError(message);
      toast(message, "error");
      return;
    }

    setAnalyzeError(null);
    setAnalyzing(true);

    try {
      const job = await importJobFromUrl({
        url: jobUrl.trim(),
        ...(session
          ? {
              providerId: session.providerId,
              apiKey: session.apiKey,
              model: session.model,
            }
          : {}),
      });

      onCreated?.(job);
      toast(`${job.title} @ ${job.company} imported!`);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import job posting.";
      setAnalyzeError(message);
      toast(message, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModeChange = (next: AddMode) => {
    setMode(next);
    if (next === "manual") {
      setAnalyzed(false);
      setAnalyzing(false);
    }
  };

  const canAnalyze = jobUrl.trim().length > 8;
  const showManualForm = mode === "manual" || analyzed;
  const canSave =
    !!form.title && !!form.company && (mode === "manual" || analyzed) && !saving;

  return (
    <SlideOver open={open} onClose={onClose} title="Add Job" width={480}>
      <ModeToggle mode={mode} onChange={handleModeChange} />

      {mode === "ai" && !analyzed && (
        <div key="ai-entry" className="animate-tab-panel flex flex-col gap-4">
          {!aiSession && !isIndeedJobUrl(jobUrl) && (
            <div className="rounded-xl bg-[var(--peach)] px-4 py-3 text-xs font-bold neo-border-sm">
              Connect an AI provider in Settings first — we use it to read non-Indeed job pages.
            </div>
          )}

          {isIndeedJobUrl(jobUrl) && (
            <div className="rounded-xl bg-[var(--mint-l)] px-4 py-3 text-xs font-bold neo-border-sm">
              Indeed link detected — uses browser scraper (no AI key needed).
            </div>
          )}

          {analyzeError && (
            <div className="rounded-xl bg-[var(--red-l)] px-4 py-3 text-xs font-bold text-[#800] neo-border-sm">
              {analyzeError}
            </div>
          )}

          <div className="rounded-2xl bg-[var(--lav-l)] p-4 neo-border">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--lav)] text-lg neo-border-sm">
                ✦
              </div>
              <div>
                <div className="font-heading text-[15px] font-extrabold">
                  AI job import
                </div>
                <div className="text-xs font-medium text-[#666]">
                  Paste a posting link — we&apos;ll fill the form for you.
                </div>
              </div>
            </div>

            <div
              className={cn(
                "mb-3 rounded-xl border-[2.5px] border-dashed px-4 py-5 text-center transition-[border-color,background] duration-200",
                analyzing
                  ? "border-[var(--foreground)] bg-white"
                  : "border-[#cccccc] bg-[var(--background)]",
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl neo-border-sm transition-transform duration-300",
                  analyzing && "scale-110",
                )}
              >
                {analyzing ? (
                  <span className="inline-block h-5 w-5 animate-spin-slow rounded-full border-2 border-[#ccc] border-t-[var(--foreground)]" />
                ) : (
                  "🔗"
                )}
              </div>
              <div className="mb-1 text-sm font-bold">
                {analyzing ? "Reading job posting…" : "Paste a job posting URL"}
              </div>
              <div className="text-xs text-[#888]">
                LinkedIn, Indeed, Greenhouse, Lever, company careers pages
              </div>
            </div>

            <NeoInput
              label="Job posting link"
              placeholder="https://linkedin.com/jobs/view/..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              }
            />

            {analyzing && (
              <div className="mt-3 flex flex-wrap gap-1.5 animate-fade-in">
                {[
                  "Fetching page",
                  "Extracting text",
                  "AI analysis",
                  "Saving job",
                ].map((step, i) => (
                  <NeoBadge
                    key={step}
                    color={i === 0 ? "var(--mint)" : "#ffffff"}
                    className={cn(
                      "text-[10px]",
                      i > 0 && "animate-pulse-soft",
                    )}
                  >
                    {i === 0 ? "✓" : "…"} {step}
                  </NeoBadge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleModeChange("manual")}
              className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[var(--foreground)]"
            >
              Enter manually instead
            </button>
            <NeoButton
              variant="primary"
              disabled={!canAnalyze || analyzing || (!aiSession && !isIndeedJobUrl(jobUrl))}
              onClick={() => void handleAnalyze()}
              className="transition-neo"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-[#aaa] border-t-white" />
                  Importing…
                </span>
              ) : (
                "✦ Scrape & import job →"
              )}
            </NeoButton>
          </div>
        </div>
      )}

      {mode === "ai" && analyzed && (
        <div key="ai-review" className="animate-tab-panel flex flex-col gap-4">
          <JobFormFields form={form} onChange={f} showAiBanner />
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setAnalyzed(false);
                setForm(EMPTY_FORM);
              }}
              className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[var(--foreground)]"
            >
              ← Try another link
            </button>
            <NeoButton
              variant="mint"
              onClick={() => void handleAdd()}
              disabled={!canSave}
              className="transition-neo hover:-translate-y-px"
            >
              {saving ? "Saving…" : "Save job →"}
            </NeoButton>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div key="manual" className="animate-tab-panel flex flex-col gap-4">
          <p className="text-[13px] font-medium text-[#666]">
            Fill in the job details yourself. Paste the full description for
            better AI resume matching later.
          </p>
          <JobFormFields form={form} onChange={f} />
            <NeoButton
              variant="mint"
              onClick={() => void handleAdd()}
              disabled={!canSave}
              className="self-end transition-neo hover:-translate-y-px"
            >
              {saving ? "Saving…" : "Save job →"}
            </NeoButton>
        </div>
      )}
    </SlideOver>
  );
}
