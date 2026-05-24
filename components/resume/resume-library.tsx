"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/providers";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { cn } from "@/lib/utils";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRenamePrompt } from "@/components/ui/prompt-dialog";
import {
  DownloadIcon,
  useDownloadFormat,
} from "@/components/ui/download-format-dialog";
import { getInitialResumeLibrary } from "@/lib/onboarding-storage";
import {
  MOCK_COVER_LETTERS,
  MOCK_INTERVIEW_PREP,
  type MockDocument,
} from "@/lib/mock-data";
import { NewResumeWizard } from "@/components/resume/new-resume-wizard";
import { NewCoverLetterWizard } from "@/components/resume/new-cover-letter-wizard";
import {
  ResumePreviewPanel,
  buildMockResumeContent,
  type GeneratedResume,
} from "@/components/resume/resume-preview-panel";
import {
  CoverLetterPreviewPanel,
  buildMockCoverLetterContent,
  type GeneratedCoverLetter,
} from "@/components/resume/cover-letter-preview-panel";
import { NewInterviewPrepWizard } from "@/components/resume/new-interview-prep-wizard";
import {
  InterviewPrepPreviewPanel,
  buildMockInterviewPrep,
  countInterviewQuestions,
  type GeneratedInterviewPrep,
} from "@/components/resume/interview-prep-preview-panel";

type DocumentKind = "resume" | "cover" | "interview";

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
  {
    id: "interview",
    label: "New Interview Prep",
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
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
];

const LIBRARY_TABS = [
  { id: "resumes", label: "Resumes", icon: "📄" },
  { id: "cover-letters", label: "Cover Letters", icon: "✉️" },
  { id: "interview-prep", label: "Interview Prep", icon: "🎤" },
] as const;

type LibraryTab = (typeof LIBRARY_TABS)[number]["id"];

function parseMatchJob(matchJob: string | null): { title: string; company: string } {
  if (!matchJob) return { title: "Role", company: "Company" };
  const atIndex = matchJob.indexOf(" @ ");
  if (atIndex !== -1) {
    return {
      title: matchJob.slice(0, atIndex),
      company: matchJob.slice(atIndex + 3),
    };
  }
  return { title: matchJob, company: "Company" };
}

function resumeFromLibrary(doc: MockDocument): GeneratedResume {
  const { title, company } = parseMatchJob(doc.matchJob);
  return {
    id: doc.id,
    title: doc.title,
    matchJob: doc.matchJob ?? "",
    templateName: "ATS Classic",
    content: buildMockResumeContent(title, company),
    matchScore: 87,
    matchedKeywords: ["React", "TypeScript", "GraphQL", "CSS"],
    missingKeywords: ["Kubernetes", "Python"],
  };
}

function coverLetterFromLibrary(doc: MockDocument): GeneratedCoverLetter {
  const { title, company } = parseMatchJob(doc.matchJob);
  return {
    id: doc.id,
    title: doc.title,
    matchJob: doc.matchJob ?? "",
    content: buildMockCoverLetterContent(title, company),
  };
}

function interviewPrepFromLibrary(doc: MockDocument): GeneratedInterviewPrep {
  const { title, company } = parseMatchJob(doc.matchJob);
  const mock = buildMockInterviewPrep(title, company);
  return {
    id: doc.id,
    title: doc.title,
    matchJob: doc.matchJob ?? "",
    company: mock.company,
    categories: mock.categories,
    questions: mock.questions,
  };
}

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

function MailIcon({ className }: { className?: string }) {
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
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
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
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function DocumentKindIcon({ kind }: { kind: DocumentKind }) {
  if (kind === "cover") return <MailIcon />;
  if (kind === "interview") return <MicIcon />;
  return <DocIcon />;
}

function DocumentCheckbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[var(--foreground)]"
    />
  );
}

