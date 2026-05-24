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
import { generateTailoredCoverLetter } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { buildStoredCoverLetterUpdate } from "@/lib/jobs/persist-generated-content";
import { useAppProfile } from "@/lib/hooks/use-app-profile";
import { useWizardJobPost } from "@/lib/hooks/use-wizard-job-post";
import { prepareSourceMaterialInputs } from "@/lib/profile/source-material-input";
import type { GeneratedCoverLetter } from "@/components/resume/cover-letter-preview-panel";

const WIZARD_STEPS = ["Select job", "Generate"];

type NewCoverLetterWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (coverLetter: GeneratedCoverLetter) => void;
};

export function NewCoverLetterWizard({
  open,
  onClose,
  onComplete,
}: NewCoverLetterWizardProps) {
  const { updateJob } = useJobs();
  const toast = useToast();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const { profile: appProfile, loading: profileLoading } = useAppProfile();
  const jobPost = useWizardJobPost(open);

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const aiSession = open ? loadAiSession() : null;

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setStep(1);
        setGenerating(false);
        setGenerateError(null);
      });
    }
  }, [open]);

  const handleGenerate = async () => {
    const jobContext = jobPost.jobContext;
    if (!jobContext) return;

    const session = loadAiSession();
    if (!session) {
      const message = "No AI provider connected. Go to Settings and verify your API key.";
      setGenerateError(message);
      toast(message, "error");
      return;
    }

    setGenerateError(null);
    setStep(2);
    setGenerating(true);

    try {
      if (!appProfile) {
        const message = profileLoading
          ? "Loading your profile…"
          : "Complete your profile before generating a cover letter.";
        setGenerateError(message);
        toast(message, "error");
        return;
      }

      const sourceMaterials = await prepareSourceMaterialInputs(
        onboardingState?.profileSourceMaterials ?? [],
        (sourceMaterialId) => getProfileSourceDownloadUrl({ sourceMaterialId }),
      );
      const result = await generateTailoredCoverLetter({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: {
          title: jobContext.title,
          company: jobContext.company,
          description: jobContext.description,
        },
        profile: appProfile,
        resume: jobPost.selectedJob?.storedResume?.document ?? null,
        sourceMaterials,
      });

      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — Cover Letter`,
        matchJob: jobContext.matchJob,
        content: result.content,
      });

      if (jobPost.jobSource === "saved" && jobPost.selectedJobId) {
        await updateJob(jobPost.selectedJobId, buildStoredCoverLetterUpdate(result.content));
        toast("Cover letter generated and saved to job!");
      } else {
        toast("Cover letter generated!");
      }

      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate cover letter.";
      setGenerateError(message);
      setStep(1);
      toast(message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SlideOver open={open} onClose={onClose} title="New Cover Letter" width={520}>
      <div className="mb-6">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {step === 1 ? (
        <div className="animate-tab-panel flex flex-col gap-5">
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

          <WizardJobPostInput
            state={jobPost}
            accentClassName="bg-[var(--yellow-l)]"
            savedJobActiveClassName="bg-[var(--yellow-l)]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <NeoButton variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="yellow"
              size="sm"
              disabled={!jobPost.canContinue || !aiSession || generating}
              onClick={() => void handleGenerate()}
            >
              ✦ Generate Cover Letter
            </NeoButton>
          </div>
        </div>
      ) : null}

      {step === 2 && generating ? (
        <div className="animate-tab-panel flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--yellow)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Writing your cover letter...
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["Reading your profile", "Matching tone", "Drafting paragraphs", "Polishing"].map(
              (label, index) => (
                <NeoBadge
                  key={label}
                  color="var(--yellow-l)"
                  className="animate-fade-in text-[11px]"
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  {label}
                </NeoBadge>
              ),
            )}
          </div>
        </div>
      ) : null}
    </SlideOver>
  );
}
