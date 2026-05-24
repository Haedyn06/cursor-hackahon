"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types/job";
import {
  buildMockResumeContent,
  type GeneratedResume,
} from "@/components/resume/resume-preview-panel";

const WIZARD_STEPS = ["Select job", "Template", "Generate"];

const RESUME_TEMPLATES = [
  {
    id: "ats-classic",
    name: "ATS Classic",
    description: "Clean, single-column layout optimized for applicant tracking systems.",
    color: "var(--mint-l)",
    default: true,
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Spacious typography with subtle section dividers.",
    color: "var(--lav-l)",
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Strong headers and accent color for design-forward roles.",
    color: "var(--peach)",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Traditional format suited for senior and leadership roles.",
    color: "var(--yellow)",
  },
] as const;

const DEFAULT_TEMPLATE_ID = "ats-classic";

const DEMO_EXTRACT = {
  title: "Frontend Engineer",
  company: "Stripe",
  jd: "React, TypeScript, and modern frontend experience required.",
};

type JobSource = "saved" | "new" | null;
type NewJobMode = "link" | "manual";

type NewResumeWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (resume: GeneratedResume) => void;
};

function SourceCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-start gap-2 rounded-2xl p-4 text-left transition-[background,transform] duration-150 neo-border",
        active ? "bg-[var(--mint-l)]" : "bg-white hover:bg-[var(--background)]",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg neo-border-sm">
        {icon}
      </div>
      <div className="font-heading text-[15px] font-extrabold">{title}</div>
      <p className="text-xs font-medium leading-relaxed text-[#666]">{description}</p>
    </button>
  );
}

