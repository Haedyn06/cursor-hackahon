"use client";

import { useState } from "react";
import { AddJobForm } from "@/components/jobs/add-job-form";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  MatchScore,
  SectionHeader,
  StatusPipeline,
} from "@/components/ui/match-score";
import { matchScorePillStyle } from "@/lib/match-score-styles";
import {
  STATUS_COLORS,
  STATUS_STAGES,
  type JobStatus,
} from "@/lib/constants";
import { useJobs } from "@/components/providers/jobs-provider";
import { MOCK_RESUME } from "@/lib/mock-data";
import type { Job } from "@/lib/types/job";

const RESUME_SAMPLE = MOCK_RESUME;

function ResumeTab({ job }: { job: Job }) {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(job.resumeGenerated);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: "Your resume is ready. Ask me to adjust tone, add keywords, or emphasize specific experience.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2200);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setStreaming(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Got it — I've updated the resume to reflect your request. The changes are reflected in the preview on the left.",
        },
      ]);
      setStreaming(false);
    }, 1400);
  };

  if (!generated && !generating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--lav-l)] text-[32px] neo-border">
          📄
        </div>
        <div className="font-heading text-[22px] font-extrabold">No resume yet</div>
        <p className="max-w-[300px] text-center text-sm font-medium text-[#666]">
          Generate a tailored, ATS-optimized resume in seconds
        </p>
        <NeoButton variant="primary" size="lg" onClick={generate}>
          ✦ Generate Resume
        </NeoButton>
      </div>
    );
  }

  if (generating) {
    return (
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
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto border-r-2 border-[var(--foreground)] p-6">
        <div className="mb-5 flex items-center gap-4">
          <MatchScore score={job.matchScore ?? 87} size="lg" />
          <div className="flex-1">
            <div className="mb-2 font-heading text-base font-extrabold">
              Keyword Match
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.matchedKeywords.map((k) => (
                <NeoBadge key={k} color="var(--mint)" className="text-[11px]">
                  ✓ {k}
                </NeoBadge>
              ))}
              {job.missingKeywords.map((k) => (
                <NeoBadge key={k} color="var(--peach)" className="text-[11px]">
                  ✕ {k}
                </NeoBadge>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-8 text-[13px] leading-relaxed whitespace-pre-line neo-border">
          {RESUME_SAMPLE}
        </div>
        <div className="mt-4 flex gap-2.5">
          <NeoButton variant="mint" size="sm" onClick={() => toast("Resume saved!")}>
            Save to Library
          </NeoButton>
          <NeoButton variant="secondary" size="sm" onClick={() => toast("Downloading PDF...")}>
            Download PDF
          </NeoButton>
          <NeoButton variant="secondary" size="sm" onClick={generate}>
            ↺ Regenerate
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Adjust this resume..."
            className="flex-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-2 font-sans text-xs outline-none"
          />
          <button
            onClick={sendMessage}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--lav)] text-sm font-bold neo-border-sm"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverLetterTab({ job }: { job: Job }) {
  const toast = useToast();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [text, setText] = useState("");

  const sample = `Dear Hiring Team,

I'm writing to express my strong interest in the ${job.title} role at ${job.company}...

Best,
Alex Johnson`;

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setText(sample);
    }, 1800);
  };

  if (!generated && !generating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--peach-l)] text-[32px] neo-border">
          ✉️
        </div>
        <div className="font-heading text-[22px] font-extrabold">
          No cover letter yet
        </div>
        <NeoButton variant="peach" size="lg" onClick={generate}>
          ✦ Generate Cover Letter
        </NeoButton>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="font-heading text-[22px] font-extrabold">
          Writing your cover letter...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[480px] w-full resize-y rounded-xl bg-white p-6 font-sans text-sm leading-loose outline-none neo-border"
      />
      <div className="mt-3 flex gap-2.5">
        <NeoButton variant="peach" size="sm" onClick={() => toast("Copied!")}>
          Copy to Clipboard
        </NeoButton>
        <NeoButton variant="secondary" size="sm" onClick={() => toast("Downloading PDF...")}>
          Download PDF
        </NeoButton>
        <NeoButton variant="secondary" size="sm" onClick={generate}>
          ↺ Regenerate
        </NeoButton>
      </div>
    </div>
  );
}

