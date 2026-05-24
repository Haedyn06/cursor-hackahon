"use client";

import { useEffect, useState } from "react";
import { WizardJobPostInput } from "@/components/jobs/wizard-job-post-input";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { generateInterviewPrepGuide } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { buildStoredInterviewPrepUpdate } from "@/lib/jobs/persist-generated-content";
import { useAppProfile } from "@/lib/hooks/use-app-profile";
import { useWizardJobPost } from "@/lib/hooks/use-wizard-job-post";
import type { GeneratedInterviewPrep } from "@/components/resume/interview-prep-preview-panel";

const WIZARD_STEPS = ["Select job", "Generate"];

type NewInterviewPrepWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (prep: GeneratedInterviewPrep) => void;
};

export function NewInterviewPrepWizard({
  open,
  onClose,
  onComplete,
}: NewInterviewPrepWizardProps) {
  const { updateJob } = useJobs();
  const toast = useToast();
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
          : "Complete your profile before generating interview prep.";
        setGenerateError(message);
        toast(message, "error");
        return;
      }

      const result = await generateInterviewPrepGuide({
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
      });

      onComplete({
        id: Date.now(),
        title: `${jobContext.company} — Interview Prep`,
        matchJob: jobContext.matchJob,
        company: jobContext.company,
        categories: result.categories,
        questions: result.questions,
      });

      if (jobPost.jobSource === "saved" && jobPost.selectedJobId) {
        await updateJob(
          jobPost.selectedJobId,
          buildStoredInterviewPrepUpdate({
            categories: result.categories,
            questions: result.questions,
          }),
        );
        toast("Interview prep generated and saved to job!");
      } else {
        toast("Interview prep generated!");
      }

      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate interview prep.";
      setGenerateError(message);
      setStep(1);
      toast(message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SlideOver open={open} onClose={onClose} title="New Interview Prep" width={520}>
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
            accentClassName="bg-[var(--lav-l)]"
            savedJobActiveClassName="bg-[var(--lav-l)]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <NeoButton variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="secondary"
              size="sm"
              disabled={!jobPost.canContinue || !aiSession || generating}
              onClick={() => void handleGenerate()}
            >
              ✦ Generate Interview Prep
            </NeoButton>
          </div>
        </div>
      ) : null}

      {step === 2 && generating ? (
        <div className="animate-tab-panel flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--lav)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Building your prep guide...
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["Analyzing role", "Behavioral questions", "Technical topics", "Company research"].map(
              (label, index) => (
                <NeoBadge
                  key={label}
                  color="var(--lav-l)"
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