export function NewResumeWizard({ open, onClose, onComplete }: NewResumeWizardProps) {
  const toast = useToast();
  const { jobs } = useJobs();

  const [step, setStep] = useState(1);
  const [jobSource, setJobSource] = useState<JobSource>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [newJobMode, setNewJobMode] = useState<NewJobMode>("link");
  const [jobUrl, setJobUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [manualForm, setManualForm] = useState({
    title: "",
    company: "",
    jd: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setJobSource(null);
      setSelectedJobId(null);
      setNewJobMode("link");
      setJobUrl("");
      setAnalyzing(false);
      setAnalyzed(false);
      setManualForm({ title: "", company: "", jd: "" });
      setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
      setGenerating(false);
    }
  }, [open]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const selectedTemplate =
    RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? RESUME_TEMPLATES[0];

  const resolvedJob = (): { title: string; company: string; matchJob: string } | null => {
    if (jobSource === "saved" && selectedJob) {
      return {
        title: selectedJob.title,
        company: selectedJob.company,
        matchJob: `${selectedJob.title} @ ${selectedJob.company}`,
      };
    }
    if (jobSource === "new") {
      if (newJobMode === "link" && analyzed) {
        return {
          title: DEMO_EXTRACT.title,
          company: DEMO_EXTRACT.company,
          matchJob: `${DEMO_EXTRACT.title} @ ${DEMO_EXTRACT.company}`,
        };
      }
      if (newJobMode === "manual" && manualForm.title && manualForm.company) {
        return {
          title: manualForm.title,
          company: manualForm.company,
          matchJob: `${manualForm.title} @ ${manualForm.company}`,
        };
      }
    }
    return null;
  };

  const jobContext = resolvedJob();

  const canContinueStep1 =
    jobSource === "saved"
      ? !!selectedJob
      : jobSource === "new" &&
        ((newJobMode === "link" && analyzed) ||
          (newJobMode === "manual" && manualForm.title && manualForm.company));

  const handleAnalyze = () => {
    if (!jobUrl.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      toast("Job details extracted!");
    }, 1800);
  };

  const handleGenerate = () => {
    if (!jobContext) return;
    setStep(3);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — ${jobContext.title}`,
        matchJob: jobContext.matchJob,
        templateName: selectedTemplate.name,
        content: buildMockResumeContent(jobContext.title, jobContext.company),
        matchScore: 87,
        matchedKeywords: ["React", "TypeScript", "GraphQL", "CSS"],
        missingKeywords: ["Kubernetes", "Python"],
      });
      onClose();
    }, 2400);
  };

  const renderSavedJobs = () => (
    <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
      {jobs.length === 0 ? (
        <p className="rounded-xl bg-[var(--background)] p-4 text-sm font-medium text-[#888] neo-border-sm">
          No saved jobs yet. Add a new job posting instead.
        </p>
      ) : (
        jobs.map((job: Job) => {
          const active = selectedJobId === job.id;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-3 text-left transition-colors neo-border-sm",
                active ? "bg-[var(--mint-l)]" : "bg-white hover:bg-[var(--background)]",
              )}
            >
              <div className="text-sm font-bold">{job.title}</div>
              <div className="text-xs font-medium text-[#666]">{job.company}</div>
            </button>
          );
        })
      )}
    </div>
  );

  const renderNewJob = () => (
    <div className="flex flex-col gap-4">
      <div className="flex overflow-hidden rounded-full neo-border">
        {(
          [
            ["link", "From link"],
            ["manual", "Manual"],
          ] as const
        ).map(([mode, label], idx) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setNewJobMode(mode);
              setAnalyzed(false);
            }}
            className={cn(
              "flex-1 cursor-pointer border-none px-4 py-2.5 font-sans text-[13px] font-bold transition-colors",
              newJobMode === mode
                ? "bg-[var(--foreground)] text-white"
                : "bg-white text-[var(--foreground)] hover:bg-[var(--mint-l)]",
            )}
            style={{
              borderRight: idx === 0 ? "2px solid var(--foreground)" : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {newJobMode === "link" && !analyzed && (
        <div className="rounded-2xl bg-[var(--lav-l)] p-4 neo-border">
          <NeoInput
            label="Job posting link"
            placeholder="https://linkedin.com/jobs/view/..."
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <NeoButton
              variant="primary"
              size="sm"
              disabled={jobUrl.trim().length < 8 || analyzing}
              onClick={handleAnalyze}
            >
              {analyzing ? "Analyzing…" : "✦ Analyze link"}
            </NeoButton>
          </div>
          {analyzing && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Fetching page", "Parsing JD", "Extracting keywords"].map((s, i) => (
                <NeoBadge
                  key={s}
                  color={i === 0 ? "var(--mint)" : "#ffffff"}
                  className="text-[10px]"
                >
                  {i === 0 ? "✓" : "…"} {s}
                </NeoBadge>
              ))}
            </div>
          )}
        </div>
      )}

      {newJobMode === "link" && analyzed && (
        <div className="rounded-xl bg-[var(--mint-l)] px-4 py-3 neo-border-sm">
          <div className="text-[13px] font-extrabold">✦ AI extracted details</div>
          <div className="mt-1 text-sm font-bold">
            {DEMO_EXTRACT.title} @ {DEMO_EXTRACT.company}
          </div>
          <button
            type="button"
            onClick={() => setAnalyzed(false)}
            className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline"
          >
            Try another link
          </button>
        </div>
      )}

      {newJobMode === "manual" && (
        <div className="flex flex-col gap-3">
          <NeoInput
            label="Job Title *"
            placeholder="e.g. Frontend Engineer"
            value={manualForm.title}
            onChange={(e) =>
              setManualForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <NeoInput
            label="Company *"
            placeholder="e.g. Stripe"
            value={manualForm.company}
            onChange={(e) =>
              setManualForm((p) => ({ ...p, company: e.target.value }))
            }
          />
          <NeoInput
            label="Job Description"
            placeholder="Paste the full job description..."
            value={manualForm.jd}
            onChange={(e) => setManualForm((p) => ({ ...p, jd: e.target.value }))}
            multiline
            rows={5}
          />
        </div>
      )}
    </div>
  );

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="New Resume"
      width={520}
    >
      <div className="mb-6">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="animate-tab-panel flex flex-col gap-5">
          <p className="text-[13px] font-medium text-[#666]">
            Which job is this resume for?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SourceCard
              active={jobSource === "saved"}
              onClick={() => {
                setJobSource("saved");
                setSelectedJobId(jobs[0]?.id ?? null);
              }}
              icon="📋"
              title="Saved job"
              description="Pick from jobs you've already added to your tracker."
            />
            <SourceCard
              active={jobSource === "new"}
              onClick={() => setJobSource("new")}
              icon="🔗"
              title="New job post"
              description="Paste a link or enter details manually."
            />
          </div>

          {jobSource === "saved" && renderSavedJobs()}
          {jobSource === "new" && renderNewJob()}

          <div className="flex justify-end gap-2 pt-2">
            <NeoButton variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="primary"
              size="sm"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
            >
              Continue →
            </NeoButton>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-tab-panel flex flex-col gap-4">
          <p className="text-[13px] font-medium text-[#666]">
            Choose a template.{" "}
            <span className="font-bold text-[var(--foreground)]">
              ATS Classic
            </span>{" "}
            is selected by default.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {RESUME_TEMPLATES.map((template) => {
              const active = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    "cursor-pointer rounded-xl p-4 text-left transition-[background,transform] neo-border",
                    active ? "bg-[var(--mint-l)]" : "bg-white hover:bg-[var(--background)]",
                  )}
                >
                  <div
                    className="mb-2.5 flex h-[60px] w-12 items-center justify-center rounded-md neo-border-sm"
                    style={{ background: template.color }}
                  >
                    📄
                  </div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[13px] font-bold">{template.name}</span>
                    {template.id === DEFAULT_TEMPLATE_ID && (
                      <NeoBadge color="var(--mint)" className="text-[9px]">
                        Default
                      </NeoBadge>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug font-medium text-[#777]">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>

          {jobContext && (
            <div className="rounded-xl bg-[var(--background)] px-4 py-3 text-xs font-medium text-[#666] neo-border-sm">
              Tailoring for{" "}
              <strong className="text-[var(--foreground)]">{jobContext.matchJob}</strong>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <NeoButton variant="secondary" size="sm" onClick={() => setStep(1)}>
              ← Back
            </NeoButton>
            <NeoButton variant="primary" size="sm" onClick={handleGenerate}>
              ✦ Generate Resume
            </NeoButton>
          </div>
        </div>
      )}

      {step === 3 && generating && (
        <div className="animate-tab-panel flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--lav)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Generating your resume...
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["Analyzing JD", "Matching skills", "Crafting bullets", "Formatting"].map(
              (s, i) => (
                <NeoBadge
                  key={s}
                  color="var(--lav-l)"
                  className="animate-fade-in text-[11px]"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {s}
                </NeoBadge>
              ),
            )}
          </div>
        </div>
      )}
    </SlideOver>
  );
}