function InterviewPrepTab({ job }: { job: Job }) {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("behavioral");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const categories = [
    { id: "technical", label: "Technical" },
    { id: "behavioral", label: "Behavioral" },
    { id: "culture", label: "Culture" },
    { id: "competitors", label: "Competitors" },
    { id: "products", label: "Products" },
  ];

  const questions: Record<string, { q: string; a: string }[]> = {
    behavioral: [
      {
        q: "Tell me about a time you had a conflict with a teammate over a technical decision.",
        a: "STAR format: Situation — set context. Task — your role. Action — how you navigated it. Result — what happened.",
      },
      {
        q: "Describe a project where you had to learn something new quickly.",
        a: "Pick a real example. Emphasize learning velocity and what you shipped.",
      },
    ],
    technical: [
      {
        q: "How do you approach optimizing a slow React application?",
        a: "Talk about profiling, React.memo, lazy loading, bundle analysis.",
      },
    ],
    culture: [
      {
        q: `Why do you want to work at ${job.company}?`,
        a: "Research 3 specific things about the company and back up your interest.",
      },
    ],
    competitors: [
      {
        q: `How does ${job.company} compare to its main competitors?`,
        a: "Identify 2-3 competitors and articulate differentiation without bashing anyone.",
      },
    ],
    products: [
      {
        q: "What would you improve about our product if you started tomorrow?",
        a: "Pick ONE specific thing. Be concrete. Show product instinct.",
      },
    ],
  };

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1600);
  };

  if (!generated && !generating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--yellow-l)] text-[32px] neo-border">
          🎤
        </div>
        <div className="font-heading text-[22px] font-extrabold">No prep guide yet</div>
        <NeoButton variant="yellow" size="lg" onClick={generate}>
          ✦ Generate Interview Prep
        </NeoButton>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="font-heading text-[22px] font-extrabold">Researching the role...</div>
      </div>
    );
  }

  const qs = questions[activeCategory] ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex gap-1.5 border-b-2 border-[var(--foreground)] px-6 pt-4 pb-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
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
        {qs.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white neo-border">
            <div
              onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
              className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"
            >
              <span className="text-sm font-bold">{item.q}</span>
              <span className="shrink-0 text-[#888]">{expanded[i] ? "▲" : "▼"}</span>
            </div>
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
        ))}
      </div>
    </div>
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
            <div className="w-[220px] shrink-0">
              <SectionHeader label="Keywords" color="var(--lav)" />
              <NeoCard className="p-4">
                {job.matchedKeywords.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-1.5 text-[11px] font-bold text-[#888]">MATCHED</div>
                    <div className="flex flex-wrap gap-1.5">
                      {job.matchedKeywords.map((k) => (
                        <NeoBadge key={k} color="var(--mint)" className="text-[11px]">
                          ✓ {k}
                        </NeoBadge>
                      ))}
                    </div>
                  </div>
                )}
                {job.missingKeywords.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold text-[#888]">MISSING</div>
                    <div className="flex flex-wrap gap-1.5">
                      {job.missingKeywords.map((k) => (
                        <NeoBadge key={k} color="var(--peach)" className="text-[11px]">
                          ✕ {k}
                        </NeoBadge>
                      ))}
                    </div>
                  </div>
                )}
                {!job.matchedKeywords.length && !job.missingKeywords.length && (
                  <p className="py-2 text-center text-xs text-[#888]">
                    Generate a resume to see keyword matches
                  </p>
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

function KanbanView({
  jobs,
  onJobClick,
}: {
  jobs: Job[];
  onJobClick: (id: string) => void;
}) {
  const columns = [...STATUS_STAGES, "Rejected" as const];

  return (
    <div className="flex flex-1 items-start gap-4 overflow-x-auto p-6">
      {columns.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col);
        return (
          <div key={col} className="w-[220px] shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <NeoBadge
                color={STATUS_COLORS[col] ?? "#ffffff"}
                className="text-xs font-extrabold"
              >
                {col}
              </NeoBadge>
              <span className="text-xs font-semibold text-[#888]">{colJobs.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {colJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onJobClick(job.id)}
                  className="cursor-pointer rounded-[14px] bg-white p-4 neo-border transition-neo hover:-translate-y-0.5 hover:bg-[var(--mint-l)]"
                >
                  <div className="mb-1 text-[13px] font-bold">{job.title}</div>
                  <div className="mb-2 text-xs font-medium text-[#666]">{job.company}</div>
                  {job.matchScore !== null && (
                    <MatchScore score={job.matchScore} size="sm" />
                  )}
                </div>
              ))}
              {colJobs.length === 0 && (
                <div className="rounded-[14px] border-2 border-dashed border-[#ddd] p-4 text-center text-xs text-[#aaa]">
                  No jobs
                </div>
              )}
            </div>
          </div>
        );
      })}
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

      {viewMode === "detail" ? (
        <JobDetailPanel
          job={selectedJob}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onDelete={(id) => void handleDeleteJob(id)}
        />
      ) : (
        <KanbanView
          jobs={jobs}
          onJobClick={(id) => {
            setSelectedId(id);
            setViewMode("detail");
          }}
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
