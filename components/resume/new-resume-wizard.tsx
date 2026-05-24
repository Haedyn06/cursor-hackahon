"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { generateTailoredResume as generateTailoredResumeApi } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { buildStoredResumeUpdate } from "@/lib/jobs/persist-generated-content";
import { getInitialProfile } from "@/lib/onboarding-storage";
import { prepareSourceMaterialInputs } from "@/lib/profile/source-material-input";
import { resumeDocumentToPlainText } from "@/lib/resume-document";
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
  const { jobs, updateJob } = useJobs();
  const toast = useToast();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );

  const [step, setStep] = useState(1);
  const [jobSource, setJobSource] = useState<JobSource>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [newJobMode, setNewJobMode] = useState<NewJobMode>("manual");
  const [manualForm, setManualForm] = useState({
    title: "",
    company: "",
    jd: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const aiSession = open ? loadAiSession() : null;

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setStep(1);
        setJobSource(null);
        setSelectedJobId(null);
        setNewJobMode("manual");
        setManualForm({ title: "", company: "", jd: "" });
        setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
        setGenerating(false);
        setGenerateError(null);
      });
    }
  }, [open]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const selectedTemplate =
    RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? RESUME_TEMPLATES[0];

  const resumeProfileContext = useMemo(() => ({
    fullName: onboardingState?.profile?.fullName ?? null,
    email: onboardingState?.profile?.email ?? null,
    location: onboardingState?.profile?.location ?? null,
    phone: onboardingState?.profile?.phone ?? null,
    targetRole: onboardingState?.profile?.targetRole ?? null,
    about: onboardingState?.profile?.about ?? null,
    skills:
      onboardingState?.skills
        ?.slice()
        .sort((a, b) => a.position - b.position)
        .map((skill) => skill.name) ?? [],
  }), [onboardingState]);

  const resolvedJob = (): {
    title: string;
    company: string;
    matchJob: string;
    description: string;
  } | null => {
    if (jobSource === "saved" && selectedJob) {
      return {
        title: selectedJob.title,
        company: selectedJob.company,
        matchJob: `${selectedJob.title} @ ${selectedJob.company}`,
        description:
          selectedJob.jd.trim() ||
          `${selectedJob.title} at ${selectedJob.company}`,
      };
    }
    if (jobSource === "new") {
      if (newJobMode === "manual" && manualForm.title && manualForm.company) {
        return {
          title: manualForm.title,
          company: manualForm.company,
          matchJob: `${manualForm.title} @ ${manualForm.company}`,
          description:
            manualForm.jd.trim() ||
            `${manualForm.title} at ${manualForm.company}`,
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
        newJobMode === "manual" &&
        manualForm.title &&
        manualForm.company;


  const handleGenerate = async () => {
    if (!jobContext) {
      toast("Select a job first.", "error");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      const message = "No AI provider connected. Go to Settings and verify your API key.";
      setGenerateError(message);
      toast(message, "error");
      return;
    }

    setGenerateError(null);
    setGenerating(true);

    try {
      const profile = getInitialProfile();
      const sourceMaterials = await prepareSourceMaterialInputs(
        onboardingState?.profileSourceMaterials ?? [],
        (sourceMaterialId) => getProfileSourceDownloadUrl({ sourceMaterialId }),
      );
      const result = await generateTailoredResumeApi({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: {
          title: jobContext.title,
          company: jobContext.company,
          description: jobContext.description,
        },
        profile,
        sourceMaterials,
      });

      const content = resumeDocumentToPlainText(result.resume);

      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — ${jobContext.title}`,
        matchJob: jobContext.matchJob,
        templateName: selectedTemplate.name,
        content: buildMockResumeContent(
          jobContext.title,
          jobContext.company,
          resumeProfileContext,
        ),
        matchScore: 87,
        matchedKeywords: ["React", "TypeScript", "GraphQL", "CSS"],
        missingKeywords: ["Kubernetes", "Python"],
      });

      if (jobSource === "saved" && selectedJobId) {
        await updateJob(
          selectedJobId,
          buildStoredResumeUpdate({
            document: result.resume,
            matchScore: result.matchScore,
            matchedKeywords: result.matchedKeywords,
            missingKeywords: result.missingKeywords,
          }),
        );
        toast("Resume generated and saved to job!");
      } else {
        toast("Resume generated!");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate resume.";
      setGenerateError(message);
      toast(message, "error");
    } finally {
      setGenerating(false);
    }
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
          {!aiSession && (
            <div className="rounded-xl bg-[var(--peach)] px-4 py-3 text-xs font-bold neo-border-sm">
              No AI provider connected. Open Settings, paste your Groq key, and click Verify.
            </div>
          )}

          {generateError && (
            <div className="rounded-xl bg-[var(--red-l)] px-4 py-3 text-xs font-bold text-[#800] neo-border-sm">
              {generateError}
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-[var(--lav-l)] px-4 py-6 text-center neo-border-sm">
              <div className="flex h-14 w-14 animate-pulse-soft items-center justify-center rounded-2xl bg-[var(--lav)] text-2xl neo-border-sm">
                ✦
              </div>
              <div className="font-heading text-lg font-extrabold">
                Generating your resume...
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["Reading job description", "Analyzing profile", "Tailoring bullets", "Scoring match"].map(
                  (s) => (
                    <NeoBadge key={s} color="var(--lav-l)" className="text-[10px]">
                      {s}
                    </NeoBadge>
                  ),
                )}
              </div>
            </div>
          )}

          {!generating && (
            <>
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
            <NeoButton variant="secondary" size="sm" onClick={() => setStep(1)} disabled={generating}>
              ← Back
            </NeoButton>
            <NeoButton
              variant="primary"
              size="sm"
              disabled={generating || !aiSession}
              onClick={() => void handleGenerate()}
            >
              {generating ? "Generating..." : "✦ Generate Resume"}
            </NeoButton>
          </div>
            </>
          )}
        </div>
      )}
    </SlideOver>
  );
}