function DocumentCardMenu({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const menuWidth = 148;
    const menuHeight = items.length * 36 + 12;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight + gap;

    return {
      top: openAbove ? rect.top - menuHeight - gap : rect.bottom + gap,
      left: Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      ),
    };
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleReposition = () => {
      const next = computePosition();
      if (next) setPosition(next);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, items.length]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOpen(false);
            return;
          }
          const next = computePosition();
          if (next) setPosition(next);
          setOpen(true);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="cursor-pointer rounded-md border-none bg-transparent px-1 text-lg text-[#888] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
      >
        ⋯
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[250] min-w-[148px] rounded-xl bg-white p-1.5 shadow-[4px_4px_0_#1a1a1a] neo-border"
            style={{ top: position.top, left: position.left }}
          >
            {items.map((label) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(label);
                  setOpen(false);
                }}
                className="block w-full cursor-pointer rounded-lg border-none bg-transparent px-3.5 py-2 text-left font-sans text-[13px] font-bold hover:bg-[var(--mint-l)]"
                style={{
                  color: label === "Delete" ? "#cc0000" : "var(--foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function DocumentCard({
  document,
  kind,
  onToast,
  onOpen,
  onDownload,
  onPractice,
  onRename,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  document: MockDocument;
  kind: DocumentKind;
  onToast: (msg: string) => void;
  onOpen?: () => void;
  onDownload?: () => void;
  onPractice?: () => void;
  onRename?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { confirm, dialog } = useConfirm();
  const menuItems =
    kind === "interview"
      ? ["Practice", "Rename", "Delete"]
      : ["Open", "Rename", "Download", "Delete"];

  const handleMenuAction = async (label: string) => {
    if (label === "Delete") {
      const confirmed = await confirm({
        title: "Delete item?",
        message: `Delete "${document.title}"? This can't be undone.`,
        confirmLabel: "Delete",
      });
      if (!confirmed) return;
      onToast(label);
    } else if (label === "Open") {
      onOpen?.();
    } else if (label === "Practice") {
      onPractice?.();
    } else if (label === "Rename") {
      onRename?.();
    } else if (label === "Download") {
      onDownload?.();
    }
  };

  return (
    <>
      {dialog}
    <NeoCard className="p-0">
      <div
        className="relative flex h-[120px] items-center justify-center border-b-2 border-[var(--foreground)]"
        style={{ background: document.color }}
      >
        {selectionMode && (
          <div className="absolute top-3 left-3">
            <DocumentCheckbox
              checked={selected}
              onChange={() => onToggleSelect?.()}
              ariaLabel={`Select ${document.title}`}
            />
          </div>
        )}
        <div className="flex h-20 w-16 items-center justify-center rounded-md bg-white neo-border-sm">
          <DocumentKindIcon kind={kind} />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <span className="font-heading text-[15px] font-extrabold leading-tight">
            {document.title}
          </span>
          {!selectionMode && (
          <div className="ml-2 shrink-0">
            <DocumentCardMenu
              items={menuItems}
              onSelect={(label) => void handleMenuAction(label)}
            />
          </div>
          )}
        </div>
        {document.matchJob ? (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#777]">
            <span className="font-bold text-[var(--foreground)]">Matched:</span>
            {document.matchJob}
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
        <div className="text-xs text-[#aaa]">
          Edited: {document.edited}
          {kind === "interview" && document.questionCount ? (
            <span className="ml-2 font-bold text-[var(--foreground)]">
              · {document.questionCount} questions
            </span>
          ) : null}
        </div>
      </div>
    </NeoCard>
    </>
  );
}

function DocumentSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[220px] rounded-full border-2 border-[var(--foreground)] bg-white py-2 pr-3.5 pl-9 font-sans text-[13px] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_rgba(199,184,234,0.35)]"
      />
    </div>
  );
}

function DocumentSection({
  kind,
  documents,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRemoveSelected,
  onToast,
  onOpenDocument,
  onPracticeDocument,
  onRenameDocument,
}: {
  kind: DocumentKind;
  documents: MockDocument[];
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  onEmptyAction: () => void;
  onRemoveSelected: (ids: number[]) => void;
  onToast: (msg: string) => void;
  onOpenDocument: (doc: MockDocument) => void;
  onPracticeDocument: (doc: MockDocument) => void;
  onRenameDocument: (doc: MockDocument, title: string) => void;
}) {
  const { confirm, dialog } = useConfirm();
  const { promptRename, dialog: renameDialog } = useRenamePrompt();
  const { pickFormat, dialog: downloadDialog } = useDownloadFormat();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.matchJob ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const filteredIds = filtered.map((doc) => doc.id);
  const selectedInView = filteredIds.filter((id) => selected.has(id)).length;
  const allSelected = filtered.length > 0 && selectedInView === filtered.length;
  const someSelected = selectedInView > 0 && !allSelected;

  const toggleSelectionMode = () => {
    setSelectionMode((active) => {
      if (active) setSelected(new Set());
      return !active;
    });
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filteredIds]));
    }
  };

  const handleRemoveSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;

    const confirmed = await confirm({
      title: ids.length === 1 ? "Remove item?" : `Remove ${ids.length} items?`,
      message:
        ids.length === 1
          ? "Remove this item from your library? This can't be undone."
          : `Remove ${ids.length} items from your library? This can't be undone.`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;

    onRemoveSelected(ids);
    setSelected(new Set());
    setSelectionMode(false);
    onToast(
      ids.length === 1 ? "Item removed." : `Removed ${ids.length} items.`,
    );
  };

  const listGridClass = selectionMode
    ? "grid grid-cols-[32px_minmax(0,1fr)_minmax(180px,1.4fr)_120px_140px] items-center"
    : "grid grid-cols-[minmax(0,1fr)_minmax(180px,1.4fr)_120px_140px] items-center";

  const searchPlaceholder =
    kind === "cover"
      ? "Search cover letters"
      : kind === "interview"
        ? "Search interview prep"
        : "Search resumes";

  const emptyEmoji = kind === "cover" ? "✉️" : kind === "interview" ? "🎤" : "📄";

  const handleDownload = async (doc: MockDocument) => {
    const format = await pickFormat(doc.title);
    if (!format) return;
    onToast(`Downloading ${doc.title} as ${format.toUpperCase()}...`);
  };

  const handleRename = async (doc: MockDocument) => {
    const newTitle = await promptRename({
      title: "Rename",
      message: `Enter a new name for "${doc.title}".`,
      label: "Title",
      defaultValue: doc.title,
    });
    if (!newTitle || newTitle === doc.title) return;
    onRenameDocument(doc, newTitle);
    onToast("Renamed!");
  };

  return (
    <div>
      {dialog}
      {renameDialog}
      {downloadDialog}
      <div className="mb-5 flex items-center justify-end gap-2">
        <DocumentSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
          <div className="flex overflow-hidden rounded-[10px] neo-border">
            {(["grid", "list"] as const).map((v, idx) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewModeChange(v)}
                className="cursor-pointer border-none px-3.5 py-2 text-[15px] font-bold transition-[background,color] duration-150"
                style={{
                  background: viewMode === v ? "var(--foreground)" : "#ffffff",
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
          {selectionMode && selected.size > 0 && (
            <NeoButton
              variant="danger"
              size="sm"
              className="px-2.5 py-1.5 text-[11px]"
              onClick={handleRemoveSelected}
            >
              Remove ({selected.size})
            </NeoButton>
          )}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={cn(
              "flex h-[38px] cursor-pointer items-center justify-center rounded-[10px] px-3 text-sm font-bold neo-border transition-colors duration-150",
              selectionMode
                ? "bg-[var(--foreground)] text-white"
                : "bg-white hover:bg-[var(--background)]",
            )}
            aria-label={selectionMode ? "Exit selection mode" : "Select items"}
            aria-pressed={selectionMode}
          >
            ⋮
          </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-3 text-[40px]">{emptyEmoji}</div>
          <div className="mb-1.5 text-lg font-bold">{emptyTitle}</div>
          <p className="mb-5 text-sm text-[#888]">{emptyDescription}</p>
          <NeoButton variant="primary" onClick={onEmptyAction}>
            {emptyActionLabel}
          </NeoButton>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {filtered.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              kind={kind}
              onToast={onToast}
              onOpen={() => onOpenDocument(document)}
              onDownload={() => void handleDownload(document)}
              onPractice={() => onPracticeDocument(document)}
              onRename={() => void handleRename(document)}
              selectionMode={selectionMode}
              selected={selected.has(document.id)}
              onToggleSelect={() => toggleOne(document.id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white neo-border">
          <div
            className={cn(
              listGridClass,
              "border-b-2 border-[var(--foreground)] px-4 py-2.5 text-xs font-bold text-[#888]",
            )}
          >
            {selectionMode && (
              <DocumentCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
                ariaLabel="Select all visible items"
              />
            )}
            <span>Title</span>
            <span>Matched Job</span>
            <span>Edited</span>
            <span />
          </div>
          {filtered.map((document, i) => (
            <div
              key={document.id}
              className={cn(
                listGridClass,
                "px-4 py-3.5 transition-colors duration-150",
                i < filtered.length - 1 && "border-b-2 border-[var(--foreground)]",
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--background)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              {selectionMode && (
                <DocumentCheckbox
                  checked={selected.has(document.id)}
                  onChange={() => toggleOne(document.id)}
                  ariaLabel={`Select ${document.title}`}
                />
              )}
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md text-[var(--foreground)] neo-border-sm"
                  style={{ background: document.color }}
                >
                  <DocumentKindIcon kind={kind} />
                </div>
                <span className="truncate text-sm font-bold">{document.title}</span>
              </div>
              <span className="truncate pr-4 text-[13px] text-[#888]">
                {document.matchJob ?? "—"}
              </span>
              <span className="text-[13px] text-[#888]">
                {kind === "interview" && document.questionCount
                  ? `${document.questionCount} Q · ${document.edited}`
                  : document.edited}
              </span>
              <div className="flex justify-end gap-1.5">
                {!selectionMode && (
                  <>
                    {kind !== "interview" && (
                      <button
                        type="button"
                        onClick={() => onOpenDocument(document)}
                        className="cursor-pointer rounded-full border-2 border-[var(--foreground)] bg-white px-3.5 py-1.5 font-sans text-[11px] font-bold text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--background)]"
                      >
                        Open
                      </button>
                    )}
                    {kind === "interview" ? (
                      <button
                        type="button"
                        onClick={() => onPracticeDocument(document)}
                        className="cursor-pointer rounded-full border-2 border-[var(--foreground)] bg-white px-3.5 py-1.5 font-sans text-[11px] font-bold text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--background)]"
                      >
                        Practice
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleDownload(document)}
                        aria-label={`Download ${document.title}`}
                        className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-2 border-[var(--foreground)] bg-white text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--background)]"
                      >
                        <DownloadIcon />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResumeLibraryView() {
  const toast = useToast();
  const { pickFormat, dialog: downloadDialog } = useDownloadFormat();
  const [activeTab, setActiveTab] = useState<LibraryTab>("resumes");
  const [resumeSearch, setResumeSearch] = useState("");
  const [coverSearch, setCoverSearch] = useState("");
  const [interviewSearch, setInterviewSearch] = useState("");
  const [resumeViewMode, setResumeViewMode] = useState<"grid" | "list">("list");
  const [coverViewMode, setCoverViewMode] = useState<"grid" | "list">("list");
  const [interviewViewMode, setInterviewViewMode] = useState<"grid" | "list">(
    "list",
  );
  const [resumes, setResumes] = useState(() => getInitialResumeLibrary());
  const [coverLetters, setCoverLetters] = useState(() =>
    structuredClone(MOCK_COVER_LETTERS),
  );
  const [interviewPrep, setInterviewPrep] = useState(() =>
    structuredClone(MOCK_INTERVIEW_PREP),
  );
  const [showNewResumeWizard, setShowNewResumeWizard] = useState(false);
  const [showNewCoverLetterWizard, setShowNewCoverLetterWizard] = useState(false);
  const [previewResume, setPreviewResume] = useState<GeneratedResume | null>(
    null,
  );
  const [previewCoverLetter, setPreviewCoverLetter] =
    useState<GeneratedCoverLetter | null>(null);
  const [showNewInterviewPrepWizard, setShowNewInterviewPrepWizard] =
    useState(false);
  const [previewInterviewPrep, setPreviewInterviewPrep] =
    useState<GeneratedInterviewPrep | null>(null);

  const saveGeneratedResume = (generated: GeneratedResume) => {
    setResumes((r) => [
      {
        id: generated.id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: new Date().toLocaleDateString("en-US"),
        color: "var(--mint)",
      },
      ...r.filter((item) => item.id !== generated.id),
    ]);
    setActiveTab("resumes");
    setPreviewResume(null);
    toast("Resume saved to library!");
  };

  const saveGeneratedCoverLetter = (generated: GeneratedCoverLetter) => {
    setCoverLetters((letters) => [
      {
        id: generated.id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: new Date().toLocaleDateString("en-US"),
        color: "var(--yellow)",
      },
      ...letters.filter((item) => item.id !== generated.id),
    ]);
    setActiveTab("cover-letters");
    setPreviewCoverLetter(null);
    toast("Cover letter saved to library!");
  };

  const saveGeneratedInterviewPrep = (generated: GeneratedInterviewPrep) => {
    setInterviewPrep((items) => [
      {
        id: generated.id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: new Date().toLocaleDateString("en-US"),
        color: "var(--lav)",
        questionCount: countInterviewQuestions(generated.questions),
      },
      ...items.filter((item) => item.id !== generated.id),
    ]);
    setActiveTab("interview-prep");
    setPreviewInterviewPrep(null);
    toast("Interview prep saved to library!");
  };

  const handleAction = (id: string) => {
    if (id === "new") {
      setShowNewResumeWizard(true);
    } else if (id === "cover") {
      setShowNewCoverLetterWizard(true);
    } else if (id === "interview") {
      setShowNewInterviewPrepWizard(true);
    }
  };

  const handleDownload = async (title: string) => {
    const format = await pickFormat(title);
    if (format) toast(`Downloading ${title} as ${format.toUpperCase()}...`);
  };

  if (previewResume) {
    return (
      <>
        {downloadDialog}
        <ResumePreviewPanel
          resume={previewResume}
          onBack={() => setPreviewResume(null)}
          onSave={saveGeneratedResume}
          onDownload={() => void handleDownload(previewResume.title)}
        />
      </>
    );
  }

  if (previewCoverLetter) {
    return (
      <>
        {downloadDialog}
        <CoverLetterPreviewPanel
          coverLetter={previewCoverLetter}
          onBack={() => setPreviewCoverLetter(null)}
          onSave={saveGeneratedCoverLetter}
          onDownload={() => void handleDownload(previewCoverLetter.title)}
        />
      </>
    );
  }

  if (previewInterviewPrep) {
    return (
      <InterviewPrepPreviewPanel
        prep={previewInterviewPrep}
        onBack={() => setPreviewInterviewPrep(null)}
        onSave={saveGeneratedInterviewPrep}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      <NewResumeWizard
        open={showNewResumeWizard}
        onClose={() => setShowNewResumeWizard(false)}
        onComplete={(resume) => {
          setPreviewResume(resume);
          setShowNewResumeWizard(false);
        }}
      />
      <NewCoverLetterWizard
        open={showNewCoverLetterWizard}
        onClose={() => setShowNewCoverLetterWizard(false)}
        onComplete={(coverLetter) => {
          setPreviewCoverLetter(coverLetter);
          setShowNewCoverLetterWizard(false);
        }}
      />
      <NewInterviewPrepWizard
        open={showNewInterviewPrepWizard}
        onClose={() => setShowNewInterviewPrepWizard(false)}
        onComplete={(prep) => {
          setPreviewInterviewPrep(prep);
          setShowNewInterviewPrepWizard(false);
        }}
      />

      <div className="mx-auto max-w-[1100px] px-10 py-9">
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
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

        <div className="rounded-2xl bg-white neo-border">
          <div className="border-b-2 border-[var(--foreground)] px-6 pt-4">
            <NeoTabs
              tabs={[...LIBRARY_TABS]}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as LibraryTab)}
            />
          </div>
          <div className="p-6">
            {activeTab === "resumes" && (
              <DocumentSection
                kind="resume"
                documents={resumes}
                search={resumeSearch}
                onSearchChange={setResumeSearch}
                viewMode={resumeViewMode}
                onViewModeChange={setResumeViewMode}
                emptyTitle="No resumes yet"
                emptyDescription="Create your first resume to get started"
                emptyActionLabel="+ New Resume"
                onEmptyAction={() => handleAction("new")}
                onRemoveSelected={(ids) =>
                  setResumes((items) => items.filter((item) => !ids.includes(item.id)))
                }
                onToast={toast}
                onOpenDocument={(doc) => setPreviewResume(resumeFromLibrary(doc))}
                onPracticeDocument={() => {}}
                onRenameDocument={(doc, title) =>
                  setResumes((items) =>
                    items.map((item) =>
                      item.id === doc.id ? { ...item, title } : item,
                    ),
                  )
                }
              />
            )}
            {activeTab === "cover-letters" && (
              <DocumentSection
                kind="cover"
                documents={coverLetters}
                search={coverSearch}
                onSearchChange={setCoverSearch}
                viewMode={coverViewMode}
                onViewModeChange={setCoverViewMode}
                emptyTitle="No cover letters yet"
                emptyDescription="Create a cover letter tailored to your next application"
                emptyActionLabel="+ New Cover Letter"
                onEmptyAction={() => handleAction("cover")}
                onRemoveSelected={(ids) =>
                  setCoverLetters((items) =>
                    items.filter((item) => !ids.includes(item.id)),
                  )
                }
                onToast={toast}
                onOpenDocument={(doc) =>
                  setPreviewCoverLetter(coverLetterFromLibrary(doc))
                }
                onPracticeDocument={() => {}}
                onRenameDocument={(doc, title) =>
                  setCoverLetters((items) =>
                    items.map((item) =>
                      item.id === doc.id ? { ...item, title } : item,
                    ),
                  )
                }
              />
            )}
            {activeTab === "interview-prep" && (
              <DocumentSection
                kind="interview"
                documents={interviewPrep}
                search={interviewSearch}
                onSearchChange={setInterviewSearch}
                viewMode={interviewViewMode}
                onViewModeChange={setInterviewViewMode}
                emptyTitle="No interview prep yet"
                emptyDescription="Generate question banks for your upcoming interviews"
                emptyActionLabel="+ New Interview Prep"
                onEmptyAction={() => handleAction("interview")}
                onRemoveSelected={(ids) =>
                  setInterviewPrep((items) =>
                    items.filter((item) => !ids.includes(item.id)),
                  )
                }
                onToast={toast}
                onOpenDocument={() => {}}
                onPracticeDocument={(doc) =>
                  setPreviewInterviewPrep(interviewPrepFromLibrary(doc))
                }
                onRenameDocument={(doc, title) =>
                  setInterviewPrep((items) =>
                    items.map((item) =>
                      item.id === doc.id ? { ...item, title } : item,
                    ),
                  )
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
