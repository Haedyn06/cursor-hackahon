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
import { useResumeBuilderLibrary } from "@/components/providers/resume-builder-library-provider";
import { AtsResumeTemplate } from "@/components/resume/ats-resume-template";
import { generateTailoredResume, refineTailoredResume, generateTailoredCoverLetter, refineTailoredCoverLetter, generateInterviewPrepGuide, refineInterviewPrepGuide } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { useAppProfile } from "@/lib/hooks/use-app-profile";
import { prepareSourceMaterialInputs } from "@/lib/profile/source-material-input";
import { jobToAiContext } from "@/lib/jobs/job-context";
import { loadImportedResumeDocument } from "@/lib/resumes/load-imported-resume";
import {
  AUTO_TAILOR_INSTRUCTION,
  computeResumeMatchForDescription,
  getResumeTabEmptyState,
  matchExistingResumeToJob,
} from "@/lib/jobs/resume-flow";
import {
  buildCoverLetterUpdate,
  buildInterviewPrepUpdate,
  buildResumeUpdate,
} from "@/lib/jobs/persist-generated-content";
import { ImportResumePanel } from "@/components/resumes/import-resume-panel";
import { hasCoverLetter } from "@/lib/types/job-cover-letter";
import type { JobInterviewPrep } from "@/lib/types/job-interview-prep";
import {
  countInterviewQuestions,
  hasInterviewPrep,
  interviewPrepToPlainText,
} from "@/lib/types/job-interview-prep";
import { hasResume } from "@/lib/types/job-resume";
import type { ResumeDocument } from "@/lib/resume-document";
import { exportPlainText, exportResume, exportTextDocument } from "@/lib/pdf-export";
import { jobSearchText } from "@/lib/jobs/normalize-job";
import {
  buildLibraryCoverLetterFromJob,
  buildLibraryInterviewPrepFromJob,
  buildLibraryResumeFromJob,
} from "@/lib/jobs/sync-to-builder-library";
import type { Job } from "@/lib/types/job";

function visibleKeywordSlice(keywords: string[], limit = 12) {
  if (keywords.length <= limit) {
    return { items: keywords, extra: 0 };
  }
  return { items: keywords.slice(0, limit), extra: keywords.length - limit };
}

