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
  buildMockCoverLetterContent,
  type GeneratedCoverLetter,
} from "@/components/resume/cover-letter-preview-panel";

const WIZARD_STEPS = ["Select job", "Generate"];

type JobSource = "saved" | "new" | null;
type NewJobMode = "link" | "manual";

type NewCoverLetterWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (coverLetter: GeneratedCoverLetter) => void;
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
        active ? "bg-[var(--yellow-l)]" : "bg-white hover:bg-[var(--background)]",
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

export function NewCoverLetterWizard({
  open,
  onClose,
  onComplete,
}: NewCoverLetterWizardProps) {
  const { jobs } = useJobs();

  const [step, setStep] = useState(1);
  const [jobSource, setJobSource] = useState<JobSource>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [newJobMode, setNewJobMode] = useState<NewJobMode>("manual");
  const [manualForm, setManualForm] = useState({
    title: "",
    company: "",
    jd: "",
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setStep(1);
        setJobSource(null);
        setSelectedJobId(null);
        setNewJobMode("manual");
        setManualForm({ title: "", company: "", jd: "" });
        setGenerating(false);
      });
    }
  }, [open]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const resolvedJob = (): { title: string; company: string; matchJob: string } | null => {
    if (jobSource === "saved" && selectedJob) {
      return {
        title: selectedJob.title,
        company: selectedJob.company,
        matchJob: `${selectedJob.title} @ ${selectedJob.company}`,
      };
    }
    if (jobSource === "new") {
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

  const canGenerate =
    jobSource === "saved"
      ? !!selectedJob
      : jobSource === "new" &&
        newJobMode === "manual" &&
        manualForm.title &&
        manualForm.company;


  const handleGenerate = () => {
    if (!jobContext) return;
    setStep(2);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — Cover Letter`,
        matchJob: jobContext.matchJob,
        content: buildMockCoverLetterContent(
          jobContext.title,
          jobContext.company,
        ),
      });
      onClose();
    }, 2200);
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
                active ? "bg-[var(--yellow-l)]" : "bg-white hover:bg-[var(--background)]",
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
    <SlideOver open={open} onClose={onClose} title="New Cover Letter" width={520}>
      <div className="mb-6">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="animate-tab-panel flex flex-col gap-5">
          <p className="text-[13px] font-medium text-[#666]">
            Which job is this cover letter for?
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
              variant="yellow"
              size="sm"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              ✦ Generate Cover Letter
            </NeoButton>
          </div>
        </div>
      )}

      {step === 2 && generating && (
        <div className="animate-tab-panel flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--yellow)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Writing your cover letter...
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              "Reading your profile",
              "Matching tone",
              "Drafting paragraphs",
              "Polishing",
            ].map((s, i) => (
              <NeoBadge
                key={s}
                color="var(--yellow-l)"
                className="animate-fade-in text-[11px]"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {s}
              </NeoBadge>
            ))}
          </div>
        </div>
      )}
    </SlideOver>
  );
}
