"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { AddJobForm } from "@/components/jobs/add-job-form";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDownloadFormat } from "@/components/ui/download-format-dialog";
import { cn } from "@/lib/utils";
import {
  MatchScore,
  SectionHeader,
  StatusPipeline,
} from "@/components/ui/match-score";
import { matchScorePillStyle } from "@/lib/match-score-styles";
import {
  ALL_JOB_STATUSES,
  STATUS_COLORS,
  TRACKER_STAGES,
  type JobStatus,
} from "@/lib/constants";
import { useJobs } from "@/components/providers/jobs-provider";
import { AtsResumeTemplate } from "@/components/resume/ats-resume-template";
import { generateTailoredResume, refineTailoredResume, generateTailoredCoverLetter, refineTailoredCoverLetter, generateInterviewPrepGuide, refineInterviewPrepGuide } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { getInitialProfile } from "@/lib/onboarding-storage";
import { prepareSourceMaterialInputs } from "@/lib/profile/source-material-input";
import { matchExistingResumeToJob, getResumeTabEmptyState } from "@/lib/jobs/resume-flow";
import type { JobStoredCoverLetter } from "@/lib/types/job-cover-letter";
import { hasStoredCoverLetter } from "@/lib/types/job-cover-letter";
import type { JobStoredInterviewPrep } from "@/lib/types/job-interview-prep";
import {
  countInterviewQuestions,
  hasStoredInterviewPrep,
  interviewPrepToPlainText,
} from "@/lib/types/job-interview-prep";
import type { JobStoredResume } from "@/lib/types/job-resume";
import { hasStoredResume } from "@/lib/types/job-resume";
import type { ResumeDocument } from "@/lib/resume-document";
import { exportPlainText, exportResume } from "@/lib/pdf-export";
import type { Job } from "@/lib/types/job";

