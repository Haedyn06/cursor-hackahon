"use client";

import { type ReactNode } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { cn } from "@/lib/utils";
import type { WizardJobPostState } from "@/lib/hooks/use-wizard-job-post";
import type { WizardNewJobMode } from "@/lib/jobs/wizard-job-post";
import type { Job } from "@/lib/types/job";

function SourceCard({
  active,
  onClick,
  icon,
  title,
  description,
  activeClassName,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-start gap-2 rounded-2xl p-4 text-left transition-[background,transform] duration-150 neo-border",
        active ? activeClassName : "bg-white hover:bg-[var(--background)]",
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

function SavedJobList({
  jobs,
  selectedJobId,
  onSelect,
  activeClassName,
}: {
  jobs: Job[];
  selectedJobId: string | null;
  onSelect: (jobId: string) => void;
  activeClassName: string;
}) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-xl bg-[var(--background)] p-4 text-sm font-medium text-[#888] neo-border-sm">
        No saved jobs yet. Add a new job posting instead.
      </p>
    );
  }

  return (
    <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
      {jobs.map((job) => {
        const active = selectedJobId === job.id;
        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            className={cn(
              "cursor-pointer rounded-xl px-4 py-3 text-left transition-colors neo-border-sm",
              active ? activeClassName : "bg-white hover:bg-[var(--background)]",
            )}
          >
            <div className="text-sm font-bold">{job.position}</div>
            <div className="text-xs font-medium text-[#666]">{job.company}</div>
          </button>
        );
      })}
    </div>
  );
}

const NEW_JOB_MODES: Array<{ id: WizardNewJobMode; label: string }> = [
  { id: "manual", label: "Manual" },
  { id: "link", label: "From link" },
  { id: "paste", label: "Paste" },
  { id: "file", label: "Upload file" },
];

type WizardJobPostInputProps = {
  state: WizardJobPostState;
  accentClassName: string;
  savedJobActiveClassName: string;
};

export function WizardJobPostInput({
  state,
  accentClassName,
  savedJobActiveClassName,
}: WizardJobPostInputProps) {
  const {
    jobs,
    jobSource,
    setJobSource,
    selectedJobId,
    setSelectedJobId,
    newJobMode,
    setNewJobMode,
    form,
    setForm,
    importing,
    importError,
    importFromLink,
    importFromPaste,
    importFromFile,
  } = state;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] font-medium text-[#666]">
        Which job is this for?
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
          description="Pick from jobs already in your tracker."
          activeClassName={savedJobActiveClassName}
        />
        <SourceCard
          active={jobSource === "new"}
          onClick={() => setJobSource("new")}
          icon="🔗"
          title="New job post"
          description="Enter manually, import a link, paste text, or upload a file."
          activeClassName={accentClassName}
        />
      </div>

      {jobSource === "saved" ? (
        <SavedJobList
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelect={setSelectedJobId}
          activeClassName={savedJobActiveClassName}
        />
      ) : null}

      {jobSource === "new" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {NEW_JOB_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setNewJobMode(mode.id)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold neo-border-sm",
                  newJobMode === mode.id ? accentClassName : "bg-white",
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {importError ? (
            <div className="rounded-xl bg-[var(--red-l)] px-4 py-3 text-xs font-bold text-[#800] neo-border-sm">
              {importError}
            </div>
          ) : null}

          {newJobMode === "link" ? (
            <div className="flex flex-col gap-3">
              <NeoInput
                label="Job posting URL"
                placeholder="https://..."
                value={form.url}
                onChange={(event) =>
                  setForm((current) => ({ ...current, url: event.target.value }))
                }
              />
              <NeoButton
                variant="secondary"
                size="sm"
                disabled={importing || !form.url.trim()}
                onClick={() => void importFromLink()}
              >
                {importing ? "Importing..." : "Import from link →"}
              </NeoButton>
            </div>
          ) : null}

          {newJobMode === "paste" ? (
            <div className="flex flex-col gap-3">
              <NeoInput
                label="Source URL (optional)"
                placeholder="https://..."
                value={form.url}
                onChange={(event) =>
                  setForm((current) => ({ ...current, url: event.target.value }))
                }
              />
              <NeoInput
                label="Pasted job posting"
                placeholder="Paste the full job description here..."
                value={form.pastedText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pastedText: event.target.value,
                  }))
                }
                multiline
                rows={6}
              />
              <NeoButton
                variant="secondary"
                size="sm"
                disabled={importing || form.pastedText.trim().length < 80}
                onClick={() => void importFromPaste()}
              >
                {importing ? "Extracting..." : "Extract with AI →"}
              </NeoButton>
            </div>
          ) : null}

          {newJobMode === "file" ? (
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold">Job posting file</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,text/plain,application/pdf"
                disabled={importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importFromFile(file);
                  }
                  event.target.value = "";
                }}
                className="block w-full text-sm"
              />
              <p className="text-xs text-[#777]">
                Upload a PDF, DOCX, or TXT job posting. AI will extract the title,
                company, and description when possible.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <NeoInput
              label="Position *"
              placeholder="e.g. Frontend Engineer"
              value={form.position}
              onChange={(event) =>
                setForm((current) => ({ ...current, position: event.target.value }))
              }
            />
            <NeoInput
              label="Company *"
              placeholder="e.g. Stripe"
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({ ...current, company: event.target.value }))
              }
            />
            <NeoInput
              label="Job Description"
              placeholder="Paste or import the full job description..."
              value={form.jobDesc}
              onChange={(event) =>
                setForm((current) => ({ ...current, jobDesc: event.target.value }))
              }
              multiline
              rows={newJobMode === "manual" ? 6 : 4}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
