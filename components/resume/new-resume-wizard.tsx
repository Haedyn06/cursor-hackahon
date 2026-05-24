"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { WizardJobPostInput } from "@/components/jobs/wizard-job-post-input";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { generateTailoredResume as generateTailoredResumeApi } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { buildStoredResumeUpdate } from "@/lib/jobs/persist-generated-content";
import { useAppProfile } from "@/lib/hooks/use-app-profile";
import { useWizardJobPost } from "@/lib/hooks/use-wizard-job-post";
import { prepareSourceMaterialInputs } from "@/lib/profile/source-material-input";
import { resumeDocumentToPlainText } from "@/lib/resume-document";
import { cn } from "@/lib/utils";
import type { GeneratedResume } from "@/components/resume/resume-preview-panel";

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

type NewResumeWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (resume: GeneratedResume) => void;
};

export function NewResumeWizard({ open, onClose, onComplete }: NewResumeWizardProps) {
  const { updateJob } = useJobs();
  const toast = useToast();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const { profile: appProfile, loading: profileLoading } = useAppProfile();
  const jobPost = useWizardJobPost(open);

  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const aiSession = open ? loadAiSession() : null;

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setStep(1);
        setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
        setGenerating(false);
        setGenerateError(null);
      });
    }
  }, [open]);

  const selectedTemplate =
    RESUME_TEMPLATES.find((template) => template.id === selectedTemplateId) ??
    RESUME_TEMPLATES[0];

  const handleGenerate = async () => {
    const jobContext = jobPost.jobContext;
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
      if (!appProfile) {
        const message = profileLoading
          ? "Loading your profile…"
          : "Complete your profile before generating a resume.";
        setGenerateError(message);
        toast(message, "error");
        return;
      }

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
        profile: appProfile,
        sourceMaterials,
      });

      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — ${jobContext.title}`,
        matchJob: jobContext.matchJob,
        templateName: selectedTemplate.name,
        templateId: selectedTemplate.id,
        content: resumeDocumentToPlainText(result.resume),
        document: result.resume,
        matchScore: result.matchScore,
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
        jobContext: {
          title: jobContext.title,
          company: jobContext.company,
          description: jobContext.description,
        },
      });

      if (jobPost.jobSource === "saved" && jobPost.selectedJobId) {
        await updateJob(
          jobPost.selectedJobId,
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

  return (
    <SlideOver open={open} onClose={onClose} title="New Resume" width={520}>
      <div className="mb-6">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {step === 1 ? (
        <div className="animate-tab-panel flex flex-col gap-5">
          <WizardJobPostInput
            state={jobPost}
            accentClassName="bg-[var(--mint-l)]"
            savedJobActiveClassName="bg-[var(--mint-l)]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <NeoButton variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="primary"
              size="sm"
              disabled={!jobPost.canContinue}
              onClick={() => setStep(2)}
            >
              Continue →
            </NeoButton>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-tab-panel flex flex-col gap-4">
          {!aiSession ? (
            <div className="rounded-xl bg-[var(--peach)] px-4 py-3 text-xs font-bold neo-border-sm">
              No AI provider connected. Open Settings, paste your API key, and click Verify.
            </div>
          ) : null}

          {generateError ? (
            <div className="rounded-xl bg-[var(--red-l)] px-4 py-3 text-xs font-bold text-[#800] neo-border-sm">
              {generateError}
            </div>
          ) : null}

          {generating ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-[var(--lav-l)] px-4 py-6 text-center neo-border-sm">
              <div className="flex h-14 w-14 animate-pulse-soft items-center justify-center rounded-2xl bg-[var(--lav)] text-2xl neo-border-sm">
                ✦
              </div>
              <div className="font-heading text-lg font-extrabold">
                Generating your resume...
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["Reading job description", "Analyzing profile", "Tailoring bullets", "Scoring match"].map(
                  (label) => (
                    <NeoBadge key={label} color="var(--lav-l)" className="text-[10px]">
                      {label}
                    </NeoBadge>
                  ),
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium text-[#666]">
                Choose a template. ATS Classic is selected by default.
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
                        {template.id === DEFAULT_TEMPLATE_ID ? (
                          <NeoBadge color="var(--mint)" className="text-[9px]">
                            Default
                          </NeoBadge>
                        ) : null}
                      </div>
                      <p className="text-[11px] leading-snug font-medium text-[#777]">
                        {template.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {jobPost.jobContext ? (
                <div className="rounded-xl bg-[var(--background)] px-4 py-3 text-xs font-medium text-[#666] neo-border-sm">
                  Tailoring for{" "}
                  <strong className="text-[var(--foreground)]">
                    {jobPost.jobContext.matchJob}
                  </strong>
                </div>
              ) : null}

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
      ) : null}
    </SlideOver>
  );
}