function ResumeTab({ job }: { job: Job }) {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { updateJob } = useJobs();
  const { pickFormat, dialog: downloadDialog } = useDownloadFormat();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const realResumes = onboardingState?.importedResumes ?? [];
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
    hasStoredResume(job.storedResume) ? `stored-${job.id}` : null,
  );
  const [generated, setGenerated] = useState(hasStoredResume(job.storedResume));
  const [resumeDocument, setResumeDocument] = useState<ResumeDocument | null>(
    job.storedResume?.document ?? null,
  );
  const [resumeSourceLabel, setResumeSourceLabel] = useState(
    hasStoredResume(job.storedResume) ? `${job.company} — tailored resume` : "",
  );
  const [usingExistingResume, setUsingExistingResume] = useState(false);
  const [showResumeSelection, setShowResumeSelection] = useState(!hasStoredResume(job.storedResume));
  const [activeResumeTitle, setActiveResumeTitle] = useState(
    hasStoredResume(job.storedResume) ? `${job.company} — tailored resume` : "",
  );
  const [resumeMatchScore, setResumeMatchScore] = useState<number | null>(
    job.storedResume?.matchScore ?? job.matchScore,
  );
  const [resumeMatchedKeywords, setResumeMatchedKeywords] = useState<string[]>(
    job.storedResume?.matchedKeywords ?? job.matchedKeywords,
  );
  const [resumeMissingKeywords, setResumeMissingKeywords] = useState<string[]>(
    job.storedResume?.missingKeywords ?? job.missingKeywords,
  );
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasStoredResume(job.storedResume)
        ? "Your saved resume is loaded. Ask me to adjust tone, add keywords, or emphasize specific experience."
        : "Generate a resume first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasStoredResume(job.storedResume)) {
      setGenerated(true);
      setResumeDocument(job.storedResume.document);
      setResumeMatchScore(job.storedResume.matchScore);
      setResumeMatchedKeywords(job.storedResume.matchedKeywords);
      setResumeMissingKeywords(job.storedResume.missingKeywords);
      setSelectedResumeId(`stored-${job.id}`);
      setResumeSourceLabel(`${job.company} — tailored resume`);
      setActiveResumeTitle(`${job.company} — tailored resume`);
      setUsingExistingResume(false);
      setShowResumeSelection(false);
      return;
    }

    setGenerated(false);
    setResumeDocument(null);
    setResumeMatchScore(job.matchScore);
    setResumeMatchedKeywords(job.matchedKeywords);
    setResumeMissingKeywords(job.missingKeywords);
    setSelectedResumeId(null);
    setResumeSourceLabel("");
    setActiveResumeTitle("");
    setUsingExistingResume(false);
    setShowResumeSelection(true);
  }, [job.id, job.storedResume?.updatedAt, job.company, job.matchScore, job.matchedKeywords, job.missingKeywords]);

  const selectExistingResume = (resume: (typeof realResumes)[number]) => {
    const existingResume = job.storedResume?.document;
    if (!existingResume) {
      toast("Generate or save a resume first, then you can tailor it here.", "warn");
      return;
    }

    const match = matchExistingResumeToJob(existingResume, job);
    const label = resume.displayName || resume.fileName;
    setSelectedResumeId(String(resume._id));
    setResumeSourceLabel(label);
    setActiveResumeTitle(label);
    setResumeDocument(existingResume);
    setResumeMatchScore(match.matchScore);
    setResumeMatchedKeywords(match.matchedKeywords);
    setResumeMissingKeywords(match.missingKeywords);
    setGenerated(true);
    setUsingExistingResume(true);
    setShowResumeSelection(false);
    setMessages([
      {
        role: "ai",
        text: `Loaded \"${label}\" for this job. Ask me to tailor it, improve the score, or generate a brand new version instead.`,
      },
    ]);
  };

  const openResumeSelection = () => {
    setShowResumeSelection(true);
  };

  const emptyState = getResumeTabEmptyState({
    hasLibraryResumes: realResumes.length > 0,
    hasSelectedResume: !!selectedResumeId,
  });

  const shouldShowSelectionFirst = showResumeSelection || (!selectedResumeId && realResumes.length > 0);

  const selectionSummary = usingExistingResume
    ? "Selected resume"
    : hasStoredResume(job.storedResume)
      ? "Current tailored resume"
      : "Selected resume";

  const activeDocument = resumeDocument;
  const activeMatchScore = resumeMatchScore ?? 0;
  const activeMatchedKeywords = resumeMatchedKeywords;
  const activeMissingKeywords = resumeMissingKeywords;

  const persistResume = async (payload: {
    document: ResumeDocument;
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  }) => {
    const stored: JobStoredResume = {
      document: payload.document,
      matchScore: payload.matchScore,
      matchedKeywords: payload.matchedKeywords,
      missingKeywords: payload.missingKeywords,
      updatedAt: new Date().toISOString(),
    };

    await updateJob(job.id, {
      storedResume: stored,
      resumeGenerated: true,
      matchScore: payload.matchScore,
      matchedKeywords: payload.matchedKeywords,
      missingKeywords: payload.missingKeywords,
    });
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      const sourceMaterials = await prepareSourceMaterialInputs(
        onboardingState?.profileSourceMaterials ?? [],
        (sourceMaterialId) => getProfileSourceDownloadUrl({ sourceMaterialId }),
      );
      const result = await generateTailoredResume({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
        profile: getInitialProfile(),
        sourceMaterials,
      });

      setResumeDocument(result.resume);
      setResumeMatchScore(result.matchScore);
      setResumeMatchedKeywords(result.matchedKeywords);
      setResumeMissingKeywords(result.missingKeywords);
      setGenerated(true);
      setMessages([
        {
          role: "ai",
          text: "Your resume is ready and saved to this job. Ask me to adjust tone, add keywords, or emphasize specific experience.",
        },
      ]);

      await persistResume({
        document: result.resume,
        matchScore: result.matchScore,
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
      });

      toast("Resume generated and saved!");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to generate resume.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const removeResume = async () => {
    const confirmed = await confirm({
      title: "Remove saved resume?",
      message: "This removes the resume saved on this job. You can generate a new one anytime.",
      confirmLabel: "Remove resume",
    });
    if (!confirmed) return;

    try {
      await updateJob(job.id, {
        storedResume: null,
        resumeGenerated: false,
      });
      setResumeDocument(null);
      setGenerated(false);
      setMessages([
        {
          role: "ai",
          text: "Resume removed. Generate a new one when you're ready.",
        },
      ]);
      toast("Resume removed from this job.", "warn");
    } catch {
      toast("Failed to remove resume.", "error");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || streaming) return;
    if (!activeDocument) {
      toast("Generate a resume before refining.", "error");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    const msg = chatInput.trim();
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setStreaming(true);

    try {
      const result = await refineTailoredResume({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        resume: activeDocument,
        instruction: msg,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
      });

      setResumeDocument(result.resume);
      setMessages((m) => [...m, { role: "ai", text: result.reply }]);

      await persistResume({
        document: result.resume,
        matchScore: activeMatchScore,
        matchedKeywords: activeMatchedKeywords,
        missingKeywords: activeMissingKeywords,
      });
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            error instanceof Error
              ? `Couldn't apply that edit: ${error.message}`
              : "Couldn't apply that edit. Try rephrasing your request.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleDownload = async () => {
    if (!activeDocument) return;
    const format = await pickFormat(`${job.company} — ${job.title}`);
    if (!format) return;

    try {
      await exportResume(
        exportRef.current,
        activeDocument,
        `${job.company}-${job.title}`,
        format,
      );
      toast(`Downloaded resume as ${format.toUpperCase()}`);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Download failed.",
        "error",
      );
    }
  };

  if (!generated && !generating && shouldShowSelectionFirst) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 neo-border">
            <div>
              <div className="mb-1 font-heading text-[22px] font-extrabold">{emptyState.title}</div>
              <p className="max-w-[440px] text-sm font-medium text-[#666]">{emptyState.description}</p>
            </div>
            {emptyState.actionLabel && (
              <NeoButton variant="primary" size="lg" onClick={() => void generate()}>
                {emptyState.actionLabel}
              </NeoButton>
            )}
          </div>

          {realResumes.length > 0 && (
            <div className="rounded-2xl bg-white p-5 neo-border">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-lg font-extrabold">Your resumes</div>
                  <p className="text-xs font-medium text-[#777]">
                    Pick one to see match score and tailor it for this job.
                  </p>
                </div>
                <NeoButton variant="secondary" size="sm" onClick={() => void generate()}>
                  Generate New Resume
                </NeoButton>
              </div>
              <div className="flex flex-col gap-3">
                {realResumes.map((resume) => (
                  <NeoCard
                    key={String(resume._id)}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{resume.displayName || resume.fileName}</div>
                      <div className="truncate text-[11px] text-[#888]">{resume.fileName}</div>
                      <div className="text-[11px] text-[#aaa]">{resume.mimeType || "Imported resume"}</div>
                    </div>
                    <NeoButton variant="mint" size="sm" className="sm:shrink-0" onClick={() => selectExistingResume(resume)}>
                      Tailor this resume
                    </NeoButton>
                  </NeoCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--lav-l)] text-[32px] neo-border">
            📄
          </div>
          <div className="font-heading text-[22px] font-extrabold">{emptyState.title}</div>
          <p className="max-w-[300px] text-center text-sm font-medium text-[#666]">
            {emptyState.description}
          </p>
          {emptyState.actionLabel && (
            <NeoButton variant="primary" size="lg" onClick={() => void generate()}>
              {emptyState.actionLabel}
            </NeoButton>
          )}
        </div>
      </>
    );
  }

  if (generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--lav)] text-[32px] neo-border">
          ✦
        </div>
        <div className="font-heading text-[22px] font-extrabold">
          Generating your resume...
        </div>
        <div className="flex gap-1.5">
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
      </>
    );
  }

  if (!activeDocument) {
    return null;
  }

  return (
    <>
      {downloadDialog}
      {confirmDialog}
      <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto border-r-2 border-[var(--foreground)] p-6">
        <div className="mb-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 neo-border">
            <div>
              <div className="text-[11px] font-bold tracking-wide text-[#888] uppercase">
                {selectionSummary}
              </div>
              <div className="font-heading text-lg font-extrabold">{activeResumeTitle || resumeSourceLabel}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <NeoButton variant="secondary" size="sm" onClick={openResumeSelection}>
                Select another resume
              </NeoButton>
              <NeoButton variant="mint" size="sm" onClick={() => void generate()} disabled={generating}>
                Generate new one
              </NeoButton>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <MatchScore score={activeMatchScore} size="lg" />
            <div className="flex-1">
              <div className="mb-2 font-heading text-base font-extrabold">
                Keyword Match
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeMatchedKeywords.map((k) => (
                  <NeoBadge key={k} color="var(--mint)" className="text-[11px]">
                    ✓ {k}
                  </NeoBadge>
                ))}
                {activeMissingKeywords.map((k) => (
                  <NeoBadge key={k} color="var(--peach)" className="text-[11px]">
                    ✕ {k}
                  </NeoBadge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 neo-border">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="font-heading text-base font-extrabold">Tailor this resume</div>
            <NeoButton variant="secondary" size="sm" onClick={openResumeSelection}>
              Show resume library
            </NeoButton>
          </div>
          <p className="text-sm font-medium text-[#666]">
            This tab now uses your selected resume as the starting point. Refine it with AI below or generate a new tailored version.
          </p>
        </div>
        <div className="overflow-x-auto pb-4">
          <AtsResumeTemplate
            ref={exportRef}
            document={activeDocument}
            variant="screen"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <NeoButton variant="secondary" size="sm" onClick={() => void handleDownload()}>
            Download
          </NeoButton>
          <NeoButton variant="mint" size="sm" onClick={openResumeSelection}>
            Show resume library
          </NeoButton>
          <NeoButton variant="secondary" size="sm" onClick={() => void generate()} disabled={generating}>
            ↺ Regenerate
          </NeoButton>
          <NeoButton variant="danger" size="sm" onClick={() => void removeResume()}>
            Remove
          </NeoButton>
        </div>
      </div>
      <div className="flex w-[260px] flex-col bg-[var(--background)]">
        <div className="border-b-2 border-[var(--foreground)] bg-white px-4 py-3">
          <NeoBadge color="var(--lav)" className="text-xs">
            ✦ AI Refine
          </NeoBadge>
        </div>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className="max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed font-medium neo-border-sm"
              style={{
                background: m.role === "ai" ? "#ffffff" : "var(--lav)",
                alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
              }}
            >
              {m.text}
            </div>
          ))}
          {streaming && (
            <div className="rounded-xl bg-white px-3 py-2.5 text-xs neo-border-sm">
              <span className="animate-pulse-soft">✦ Writing...</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 border-t-2 border-[var(--foreground)] p-2.5">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
            placeholder="Adjust this resume..."
            className="flex-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-2 font-sans text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={streaming || !chatInput.trim()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--lav)] text-sm font-bold neo-border-sm disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

function CoverLetterTab({ job }: { job: Job }) {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { updateJob } = useJobs();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(hasStoredCoverLetter(job.storedCoverLetter));
  const [content, setContent] = useState(job.storedCoverLetter?.content ?? "");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasStoredCoverLetter(job.storedCoverLetter)
        ? "Your saved cover letter is loaded. Ask me to adjust tone, shorten it, or emphasize specific experience."
        : "Generate a cover letter first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasStoredCoverLetter(job.storedCoverLetter)) {
      setGenerated(true);
      setContent(job.storedCoverLetter.content);
      return;
    }

    setGenerated(false);
    setContent("");
  }, [job.id, job.storedCoverLetter?.updatedAt]);

  const persistCoverLetter = async (letterContent: string) => {
    const stored: JobStoredCoverLetter = {
      content: letterContent,
      updatedAt: new Date().toISOString(),
    };

    await updateJob(job.id, {
      storedCoverLetter: stored,
      coverLetterGenerated: true,
    });
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      const sourceMaterials = await prepareSourceMaterialInputs(
        onboardingState?.profileSourceMaterials ?? [],
        (sourceMaterialId) => getProfileSourceDownloadUrl({ sourceMaterialId }),
      );
      const result = await generateTailoredCoverLetter({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
        profile: getInitialProfile(),
        resume: job.storedResume?.document ?? null,
        sourceMaterials,
      });

      setContent(result.content);
      setGenerated(true);
      setMessages([
        {
          role: "ai",
          text: "Your cover letter is ready and saved to this job. Ask me to adjust tone, shorten it, or emphasize specific experience.",
        },
      ]);

      await persistCoverLetter(result.content);
      toast("Cover letter generated and saved!");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to generate cover letter.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const removeCoverLetter = async () => {
    const confirmed = await confirm({
      title: "Remove saved cover letter?",
      message: "This removes the cover letter saved on this job. You can generate a new one anytime.",
      confirmLabel: "Remove cover letter",
    });
    if (!confirmed) return;

    try {
      await updateJob(job.id, {
        storedCoverLetter: null,
        coverLetterGenerated: false,
      });
      setContent("");
      setGenerated(false);
      setMessages([
        {
          role: "ai",
          text: "Cover letter removed. Generate a new one when you're ready.",
        },
      ]);
      toast("Cover letter removed from this job.", "warn");
    } catch {
      toast("Failed to remove cover letter.", "error");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || streaming) return;
    if (!content.trim()) {
      toast("Generate a cover letter before refining.", "error");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    const msg = chatInput.trim();
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setStreaming(true);

    try {
      const result = await refineTailoredCoverLetter({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        content,
        instruction: msg,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
      });

      setContent(result.content);
      setMessages((m) => [...m, { role: "ai", text: result.reply }]);
      await persistCoverLetter(result.content);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            error instanceof Error
              ? `Couldn't apply that edit: ${error.message}`
              : "Couldn't apply that edit. Try rephrasing your request.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      toast("Copied to clipboard!");
    } catch {
      toast("Failed to copy.", "error");
    }
  };

  const handleDownload = () => {
    if (!content.trim()) return;
    exportPlainText(content, `${job.company}-${job.title}-cover-letter`);
    toast("Downloaded as TXT");
  };

  const handleBlur = () => {
    if (!generated || !content.trim()) return;
    if (content === job.storedCoverLetter?.content) return;
    void persistCoverLetter(content).catch(() => {
      toast("Failed to save edits.", "error");
    });
  };

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--peach-l)] text-[32px] neo-border">
            ✉️
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            No cover letter yet
          </div>
          <p className="max-w-[300px] text-center text-sm font-medium text-[#666]">
            Generate a tailored cover letter for this role in seconds
          </p>
          <NeoButton variant="peach" size="lg" onClick={() => void generate()}>
            ✦ Generate Cover Letter
          </NeoButton>
        </div>
      </>
    );
  }

  if (generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--peach)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Writing your cover letter...
          </div>
          <div className="flex gap-1.5">
            {["Reading profile", "Matching tone", "Drafting", "Polishing"].map(
              (s, i) => (
                <NeoBadge
                  key={s}
                  color="var(--peach-l)"
                  className="animate-fade-in text-[11px]"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {s}
                </NeoBadge>
              ),
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {confirmDialog}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r-2 border-[var(--foreground)] p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => void handleBlur()}
            className="min-h-[480px] w-full resize-y rounded-xl bg-white p-6 font-sans text-sm leading-loose outline-none neo-border"
          />
          <div className="mt-3 flex flex-wrap gap-2.5">
            <NeoButton variant="peach" size="sm" onClick={() => void handleCopy()}>
              Copy to Clipboard
            </NeoButton>
            <NeoButton variant="secondary" size="sm" onClick={handleDownload}>
              Download TXT
            </NeoButton>
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => void generate()}
              disabled={generating}
            >
              ↺ Regenerate
            </NeoButton>
            <NeoButton variant="danger" size="sm" onClick={() => void removeCoverLetter()}>
              Remove
            </NeoButton>
          </div>
        </div>
        <div className="flex w-[260px] flex-col bg-[var(--background)]">
          <div className="border-b-2 border-[var(--foreground)] bg-white px-4 py-3">
            <NeoBadge color="var(--peach)" className="text-xs">
              ✦ AI Refine
            </NeoBadge>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className="max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed font-medium neo-border-sm"
                style={{
                  background: m.role === "ai" ? "#ffffff" : "var(--peach-l)",
                  alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
                }}
              >
                {m.text}
              </div>
            ))}
            {streaming && (
              <div className="rounded-xl bg-white px-3 py-2.5 text-xs neo-border-sm">
                <span className="animate-pulse-soft">✦ Writing...</span>
              </div>
            )}
          </div>
          <div className="flex gap-1.5 border-t-2 border-[var(--foreground)] p-2.5">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
              placeholder="Adjust this letter..."
              className="flex-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-2 font-sans text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={streaming || !chatInput.trim()}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--peach-l)] text-sm font-bold neo-border-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function InterviewPrepTab({ job }: { job: Job }) {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { updateJob } = useJobs();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(hasStoredInterviewPrep(job.storedInterviewPrep));
  const [categories, setCategories] = useState(
    job.storedInterviewPrep?.categories ?? [],
  );
  const [questions, setQuestions] = useState(
    job.storedInterviewPrep?.questions ?? {},
  );
  const [activeCategory, setActiveCategory] = useState(
    job.storedInterviewPrep?.categories[0]?.id ?? "behavioral",
  );
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasStoredInterviewPrep(job.storedInterviewPrep)
        ? "Your saved prep guide is loaded. Ask me to add questions, deepen technical topics, or tailor answers to your background."
        : "Generate interview prep first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasStoredInterviewPrep(job.storedInterviewPrep)) {
      setGenerated(true);
      setCategories(job.storedInterviewPrep.categories);
      setQuestions(job.storedInterviewPrep.questions);
      setActiveCategory(job.storedInterviewPrep.categories[0]?.id ?? "behavioral");
      return;
    }

    setGenerated(false);
    setCategories([]);
    setQuestions({});
  }, [job.id, job.storedInterviewPrep?.updatedAt]);

  const prepContent = { categories, questions };
  const questionCount = countInterviewQuestions(questions);
  const activeQuestions = questions[activeCategory] ?? [];

  const persistInterviewPrep = async (content: {
    categories: typeof categories;
    questions: typeof questions;
  }) => {
    const stored: JobStoredInterviewPrep = {
      categories: content.categories,
      questions: content.questions,
      updatedAt: new Date().toISOString(),
    };

    await updateJob(job.id, {
      storedInterviewPrep: stored,
      interviewPrepGenerated: true,
    });
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateInterviewPrepGuide({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
        profile: getInitialProfile(),
        resume: job.storedResume?.document ?? null,
      });

      setCategories(result.categories);
      setQuestions(result.questions);
      setActiveCategory(result.categories[0]?.id ?? "behavioral");
      setExpanded({});
      setGenerated(true);
      setMessages([
        {
          role: "ai",
          text: "Your interview prep is ready and saved to this job. Ask me to add questions, go deeper on technical topics, or tailor answer frameworks.",
        },
      ]);

      await persistInterviewPrep(result);
      toast("Interview prep generated and saved!");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to generate interview prep.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const removeInterviewPrep = async () => {
    const confirmed = await confirm({
      title: "Remove saved interview prep?",
      message: "This removes the prep guide saved on this job. You can generate a new one anytime.",
      confirmLabel: "Remove prep guide",
    });
    if (!confirmed) return;

    try {
      await updateJob(job.id, {
        storedInterviewPrep: null,
        interviewPrepGenerated: false,
      });
      setCategories([]);
      setQuestions({});
      setGenerated(false);
      setExpanded({});
      setMessages([
        {
          role: "ai",
          text: "Interview prep removed. Generate a new guide when you're ready.",
        },
      ]);
      toast("Interview prep removed from this job.", "warn");
    } catch {
      toast("Failed to remove interview prep.", "error");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || streaming) return;
    if (!generated || questionCount === 0) {
      toast("Generate interview prep before refining.", "error");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    const msg = chatInput.trim();
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setStreaming(true);

    try {
      const result = await refineInterviewPrepGuide({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        prep: prepContent,
        instruction: msg,
        job: {
          title: job.title,
          company: job.company,
          description: job.jd.trim() || `${job.title} at ${job.company}`,
        },
      });

      setCategories(result.categories);
      setQuestions(result.questions);
      if (!result.categories.some((cat) => cat.id === activeCategory)) {
        setActiveCategory(result.categories[0]?.id ?? "behavioral");
      }
      setExpanded({});
      setMessages((m) => [...m, { role: "ai", text: result.reply }]);
      await persistInterviewPrep({
        categories: result.categories,
        questions: result.questions,
      });
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text:
            error instanceof Error
              ? `Couldn't apply that edit: ${error.message}`
              : "Couldn't apply that edit. Try rephrasing your request.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleDownload = () => {
    if (questionCount === 0) return;
    exportPlainText(
      interviewPrepToPlainText(prepContent),
      `${job.company}-${job.title}-interview-prep`,
    );
    toast("Downloaded as TXT");
  };

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--yellow-l)] text-[32px] neo-border">
            🎤
          </div>
          <div className="font-heading text-[22px] font-extrabold">No prep guide yet</div>
          <p className="max-w-[300px] text-center text-sm font-medium text-[#666]">
            Generate tailored questions and answer frameworks for this role
          </p>
          <NeoButton variant="yellow" size="lg" onClick={() => void generate()}>
            ✦ Generate Interview Prep
          </NeoButton>
        </div>
      </>
    );
  }

  if (generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-[72px] w-[72px] animate-pulse-soft items-center justify-center rounded-[20px] bg-[var(--yellow)] text-[32px] neo-border">
            ✦
          </div>
          <div className="font-heading text-[22px] font-extrabold">
            Researching the role...
          </div>
          <div className="flex gap-1.5">
            {["Analyzing JD", "Building questions", "Drafting frameworks", "Organizing"].map(
              (s, i) => (
                <NeoBadge
                  key={s}
                  color="var(--yellow-l)"
                  className="animate-fade-in text-[11px]"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {s}
                </NeoBadge>
              ),
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {confirmDialog}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden border-r-2 border-[var(--foreground)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[var(--foreground)] bg-white px-6 py-3">
            <span className="text-xs font-bold text-[#666]">
              {questionCount} question{questionCount === 1 ? "" : "s"}
            </span>
            <div className="flex flex-wrap gap-2">
              <NeoButton variant="secondary" size="sm" onClick={handleDownload}>
                Download TXT
              </NeoButton>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => void generate()}
                disabled={generating}
              >
                ↺ Regenerate
              </NeoButton>
              <NeoButton variant="danger" size="sm" onClick={() => void removeInterviewPrep()}>
                Remove
              </NeoButton>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5 border-b-2 border-[var(--foreground)] px-6 pt-4 pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setExpanded({});
                }}
                className="cursor-pointer rounded-full px-4 py-1.5 font-sans text-xs font-bold neo-border-sm"
                style={{
                  background:
                    activeCategory === cat.id ? "var(--yellow)" : "transparent",
                  border:
                    activeCategory === cat.id
                      ? "2px solid var(--foreground)"
                      : "2px solid transparent",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
            {activeQuestions.length === 0 ? (
              <p className="text-sm font-medium text-[#888]">
                No questions in this category yet. Ask AI Refine to add some.
              </p>
            ) : (
              activeQuestions.map((item, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white neo-border">
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <span className="shrink-0 text-[#888]">{expanded[i] ? "▲" : "▼"}</span>
                  </button>
                  {expanded[i] && (
                    <div className="border-t-2 border-[var(--foreground)] px-5 pt-3 pb-4">
                      <NeoBadge color="var(--yellow)" className="mb-2 text-[11px]">
                        Answer framework
                      </NeoBadge>
                      <p className="text-[13px] leading-relaxed font-medium text-[#444]">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex w-[260px] flex-col bg-[var(--background)]">
          <div className="border-b-2 border-[var(--foreground)] bg-white px-4 py-3">
            <NeoBadge color="var(--yellow)" className="text-xs">
              ✦ AI Refine
            </NeoBadge>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className="max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed font-medium neo-border-sm"
                style={{
                  background: m.role === "ai" ? "#ffffff" : "var(--yellow-l)",
                  alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
                }}
              >
                {m.text}
              </div>
            ))}
            {streaming && (
              <div className="rounded-xl bg-white px-3 py-2.5 text-xs neo-border-sm">
                <span className="animate-pulse-soft">✦ Thinking...</span>
              </div>
            )}
          </div>
          <div className="flex gap-1.5 border-t-2 border-[var(--foreground)] p-2.5">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
              placeholder="Refine this prep..."
              className="flex-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-2 font-sans text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={streaming || !chatInput.trim()}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--yellow-l)] text-sm font-bold neo-border-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function JobDetailPanel({
  job,
  onStatusChange,
  onDelete,
}: {
  job: Job | undefined;
  onStatusChange: (id: string, status: JobStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("info");

  if (!job) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-white text-4xl neo-border">
          📋
        </div>
        <div className="font-heading text-[22px] font-extrabold">Select a job</div>
        <p className="text-sm font-medium text-[#888]">
          Click a job in the list to view details
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "info", label: "Job Info", icon: "ℹ️" },
    { id: "resume", label: "Resume", icon: "📄" },
    { id: "cover", label: "Cover Letter", icon: "✉️" },
    { id: "interview", label: "Interview Prep", icon: "🎤" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="shrink-0 border-b-[2.5px] border-[var(--foreground)] bg-white px-7 pt-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 font-heading text-[28px] font-extrabold tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-[#555]">
              <strong className="text-[var(--foreground)]">{job.company}</strong>
              <span>—</span>
              <span>{job.location}</span>
              <span className="text-[#bbb]">·</span>
              <span>Added {job.dateAdded}</span>
              {job.source && (
                <NeoBadge color="#ffffff" className="text-[11px]">
                  via {job.source}
                </NeoBadge>
              )}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  ↗ View posting
                </a>
              )}
              {job.matchScore !== null && job.matchScore !== undefined && (
                <MatchScore score={job.matchScore} size="sm" />
              )}
            </div>
          </div>
          <NeoButton
            variant="danger"
            size="sm"
            className="shrink-0 px-3 py-1.5 text-xs"
            onClick={() => onDelete(job.id)}
          >
            Remove
          </NeoButton>
        </div>
        <div className="mb-4">
          <StatusPipeline
            currentStatus={job.status}
            onStatusChange={(s) => onStatusChange(job.id, s)}
          />
        </div>
        <NeoTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div
        key={`${job.id}-${activeTab}`}
        className="animate-tab-panel flex flex-1 flex-col overflow-hidden bg-[var(--background)]"
      >
        {activeTab === "info" && (
          <div key={job.id} className="flex flex-1 gap-6 overflow-y-auto p-7">
            <div className="flex-1">
              <SectionHeader label="Job Description" color="var(--mint)" />
              <div className="rounded-xl bg-white p-5 text-sm leading-[1.75] font-medium whitespace-pre-line neo-border">
                {job.jd || "No job description provided."}
              </div>
            </div>
            <div className="w-[260px] shrink-0">
              <SectionHeader label="Resume Match" color="var(--lav)" />
              <NeoCard className="p-4">
                {hasStoredResume(job.storedResume) ? (
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 text-[11px] font-bold text-[#888]">START WITH</div>
                      <div className="text-sm font-bold text-[var(--foreground)]">
                        Your saved resume
                      </div>
                      <p className="mt-1 text-xs text-[#777]">
                        Select Resume to view the match score, tailor it with AI, or generate a new version.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <NeoButton
                        variant="mint"
                        size="sm"
                        onClick={() => setActiveTab("resume")}
                      >
                        Select Resume
                      </NeoButton>
                      <NeoButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab("resume")}
                      >
                        Show Tailored Resume
                      </NeoButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-xs text-[#888]">
                      Select a resume first, then Rezume will show the match score and keyword coverage here.
                    </p>
                    <NeoButton variant="secondary" size="sm" onClick={() => setActiveTab("resume")}>
                      Open Resume Tab
                    </NeoButton>
                  </div>
                )}
              </NeoCard>
            </div>
          </div>
        )}
        {activeTab === "resume" && <ResumeTab key={job.id} job={job} />}
        {activeTab === "cover" && <CoverLetterTab key={job.id} job={job} />}
        {activeTab === "interview" && <InterviewPrepTab key={job.id} job={job} />}
      </div>
    </div>
  );
}

function ExcitementStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Excitement ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="text-[11px] leading-none"
          style={{ color: n <= value ? "#f0a500" : "#dddddd" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const KANBAN_COLUMNS: { status: JobStatus; label: string; hint: string }[] = [
  ...TRACKER_STAGES.map((stage) => ({
    status: stage.key as JobStatus,
    label: stage.label,
    hint:
      stage.key === "Saved"
        ? "Bookmarked roles"
        : stage.key === "Applying"
          ? "Drafting materials"
          : stage.key === "Applied"
            ? "Waiting to hear back"
            : stage.key === "Interview"
              ? "Active conversations"
              : stage.key === "Offer"
                ? "Reviewing terms"
                : "Role secured",
  })),
  { status: "Rejected", label: "REJECTED", hint: "Closed out" },
];

function KanbanJobCard({
  job,
  onOpen,
  onStatusChange,
}: {
  job: Job;
  onOpen: () => void;
  onStatusChange: (status: JobStatus) => void;
}) {
  const scoreStyle =
    job.matchScore !== null ? matchScorePillStyle(job.matchScore) : null;
  const accent = STATUS_COLORS[job.status] ?? "var(--mint)";

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-xl bg-white p-3.5 neo-border-sm transition-[transform,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:bg-[var(--mint-l)] hover:shadow-[3px_3px_0_#1a1a1a]"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <div className="mb-2.5 flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-extrabold neo-border-sm"
          style={{ background: `${accent}88` }}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[13px] font-extrabold leading-snug">
            {job.title}
          </h3>
          <p className="truncate text-xs font-medium text-[#666]">{job.company}</p>
        </div>
        {scoreStyle && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold neo-border-sm"
            style={scoreStyle}
          >
            {job.matchScore}%
          </span>
        )}
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {job.location ? (
          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[#666]">
            <span aria-hidden>📍</span>
            <span className="truncate">{job.location}</span>
          </span>
        ) : null}
        {job.salary && job.salary !== "$0" ? (
          <span className="inline-flex items-center rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[#666]">
            {job.salary}
          </span>
        ) : null}
        {job.resumeGenerated && hasStoredResume(job.storedResume) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--lav-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            📄 Resume
          </span>
        ) : null}
        {job.coverLetterGenerated && hasStoredCoverLetter(job.storedCoverLetter) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--peach-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            ✉️ Letter
          </span>
        ) : null}
        {job.interviewPrepGenerated && hasStoredInterviewPrep(job.storedInterviewPrep) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--yellow-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            🎤 Prep
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#ececec] pt-2.5">
        <ExcitementStars value={job.excitement} />
        <span className="text-[10px] font-medium text-[#aaa]">{job.dateAdded}</span>
      </div>

      <div
        className="mt-2.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <label className="mb-1 block text-[10px] font-bold tracking-wide text-[#888]">
          MOVE TO
        </label>
        <select
          value={job.status}
          onChange={(e) => onStatusChange(e.target.value as JobStatus)}
          className="w-full cursor-pointer rounded-lg border-2 border-[var(--foreground)] bg-white px-2 py-1.5 font-sans text-[11px] font-bold outline-none"
          style={{ background: STATUS_COLORS[job.status] ?? "#ffffff" }}
        >
          {ALL_JOB_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

function KanbanView({
  jobs,
  search,
  onSearchChange,
  onViewModeChange,
  onAddJob,
  onJobClick,
  onStatusChange,
}: {
  jobs: Job[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewModeChange: () => void;
  onAddJob: () => void;
  onJobClick: (id: string) => void;
  onStatusChange: (id: string, status: JobStatus) => void;
}) {
  const activeCount = jobs.filter((job) => job.status !== "Rejected").length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b-[2.5px] border-[var(--foreground)] bg-white px-6 py-4">
        <div>
          <h2 className="font-heading text-lg font-extrabold">Pipeline board</h2>
          <p className="text-xs font-medium text-[#666]">
            {jobs.length} job{jobs.length === 1 ? "" : "s"} · {activeCount} active
          </p>
        </div>

        <div className="flex-1" />

        <NeoInput
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          }
          className="w-[220px] text-[13px]"
        />

        <div className="flex overflow-hidden rounded-full neo-border-sm">
          <button
            type="button"
            className="cursor-default border-none px-4 py-2 font-sans text-[11px] font-bold"
            style={{ background: "var(--foreground)", color: "#ffffff" }}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={onViewModeChange}
            className="cursor-pointer border-none bg-white px-4 py-2 font-sans text-[11px] font-bold text-[var(--foreground)] transition-[background] duration-150 hover:bg-[var(--mint-l)]"
          >
            Detail
          </button>
        </div>

        <NeoButton variant="mint" size="sm" onClick={onAddJob}>
          + Add Job
        </NeoButton>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {KANBAN_COLUMNS.map((column) => {
          const colJobs = jobs.filter((job) => job.status === column.status);
          const color = STATUS_COLORS[column.status] ?? "#ffffff";
          const isRejected = column.status === "Rejected";

          return (
            <section
              key={column.status}
              className={cn(
                "flex w-[min(100%,300px)] shrink-0 flex-col rounded-2xl neo-border",
                isRejected && "opacity-90",
              )}
              style={{ background: `${color}22` }}
            >
              <header
                className="shrink-0 rounded-t-[14px] border-b-2 border-[var(--foreground)] px-4 py-3"
                style={{ background: color }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading text-xs font-extrabold tracking-[0.08em]">
                      {column.label}
                    </h3>
                    <p className="truncate text-[10px] font-medium text-[#444]">
                      {column.hint}
                    </p>
                  </div>
                  <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-white px-2 font-heading text-sm font-extrabold neo-border-sm">
                    {colJobs.length}
                  </span>
                </div>
              </header>

              <div className="flex min-h-[320px] flex-1 flex-col gap-2.5 overflow-y-auto p-3">
                {colJobs.map((job) => (
                  <KanbanJobCard
                    key={job.id}
                    job={job}
                    onOpen={() => onJobClick(job.id)}
                    onStatusChange={(status) => onStatusChange(job.id, status)}
                  />
                ))}

                {colJobs.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cccccc] bg-white/70 px-4 py-8 text-center">
                    <div className="mb-2 text-2xl opacity-40">📋</div>
                    <p className="text-xs font-bold text-[#888]">No jobs here</p>
                    <p className="mt-1 text-[10px] font-medium text-[#aaa]">
                      Move a card into this stage
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function JobTrackerView() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { jobs, loading, updateJobStatus, deleteJob } = useJobs();
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [showAddJob, setShowAddJob] = useState(false);
  const [viewMode, setViewMode] = useState<"detail" | "kanban">("detail");

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedJob = jobs.find((j) => j.id === selectedId) ?? filtered[0];
  const activeJobId = selectedId || filtered[0]?.id;

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      await updateJobStatus(id, status);
    } catch {
      toast("Failed to update status.", "error");
    }
  };

  const handleDeleteJob = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    const confirmed = await confirm({
      title: "Remove job?",
      message: `Remove "${job?.title ?? "this job"}" at ${job?.company ?? "this company"}? This can't be undone.`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;

    try {
      await deleteJob(id);
      if (selectedId === id) {
        const remaining = filtered.filter((j) => j.id !== id);
        setSelectedId(remaining[0]?.id ?? "");
      }
      toast("Job removed.");
    } catch {
      toast("Failed to remove job.", "error");
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm font-semibold text-[#888]">
        Loading jobs…
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {dialog}

      {viewMode === "detail" && (
      <div className="flex w-[280px] shrink-0 flex-col border-r-[2.5px] border-[var(--foreground)] bg-white">
        <div className="border-b-[2.5px] border-[var(--foreground)] px-4 pt-4 pb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-heading text-base font-extrabold">Your Jobs</span>
            <NeoButton
              variant="mint"
              size="sm"
              className="px-3.5 py-1.5 text-xs"
              onClick={() => setShowAddJob(true)}
            >
              + Add
            </NeoButton>
          </div>
          <div className="mb-2.5 overflow-hidden rounded-full neo-border-sm">
            <div className="flex">
              {(
                [
                  ["detail", "Detail"],
                  ["kanban", "Kanban"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setViewMode(value)}
                  className="flex-1 cursor-pointer border-none py-1.5 font-sans text-[11px] font-bold transition-[background,color] duration-150 ease-in-out"
                  style={{
                    background:
                      viewMode === value ? "var(--foreground)" : "#ffffff",
                    color: viewMode === value ? "#ffffff" : "var(--foreground)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <NeoInput
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
            className="text-[13px]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState
              title="No jobs yet"
              description="Add your first job to get started"
            />
          ) : (
            filtered.map((job) => {
              const isSelected = job.id === activeJobId;
              const scoreStyle =
                job.matchScore !== null
                  ? matchScorePillStyle(job.matchScore)
                  : null;

              return (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedId(job.id);
                    setViewMode("detail");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedId(job.id);
                      setViewMode("detail");
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-b-2 border-[var(--foreground)] px-4 py-3.5 transition-[background] duration-150 ease-in-out",
                    !isSelected && "hover:bg-[var(--mint-l)]",
                  )}
                  style={{
                    background: isSelected ? "var(--mint-l)" : "transparent",
                    borderLeft: isSelected
                      ? "4px solid var(--foreground)"
                      : "4px solid transparent",
                  }}
                >
                  <div className="mb-0.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 text-sm font-bold text-[var(--foreground)]">
                      {job.title}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${job.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteJob(job.id);
                      }}
                      className="shrink-0 cursor-pointer rounded-md border-2 border-transparent bg-transparent px-1.5 py-0.5 text-xs font-bold text-[#888] transition-[background,color,border-color] duration-150 hover:border-[var(--foreground)] hover:bg-[var(--peach)] hover:text-[var(--foreground)]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-2 text-xs font-medium text-[#666]">
                    {job.company}
                  </div>
                  <div className="flex items-center justify-between">
                    <NeoBadge
                      color={STATUS_COLORS[job.status] ?? "var(--yellow)"}
                      className="px-2 py-0.5 text-[11px]"
                    >
                      {job.status}
                    </NeoBadge>
                    {scoreStyle && job.matchScore !== null && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-extrabold neo-border-sm"
                        style={scoreStyle}
                      >
                        {job.matchScore}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {viewMode === "detail" ? (
        <JobDetailPanel
          job={selectedJob}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onDelete={(id) => void handleDeleteJob(id)}
        />
      ) : (
        <KanbanView
          jobs={filtered}
          search={search}
          onSearchChange={setSearch}
          onViewModeChange={() => setViewMode("detail")}
          onAddJob={() => setShowAddJob(true)}
          onJobClick={(id) => {
            setSelectedId(id);
            setViewMode("detail");
          }}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
        />
      )}

      <AddJobForm
        open={showAddJob}
        onClose={() => setShowAddJob(false)}
        onCreated={(job) => setSelectedId(job.id)}
      />
    </div>
  );
}