function ResumeTab({ job }: { job: Job }) {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { updateJob } = useJobs();
  const { saveGeneratedResume: saveToBuilderLibrary } = useResumeBuilderLibrary();
  const { requestDownload, dialog: downloadDialog } = useDownloadFormat();
  const { profile: appProfile, loading: profileLoading } = useAppProfile();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const getResumeDownloadUrl = useMutation(api.onboarding.getResumeDownloadUrl);
  const exportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingResumeId, setLoadingResumeId] = useState<string | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [libraryMatchScores, setLibraryMatchScores] = useState<
    Record<
      string,
      {
        matchScore: number;
        matchedKeywords: string[];
        missingKeywords: string[];
      }
    >
  >({});
  const [importPreviewMode, setImportPreviewMode] = useState(false);
  const realResumes = onboardingState?.importedResumes ?? [];
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
    hasResume(job.resume) ? `stored-${job.id}` : null,
  );
  const [generated, setGenerated] = useState(hasResume(job.resume));
  const [resumeDocument, setResumeDocument] = useState<ResumeDocument | null>(
    job.resume?.document ?? null,
  );
  const [resumeSourceLabel, setResumeSourceLabel] = useState(
    hasResume(job.resume) ? `${job.company} — tailored resume` : "",
  );
  const [usingExistingResume, setUsingExistingResume] = useState(false);
  const [showResumeSelection, setShowResumeSelection] = useState(!hasResume(job.resume));
  const [activeResumeTitle, setActiveResumeTitle] = useState(
    hasResume(job.resume) ? `${job.company} — tailored resume` : "",
  );
  const [resumeMatchScore, setResumeMatchScore] = useState<number | null>(
    job.resume?.matchScore ?? job.matchScore,
  );
  const [resumeMatchedKeywords, setResumeMatchedKeywords] = useState<string[]>(
    job.resume?.matchedKeywords ?? [],
  );
  const [resumeMissingKeywords, setResumeMissingKeywords] = useState<string[]>(
    job.resume?.missingKeywords ?? [],
  );
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasResume(job.resume)
        ? "Your saved resume is loaded. Ask me to adjust tone, add keywords, or emphasize specific experience."
        : "Generate a resume first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasResume(job.resume)) {
      setGenerated(true);
      setResumeDocument(job.resume.document);
      setResumeMatchScore(job.resume.matchScore);
      setResumeMatchedKeywords(job.resume.matchedKeywords);
      setResumeMissingKeywords(job.resume.missingKeywords);
      setSelectedResumeId(`stored-${job.id}`);
      setResumeSourceLabel(`${job.company} — tailored resume`);
      setActiveResumeTitle(`${job.company} — tailored resume`);
      setUsingExistingResume(false);
      setImportPreviewMode(false);
      setShowResumeSelection(false);
      return;
    }

    setGenerated(false);
    setResumeDocument(null);
    setResumeMatchScore(job.matchScore);
    setResumeMatchedKeywords([]);
    setResumeMissingKeywords([]);
    setSelectedResumeId(null);
    setResumeSourceLabel("");
    setActiveResumeTitle("");
    setUsingExistingResume(false);
    setImportPreviewMode(false);
    setShowResumeSelection(true);
  }, [job.id, job.resume?.updatedAt, job.company, job.matchScore]);

  const loadLibraryResume = async (
    resume: (typeof realResumes)[number],
    mode: "score" | "tailor",
  ) => {
    if (!resume.storageId) {
      toast("This resume has no file attached.", "error");
      return;
    }

    const resumeId = String(resume._id);
    setLoadingResumeId(resumeId);
    try {
      const downloadUrl = await getResumeDownloadUrl({
        storageId: resume.storageId,
      });
      if (!downloadUrl) {
        throw new Error("Could not download resume file.");
      }

      const parsed = await loadImportedResumeDocument({
        downloadUrl,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
      });

      const document = parsed.document;
      const match = matchExistingResumeToJob(document, job);
      const label = resume.displayName || resume.fileName;

      if (mode === "score") {
        setLibraryMatchScores((current) => ({
          ...current,
          [resumeId]: {
            matchScore: match.matchScore,
            matchedKeywords: match.matchedKeywords,
            missingKeywords: match.missingKeywords,
          },
        }));
        toast(`${label}: ${match.matchScore}% match (unmodified)`);
        return;
      }

      setSelectedResumeId(resumeId);
      setResumeSourceLabel(label);
      setActiveResumeTitle(label);
      setResumeDocument(document);
      setResumeMatchScore(match.matchScore);
      setResumeMatchedKeywords(match.matchedKeywords);
      setResumeMissingKeywords(match.missingKeywords);
      setGenerated(true);
      setUsingExistingResume(true);
      setImportPreviewMode(true);
      setShowResumeSelection(false);
      setMessages([
        {
          role: "ai",
          text: `Showing your unmodified "${label}" (${match.matchScore}% match). Use "Improve resume with AI" below when you're ready, or tell me what to change in this chat.`,
        },
      ]);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not load resume.",
        "error",
      );
    } finally {
      setLoadingResumeId(null);
    }
  };

  const autoTailorResume = async () => {
    if (!resumeDocument) {
      toast("Select a resume from your library first.", "warn");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setTailoring(true);
    setMessages((current) => [
      ...current,
      {
        role: "ai",
        text: "Tailoring your resume for this job — keeping your original content as the base…",
      },
    ]);

    try {
      const result = await refineTailoredResume({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        resume: resumeDocument,
        instruction: AUTO_TAILOR_INSTRUCTION,
        job: jobToAiContext(job),
        profile: appProfile ?? undefined,
      });

      const match = computeResumeMatchForDescription(result.resume, jobToAiContext(job));

      setResumeDocument(result.resume);
      setResumeMatchScore(match.matchScore);
      setResumeMatchedKeywords(match.matchedKeywords);
      setResumeMissingKeywords(match.missingKeywords);
      setUsingExistingResume(false);
      setImportPreviewMode(false);
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "ai",
          text: `${result.reply} Match score is now ${match.matchScore}%.`,
        },
      ]);

      await persistResume({
        document: result.resume,
        matchScore: match.matchScore,
        matchedKeywords: match.matchedKeywords,
        missingKeywords: match.missingKeywords,
      });

      toast(`Resume tailored — ${match.matchScore}% match`);
    } catch (error) {
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          role: "ai",
          text:
            error instanceof Error
              ? `Couldn't tailor the resume: ${error.message}`
              : "Couldn't tailor the resume. Try again or refine manually below.",
        },
      ]);
      toast(
        error instanceof Error ? error.message : "Failed to tailor resume.",
        "error",
      );
    } finally {
      setTailoring(false);
    }
  };

  const openResumeSelection = () => {
    setShowResumeSelection(true);
    setImportPreviewMode(false);
  };

  const emptyState = getResumeTabEmptyState({
    hasLibraryResumes: realResumes.length > 0,
    hasSelectedResume: !!selectedResumeId,
  });

  const shouldShowSelectionFirst =
    showResumeSelection || (!selectedResumeId && realResumes.length > 0);

  const selectionSummary = importPreviewMode
    ? "Imported resume (unmodified)"
    : usingExistingResume
      ? "Selected resume"
      : hasResume(job.resume)
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
    await updateJob(job.id, buildResumeUpdate(payload));
    saveToBuilderLibrary(buildLibraryResumeFromJob(job, payload));
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      if (!appProfile) {
        toast(
          profileLoading ? "Loading your profile…" : "Complete your profile first.",
          "error",
        );
        return;
      }

      const sourceMaterials = await prepareSourceMaterialInputs(
        onboardingState?.profileSourceMaterials ?? [],
        (sourceMaterialId) => getProfileSourceDownloadUrl({ sourceMaterialId }),
      );
      const result = await generateTailoredResume({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: jobToAiContext(job),
        profile: appProfile,
        sourceMaterials,
      });

      setResumeDocument(result.resume);
      setResumeMatchScore(result.matchScore);
      setResumeMatchedKeywords(result.matchedKeywords);
      setResumeMissingKeywords(result.missingKeywords);
      setGenerated(true);
      setImportPreviewMode(false);
      setUsingExistingResume(false);
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
        resume: null,
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
        resume: resumeDocument,
        instruction: msg,
        job: jobToAiContext(job),
        profile: appProfile ?? undefined,
      });

      setResumeDocument(result.resume);
      setMessages((m) => [...m, { role: "ai", text: result.reply }]);

      const match = computeResumeMatchForDescription(result.resume, jobToAiContext(job));

      setResumeMatchScore(match.matchScore);
      setResumeMatchedKeywords(match.matchedKeywords);
      setResumeMissingKeywords(match.missingKeywords);

      setImportPreviewMode(false);
      setUsingExistingResume(false);

      await persistResume({
        document: result.resume,
        matchScore: match.matchScore,
        matchedKeywords: match.matchedKeywords,
        missingKeywords: match.missingKeywords,
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
    if (!activeDocument) return;
    requestDownload(
      `${job.company} — ${job.position}`,
      async (format) => {
        await exportResume(
          exportRef.current,
          activeDocument,
          `${job.company}-${job.position}`,
          format,
        );
        toast(`Downloaded resume as ${format.toUpperCase()}`);
      },
    );
  };

  if (!generated && !generating && shouldShowSelectionFirst) {
    return (
      <>
        {confirmDialog}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 pb-10">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 neo-border">
            <div>
              <div className="mb-1 font-heading text-[22px] font-extrabold">{emptyState.title}</div>
              <p className="max-w-[440px] text-sm font-medium text-[#666]">{emptyState.description}</p>
            </div>
            {emptyState.actionLabel ? (
              <NeoButton
                variant="primary"
                size="lg"
                disabled={generating}
                onClick={() => void generate()}
              >
                {generating ? "Generating…" : emptyState.actionLabel}
              </NeoButton>
            ) : null}
          </div>

          {realResumes.length > 0 ? (
            <div className="rounded-2xl bg-white p-5 neo-border">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading text-lg font-extrabold">Your resume library</div>
                  <p className="text-xs font-medium text-[#777]">
                    Check match score on the original file, or open tailor preview to improve it with AI.
                  </p>
                </div>
                <NeoButton variant="secondary" size="sm" onClick={() => void generate()}>
                  Generate from profile
                </NeoButton>
              </div>
              <div className="flex flex-col gap-3">
                {realResumes.map((resume) => {
                  const resumeId = String(resume._id);
                  const scoreResult = libraryMatchScores[resumeId];
                  const isLoading = loadingResumeId === resumeId;

                  return (
                    <NeoCard key={resumeId} className="flex flex-col gap-3 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">
                            {resume.displayName || resume.fileName}
                          </div>
                          <div className="truncate text-[11px] text-[#888]">
                            {resume.fileName}
                          </div>
                          <div className="text-[11px] text-[#aaa]">
                            {resume.mimeType || "Imported resume"}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <NeoButton
                            variant="secondary"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => void loadLibraryResume(resume, "score")}
                          >
                            {isLoading ? "Loading…" : "Check match score"}
                          </NeoButton>
                          <NeoButton
                            variant="mint"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => void loadLibraryResume(resume, "tailor")}
                          >
                            Tailor resume
                          </NeoButton>
                        </div>
                      </div>

                      {scoreResult ? (
                        <div className="rounded-xl border-2 border-[var(--foreground)] bg-[var(--background)] p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <MatchScore score={scoreResult.matchScore} size="sm" />
                            <span className="text-xs font-bold text-[#666]">
                              Unmodified match for this job
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const matched = visibleKeywordSlice(scoreResult.matchedKeywords);
                              const missing = visibleKeywordSlice(scoreResult.missingKeywords);
                              return (
                                <>
                                  {matched.items.map((keyword) => (
                                    <NeoBadge
                                      key={`m-${keyword}`}
                                      color="var(--mint)"
                                      className="text-[10px]"
                                    >
                                      ✓ {keyword}
                                    </NeoBadge>
                                  ))}
                                  {matched.extra > 0 ? (
                                    <NeoBadge color="var(--mint-l)" className="text-[10px]">
                                      +{matched.extra} matched
                                    </NeoBadge>
                                  ) : null}
                                  {missing.items.map((keyword) => (
                                    <NeoBadge
                                      key={`x-${keyword}`}
                                      color="var(--peach)"
                                      className="text-[10px]"
                                    >
                                      ✕ {keyword}
                                    </NeoBadge>
                                  ))}
                                  {missing.extra > 0 ? (
                                    <NeoBadge color="var(--peach-l)" className="text-[10px]">
                                      +{missing.extra} missing
                                    </NeoBadge>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ) : null}
                    </NeoCard>
                  );
                })}
              </div>
            </div>
          ) : (
            <ImportResumePanel compact />
          )}
        </div>
      </>
    );
  }

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto border-r-2 border-[var(--foreground)] p-6">
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
                Back to library
              </NeoButton>
              <NeoButton
                variant="mint"
                size="sm"
                onClick={() => void generate()}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate from profile"}
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

        {importPreviewMode ? (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-[var(--foreground)] bg-[var(--mint-l)] p-4">
            <p className="text-sm font-medium text-[#555]">
              Previewing your original resume — nothing has been changed yet. Improve it with AI below or ask the chat what to update.
            </p>
          </div>
        ) : null}

        <div className="overflow-x-auto pb-4">
          <AtsResumeTemplate
            ref={exportRef}
            document={activeDocument}
            variant="screen"
          />
        </div>

        {importPreviewMode ? (
          <div className="mb-4 rounded-2xl bg-white p-4 neo-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-heading text-base font-extrabold">Ready to tailor?</div>
                <p className="text-sm font-medium text-[#666]">
                  Improve the whole resume with AI (~80% your file, ~20% profile), or refine section-by-section in the chat.
                </p>
              </div>
              <NeoButton
                variant="mint"
                size="sm"
                disabled={tailoring || streaming}
                onClick={() => void autoTailorResume()}
              >
                {tailoring ? "Improving…" : "✦ Improve resume with AI"}
              </NeoButton>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <NeoButton variant="secondary" size="sm" onClick={() => void handleDownload()}>
            Download
          </NeoButton>
          <NeoButton variant="secondary" size="sm" onClick={openResumeSelection}>
            Back to library
          </NeoButton>
          {!importPreviewMode ? (
            <NeoButton variant="secondary" size="sm" onClick={() => void generate()} disabled={generating}>
              {generating ? "Generating…" : "Generate from profile"}
            </NeoButton>
          ) : (
            <NeoButton variant="mint" size="sm" onClick={() => void generate()} disabled={generating}>
              {generating ? "Generating…" : "Generate from profile"}
            </NeoButton>
          )}
          {hasResume(job.resume) && !importPreviewMode ? (
            <NeoButton variant="danger" size="sm" onClick={() => void removeResume()}>
              Remove
            </NeoButton>
          ) : null}
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
  const { saveGeneratedCoverLetter: saveToBuilderLibrary } = useResumeBuilderLibrary();
  const { requestDownload, dialog: downloadDialog } = useDownloadFormat();
  const { profile: appProfile, loading: profileLoading } = useAppProfile();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const getProfileSourceDownloadUrl = useMutation(
    api.onboarding.getProfileSourceDownloadUrl,
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(hasCoverLetter(job.coverLetter));
  const [content, setContent] = useState(job.coverLetter?.content ?? "");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasCoverLetter(job.coverLetter)
        ? "Your saved cover letter is loaded. Ask me to adjust tone, shorten it, or emphasize specific experience."
        : "Generate a cover letter first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasCoverLetter(job.coverLetter)) {
      setGenerated(true);
      setContent(job.coverLetter.content);
      return;
    }

    setGenerated(false);
    setContent("");
  }, [job.id, job.coverLetter?.updatedAt]);

  const persistCoverLetter = async (letterContent: string) => {
    await updateJob(job.id, buildCoverLetterUpdate(letterContent));
    saveToBuilderLibrary(buildLibraryCoverLetterFromJob(job, letterContent));
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      if (!appProfile) {
        toast(
          profileLoading ? "Loading your profile…" : "Complete your profile first.",
          "error",
        );
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
        job: jobToAiContext(job),
        profile: appProfile,
        resume: job.resume?.document ?? null,
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
        coverLetter: null,
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
        job: jobToAiContext(job),
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
    requestDownload(`${job.company} — cover letter`, async (format) => {
      await exportTextDocument(
        content,
        `${job.company}-${job.position}-cover-letter`,
        format,
      );
      toast(`Downloaded cover letter as ${format.toUpperCase()}`);
    });
  };

  const handleBlur = () => {
    if (!generated || !content.trim()) return;
    if (content === job.coverLetter?.content) return;
    void persistCoverLetter(content).catch(() => {
      toast("Failed to save edits.", "error");
    });
  };

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
      {downloadDialog}
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto border-r-2 border-[var(--foreground)] p-6">
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
  const { saveGeneratedInterviewPrep: saveToBuilderLibrary } = useResumeBuilderLibrary();
  const { profile: appProfile, loading: profileLoading } = useAppProfile();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(hasInterviewPrep(job.interviewPrep));
  const [categories, setCategories] = useState(
    job.interviewPrep?.categories ?? [],
  );
  const [questions, setQuestions] = useState(
    job.interviewPrep?.questions ?? {},
  );
  const [activeCategory, setActiveCategory] = useState(
    job.interviewPrep?.categories[0]?.id ?? "behavioral",
  );
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(
    null,
  );
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: hasInterviewPrep(job.interviewPrep)
        ? "Your saved prep guide is loaded. Ask me to add questions, deepen technical topics, or tailor answers to your background."
        : "Generate interview prep first, then ask me to refine it here.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (hasInterviewPrep(job.interviewPrep)) {
      setGenerated(true);
      setCategories(job.interviewPrep.categories);
      setQuestions(job.interviewPrep.questions);
      setActiveCategory(job.interviewPrep.categories[0]?.id ?? "behavioral");
      return;
    }

    setGenerated(false);
    setCategories([]);
    setQuestions({});
  }, [job.id, job.interviewPrep?.updatedAt]);

  const prepContent = { categories, questions };
  const questionCount = countInterviewQuestions(questions);
  const activeQuestions = questions[activeCategory] ?? [];

  const persistInterviewPrep = async (content: {
    categories: typeof categories;
    questions: typeof questions;
  }) => {
    await updateJob(job.id, buildInterviewPrepUpdate(content));
    saveToBuilderLibrary(buildLibraryInterviewPrepFromJob(job, content));
  };

  const generate = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Settings first.", "error");
      return;
    }

    setGenerating(true);
    try {
      if (!appProfile) {
        toast(
          profileLoading ? "Loading your profile…" : "Complete your profile first.",
          "error",
        );
        return;
      }

      const result = await generateInterviewPrepGuide({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        job: jobToAiContext(job),
        profile: appProfile,
        resume: job.resume?.document ?? null,
      });

      setCategories(result.categories);
      setQuestions(result.questions);
      setActiveCategory(result.categories[0]?.id ?? "behavioral");
      setExpandedQuestionIndex(null);
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
        interviewPrep: null,
      });
      setCategories([]);
      setQuestions({});
      setGenerated(false);
      setExpandedQuestionIndex(null);
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
        job: jobToAiContext(job),
      });

      setCategories(result.categories);
      setQuestions(result.questions);
      if (!result.categories.some((cat) => cat.id === activeCategory)) {
        setActiveCategory(result.categories[0]?.id ?? "behavioral");
      }
      setExpandedQuestionIndex(null);
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
      `${job.company}-${job.position}-interview-prep`,
    );
    toast("Downloaded as TXT");
  };

  if (!generated && !generating) {
    return (
      <>
        {confirmDialog}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto">
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
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r-2 border-[var(--foreground)]">
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
                  setExpandedQuestionIndex(null);
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
            {activeQuestions.length === 0 ? (
              <p className="text-sm font-medium text-[#888]">
                No questions in this category yet. Ask AI Refine to add some.
              </p>
            ) : (
              activeQuestions.map((item, i) => {
                const isExpanded = expandedQuestionIndex === i;
                return (
                <div key={i} className="rounded-2xl bg-white neo-border">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestionIndex(isExpanded ? null : i)
                    }
                    aria-expanded={isExpanded}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold">{item.q}</span>
                    <span className="shrink-0 text-[#888]">{isExpanded ? "▲" : "▼"}</span>
                  </button>
                  {isExpanded ? (
                    <div className="border-t-2 border-[var(--foreground)] px-5 pt-3 pb-4">
                      <NeoBadge color="var(--yellow)" className="mb-2 text-[11px]">
                        Answer framework
                      </NeoBadge>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium text-[#444]">
                        {item.a}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
              })
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
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const libraryResumes = onboardingState?.importedResumes ?? [];

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="shrink-0 border-b-[2.5px] border-[var(--foreground)] bg-white px-7 pt-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 font-heading text-[28px] font-extrabold tracking-tight">
              {job.position}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-[#555]">
              <strong className="text-[var(--foreground)]">{job.company}</strong>
              <span>—</span>
              <span>{job.location}</span>
              {job.incomeRange ? (
                <>
                  <span className="text-[#bbb]">·</span>
                  <span>{job.incomeRange}</span>
                </>
              ) : null}
              {job.workType ? (
                <>
                  <span className="text-[#bbb]">·</span>
                  <NeoBadge color="#ffffff" className="text-[11px]">
                    {job.workType}
                  </NeoBadge>
                </>
              ) : null}
              {job.environmentType ? (
                <NeoBadge color="var(--mint-l)" className="text-[11px]">
                  {job.environmentType}
                </NeoBadge>
              ) : null}
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--background)]">
        <div
          className={cn(
            "animate-tab-panel flex min-h-0 flex-1 flex-col overflow-hidden",
            activeTab !== "info" && "hidden",
          )}
        >
          <div key={job.id} className="flex min-h-0 flex-1 gap-6 overflow-y-auto p-7">
            <div className="flex-1">
              <SectionHeader label="Job Description" color="var(--mint)" />
              <div className="rounded-xl bg-white p-5 text-sm leading-[1.75] font-medium whitespace-pre-line neo-border">
                {job.jobDesc || "No job description provided."}
              </div>
            </div>
            <div className="w-[260px] shrink-0 space-y-4">
              <div>
                <SectionHeader label="Job Details" color="var(--yellow)" />
                <NeoCard className="space-y-2 p-4 text-xs font-medium text-[#555]">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#888]">Location</span>
                    <span className="text-right font-bold text-[var(--foreground)]">
                      {job.location || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#888]">Income</span>
                    <span className="text-right font-bold text-[var(--foreground)]">
                      {job.incomeRange || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#888]">Work type</span>
                    <span className="text-right font-bold text-[var(--foreground)]">
                      {job.workType || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#888]">Environment</span>
                    <span className="text-right font-bold text-[var(--foreground)]">
                      {job.environmentType || "—"}
                    </span>
                  </div>
                </NeoCard>
              </div>
              <div>
              <SectionHeader label="Resume Match" color="var(--lav)" />
              <NeoCard className="p-4">
                {hasResume(job.resume) ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MatchScore score={job.resume.matchScore} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          Tailored resume saved
                        </div>
                        <p className="text-xs text-[#777]">
                          Open the Resume tab to refine or download.
                        </p>
                      </div>
                    </div>
                    <NeoButton
                      variant="mint"
                      size="sm"
                      onClick={() => setActiveTab("resume")}
                    >
                      View tailored resume
                    </NeoButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[#888]">
                      {libraryResumes.length > 0
                        ? `Pick one of ${libraryResumes.length} imported resume${libraryResumes.length === 1 ? "" : "s"} to see match score, then auto-tailor for this job.`
                        : "Import a resume in Profile or the Resume Library, then select it here to tailor."}
                    </p>
                    <NeoButton variant="mint" size="sm" onClick={() => setActiveTab("resume")}>
                      {libraryResumes.length > 0 ? "Select & tailor resume" : "Open resume tab"}
                    </NeoButton>
                  </div>
                )}
              </NeoCard>
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "animate-tab-panel flex min-h-0 flex-1 flex-col overflow-y-auto",
            activeTab !== "resume" && "hidden",
          )}
        >
          <ResumeTab key={job.id} job={job} />
        </div>
        <div
          className={cn(
            "animate-tab-panel flex min-h-0 flex-1 flex-col overflow-hidden",
            activeTab !== "cover" && "hidden",
          )}
        >
          <CoverLetterTab key={job.id} job={job} />
        </div>
        <div
          className={cn(
            "animate-tab-panel flex min-h-0 flex-1 flex-col overflow-y-auto",
            activeTab !== "interview" && "hidden",
          )}
        >
          <InterviewPrepTab key={job.id} job={job} />
        </div>
      </div>
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
          {(job.company?.charAt(0)?.toUpperCase() || "?")}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[13px] font-extrabold leading-snug">
            {job.position || "Untitled role"}
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
        {job.incomeRange ? (
          <span className="inline-flex items-center rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold text-[#666]">
            {job.incomeRange}
          </span>
        ) : null}
        {hasResume(job.resume) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--lav-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            📄 Resume
          </span>
        ) : null}
        {hasCoverLetter(job.coverLetter) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--peach-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            ✉️ Letter
          </span>
        ) : null}
        {hasInterviewPrep(job.interviewPrep) ? (
          <span className="inline-flex items-center rounded-full bg-[var(--yellow-l)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
            🎤 Prep
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#ececec] pt-2.5">
        <span className="truncate text-[10px] font-medium text-[#888]">
          {[job.workType, job.environmentType].filter(Boolean).join(" · ") || "—"}
        </span>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--background)]">
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
      jobSearchText(j).includes(search.toLowerCase()),
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
      message: `Remove "${job?.position ?? "this job"}" at ${job?.company ?? "this company"}? This can't be undone.`,
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
    <div className="flex min-h-0 flex-1 overflow-hidden">
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
                      {job.position}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${job.position}`}
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
