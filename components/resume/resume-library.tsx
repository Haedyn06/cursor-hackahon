"use client";

import { useState } from "react";
import { useToast } from "@/components/providers";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { NeoCard } from "@/components/ui/neo-card";
import { cn } from "@/lib/utils";
import { MOCK_RESUMES, type MockResume } from "@/lib/mock-data";

const ACTIONS = [
  {
    id: "new",
    label: "New Resume",
    color: "var(--mint)",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: "jd",
    label: "Start from job description",
    color: "var(--lav)",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    id: "template",
    label: "Start from template",
    color: "var(--peach)",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M3 7h5l2-4h4l2 4h5" />
        <path d="M3 17h5l2 4h4l2-4h5" />
      </svg>
    ),
  },
  {
    id: "cover",
    label: "New Cover Letter",
    color: "var(--yellow)",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ResumeCard({
  resume,
  onToast,
}: {
  resume: MockResume;
  onToast: (msg: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <NeoCard
      className="overflow-hidden p-0"
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div
        className="flex h-[120px] items-center justify-center border-b-2 border-[var(--foreground)]"
        style={{ background: resume.color }}
      >
        <div className="flex h-20 w-16 items-center justify-center rounded-md bg-white neo-border-sm">
          <DocIcon />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <span className="font-heading text-[15px] font-extrabold leading-tight">
            {resume.title}
          </span>
          <div className="relative ml-2 shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="cursor-pointer border-none bg-transparent px-1 text-lg text-[#888]"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-10 min-w-[140px] rounded-xl bg-white p-1.5 shadow-[4px_4px_0_#1a1a1a] neo-border">
                {["Open", "Rename", "Duplicate", "Download PDF", "Delete"].map(
                  (label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        onToast(label);
                        setMenuOpen(false);
                      }}
                      className="block w-full cursor-pointer rounded-lg border-none bg-transparent px-3.5 py-2 text-left font-sans text-[13px] font-bold hover:bg-[var(--mint-l)]"
                      style={{
                        color: label === "Delete" ? "#cc0000" : "var(--foreground)",
                      }}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
        {resume.matchJob ? (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#777]">
            <span className="font-bold text-[var(--foreground)]">Matched:</span>
            {resume.matchJob}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToast("Match to a job!")}
            className="mb-1 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888]"
          >
            Match a job
          </button>
        )}
        <div className="text-xs text-[#aaa]">Edited: {resume.edited}</div>
      </div>
    </NeoCard>
  );
}

function ResumeSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#aaa]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        placeholder="Search Resumes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[220px] rounded-full border-2 border-[var(--foreground)] bg-white py-2 pr-3.5 pl-9 font-sans text-[13px] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_rgba(199,184,234,0.35)]"
      />
    </div>
  );
}

export function ResumeLibraryView() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [resumes, setResumes] = useState(() => structuredClone(MOCK_RESUMES));
  const [showModal, setShowModal] = useState<string | null>(null);

  const filtered = resumes.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.matchJob ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleAction = (id: string) => {
    if (id === "new") {
      setResumes((r) => [
        {
          id: Date.now(),
          title: "Untitled Resume",
          matchJob: null,
          edited: new Date().toLocaleDateString("en-US"),
          color: "var(--mint)",
        },
        ...r,
      ]);
      toast("New resume created!");
    } else if (id === "cover") {
      toast("New cover letter created!");
    } else {
      setShowModal(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(null)}
            className="fixed inset-0 z-[200] bg-black/25"
          />
          <div className="fixed top-1/2 left-1/2 z-[201] w-[480px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-8 neo-border">
            <div className="mb-4 font-heading text-[22px] font-extrabold">
              {showModal === "jd"
                ? "Start from Job Description"
                : "Choose a Template"}
            </div>
            {showModal === "jd" ? (
              <>
                <NeoInput
                  label="Job Title"
                  placeholder="e.g. Frontend Engineer"
                  className="mb-3"
                />
                <NeoInput
                  label="Paste Job Description"
                  placeholder="Paste the full JD here..."
                  multiline
                  rows={6}
                />
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {["ATS Classic", "Modern Minimal", "Creative Bold", "Executive"].map(
                  (t) => (
                    <div
                      key={t}
                      onClick={() => {
                        setShowModal(null);
                        toast(`Starting from "${t}" template!`);
                      }}
                      className="cursor-pointer rounded-xl p-4 text-center neo-border transition-colors duration-150 hover:bg-[var(--lav-l)]"
                    >
                      <div className="mx-auto mb-2.5 flex h-[60px] w-12 items-center justify-center rounded-md bg-[var(--lav-l)] neo-border-sm">
                        <DocIcon />
                      </div>
                      <div className="text-[13px] font-bold">{t}</div>
                    </div>
                  ),
                )}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => setShowModal(null)}
              >
                Cancel
              </NeoButton>
              <NeoButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowModal(null);
                  toast("Resume created!");
                }}
              >
                Create Resume →
              </NeoButton>
            </div>
          </div>
        </>
      )}

      <div className="mx-auto max-w-[1100px] px-10 py-9">
        <div className="mb-12 grid grid-cols-4 gap-5">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action.id)}
              className="flex cursor-pointer flex-col items-center gap-[18px] rounded-[20px] bg-white px-5 pt-9 pb-7 text-center neo-border transition-[background,transform] duration-150 hover:-translate-y-0.5"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              <div
                className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[var(--foreground)] neo-border"
                style={{ background: action.color }}
              >
                {action.icon}
              </div>
              <span className="text-[15px] font-bold leading-snug text-[var(--foreground)]">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <span className="font-heading text-[22px] font-extrabold whitespace-nowrap">
              Recent Resumes
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <ResumeSearchInput value={search} onChange={setSearch} />
              <div className="flex overflow-hidden rounded-[10px] neo-border">
                {(["grid", "list"] as const).map((v, idx) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setViewMode(v)}
                    className="cursor-pointer border-none px-3.5 py-2 text-[15px] font-bold transition-[background,color] duration-150"
                    style={{
                      background:
                        viewMode === v ? "var(--foreground)" : "#ffffff",
                      color: viewMode === v ? "#ffffff" : "var(--foreground)",
                      borderRight:
                        idx === 0 ? "2px solid var(--foreground)" : undefined,
                    }}
                    aria-label={v === "grid" ? "Grid view" : "List view"}
                  >
                    {v === "grid" ? "⊞" : "☰"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="flex h-[38px] cursor-pointer items-center justify-center rounded-[10px] bg-white px-3 text-sm font-bold neo-border transition-colors duration-150 hover:bg-[var(--background)]"
                aria-label="Sort options"
              >
                ⋮
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3 text-[40px]">📄</div>
              <div className="mb-1.5 text-lg font-bold">No resumes yet</div>
              <p className="mb-5 text-sm text-[#888]">
                Create your first resume to get started
              </p>
              <NeoButton variant="primary" onClick={() => handleAction("new")}>
                + New Resume
              </NeoButton>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filtered.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} onToast={toast} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white neo-border">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,1.4fr)_120px_140px] items-center border-b-2 border-[var(--foreground)] px-4 py-2.5 text-xs font-bold text-[#888]">
                <span>Title</span>
                <span>Matched Job</span>
                <span>Edited</span>
                <span />
              </div>
              {filtered.map((resume, i) => (
                <div
                  key={resume.id}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_minmax(180px,1.4fr)_120px_140px] items-center px-4 py-3.5 transition-colors duration-150",
                    i < filtered.length - 1 &&
                      "border-b-2 border-[var(--foreground)]",
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--background)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md text-[var(--foreground)] neo-border-sm"
                      style={{ background: resume.color }}
                    >
                      <DocIcon />
                    </div>
                    <span className="truncate text-sm font-bold">
                      {resume.title}
                    </span>
                  </div>
                  <span className="truncate pr-4 text-[13px] text-[#888]">
                    {resume.matchJob ?? "—"}
                  </span>
                  <span className="text-[13px] text-[#888]">{resume.edited}</span>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => toast("Opening resume...")}
                      className="cursor-pointer rounded-full border-2 border-[var(--foreground)] bg-white px-3.5 py-1.5 font-sans text-[11px] font-bold text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--background)]"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => toast("Downloading...")}
                      className="cursor-pointer rounded-full border-2 border-[var(--foreground)] bg-white px-3.5 py-1.5 font-sans text-[11px] font-bold text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--background)]"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
