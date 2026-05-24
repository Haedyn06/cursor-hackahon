"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { AddJobForm } from "@/components/jobs/add-job-form";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { MatchScore } from "@/components/ui/match-score";
import { cn } from "@/lib/utils";
import {
  STATUS_COLORS,
  STATUS_STAGES,
  TRACKER_STAGES,
  type JobStatus,
} from "@/lib/constants";
import { useJobs } from "@/components/providers/jobs-provider";
import type { Job } from "@/lib/types/job";

function StagePieChart({
  count,
  total,
  color,
  hasItems,
}: {
  count: number;
  total: number;
  color: string;
  hasItems: boolean;
}) {
  const size = 76;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 && hasItems ? count / total : 0;
  const dash = ratio * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={hasItems ? "#e8e8e8" : "#ececec"}
        strokeWidth={stroke}
        opacity={hasItems ? 1 : 0.7}
      />
      {hasItems && ratio > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      )}
    </svg>
  );
}

function ChevronPipeline({
  jobs,
  activeStage,
  onStageClick,
}: {
  jobs: Job[];
  activeStage: string | null;
  onStageClick: (stage: string | null) => void;
}) {
  const counts = TRACKER_STAGES.reduce(
    (acc, s) => {
      acc[s.key] = jobs.filter((j) => j.status === s.key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = TRACKER_STAGES.reduce((sum, s) => sum + counts[s.key], 0);

  const chevronClip = (isFirst: boolean, isLast: boolean) => {
    if (isLast) return undefined;
    if (isFirst) {
      return "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 0 0)";
    }
    return "polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)";
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl neo-border">
      <div className="flex">
        {TRACKER_STAGES.map((stage, i) => {
          const count = counts[stage.key];
          const active = activeStage === stage.key;
          const hasItems = count > 0;
          const isFirst = i === 0;
          const isLast = i === TRACKER_STAGES.length - 1;
          const baseBg = active
            ? STATUS_COLORS[stage.key]
            : hasItems
              ? "#ffffff"
              : "var(--background)";

          return (
            <div
              key={stage.key}
              role="button"
              tabIndex={0}
              onClick={() => onStageClick(active ? null : stage.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onStageClick(active ? null : stage.key);
                }
              }}
              className="min-w-0 flex-1 cursor-pointer py-[18px] text-center transition-[background] duration-200 ease-in-out"
              style={{
                paddingLeft: isFirst ? 12 : 24,
                paddingRight: 12,
                background: baseBg,
                clipPath: chevronClip(isFirst, isLast),
                marginRight: isLast ? 0 : -12,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = `${STATUS_COLORS[stage.key]}88`;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = baseBg;
                }
              }}
            >
              <div className="relative mx-auto mb-1 flex h-[76px] w-[76px] items-center justify-center">
                <StagePieChart
                  count={count}
                  total={total}
                  color={STATUS_COLORS[stage.key] ?? "#cccccc"}
                  hasItems={hasItems}
                />
                <div
                  className="relative z-10 font-heading font-extrabold leading-none text-[var(--foreground)]"
                  style={{ fontSize: hasItems ? 28 : 18 }}
                >
                  {hasItems ? count : "—"}
                </div>
              </div>
              <div
                className="text-[10px] font-extrabold tracking-[0.08em]"
                style={{ color: hasItems ? "var(--foreground)" : "#bbbbbb" }}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackerCheckbox({
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

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className="cursor-pointer border-none bg-transparent p-0.5 text-base leading-none transition-[color,transform] duration-150 hover:scale-110"
          style={{ color: n <= value ? "#f0a500" : "#dddddd" }}
          aria-label={`Rate ${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type SortKey = keyof Job;

function ColHeader({
  label,
  sortKey,
  sortBy,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        "sticky top-0 z-10 cursor-pointer border-b-[2.5px] border-r-2 border-[var(--foreground)] bg-white px-3 py-2.5 text-left text-xs font-bold whitespace-nowrap select-none transition-colors duration-150",
        active ? "text-[var(--foreground)]" : "text-[#888]",
        className,
      )}
    >
      {label}
      <span
        className="ml-1 text-[10px]"
        style={{ color: active ? "var(--foreground)" : "#cccccc" }}
      >
        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </th>
  );
}

export function JobBoardView() {
  const toast = useToast();
  const { jobs, loading, updateJob, updateJobStatus, deleteJobs } = useJobs();
  const [showAddJob, setShowAddJob] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("dateAdded");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      await updateJobStatus(id, status);
    } catch {
      toast("Failed to update status.", "error");
    }
  };

  const handleExcitementChange = async (id: string, excitement: number) => {
    try {
      await updateJob(id, { excitement });
    } catch {
      toast("Failed to update excitement.", "error");
    }
  };

  const handleRemoveSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;

    try {
      await deleteJobs(ids);
      setSelected(new Set());
      toast(
        ids.length === 1 ? "Job removed." : `Removed ${ids.length} jobs.`,
      );
    } catch {
      toast("Failed to remove jobs.", "error");
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  let filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchStage = !activeStage || j.status === activeStage;
    return matchSearch && matchStage;
  });

  filtered = [...filtered].sort((a, b) => {
    const va = String(a[sortBy] ?? "").toLowerCase();
    const vb = String(b[sortBy] ?? "").toLowerCase();
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const filteredIds = filtered.map((j) => j.id);
  const selectedInView = filteredIds.filter((id) => selected.has(id)).length;
  const allSelected =
    filtered.length > 0 && selectedInView === filtered.length;
  const someSelected = selectedInView > 0 && !allSelected;

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <AddJobForm
        open={showAddJob}
        onClose={() => setShowAddJob(false)}
      />

      <div className="flex-1 overflow-y-auto px-8 py-7">
        {loading && jobs.length === 0 ? (
          <div className="py-16 text-center text-sm font-semibold text-[#888]">
            Loading jobs…
          </div>
        ) : (
          <>
        <ChevronPipeline
          jobs={jobs}
          activeStage={activeStage}
          onStageClick={setActiveStage}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative">
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
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] rounded-full border-2 border-[var(--foreground)] bg-white py-2 pr-3.5 pl-9 font-sans text-[13px] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_rgba(199,184,234,0.35)]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-full border-2 border-[var(--foreground)] bg-white px-3.5 py-1.5">
            <TrackerCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              ariaLabel="Select all visible jobs"
            />
            <span className="text-[13px] font-bold text-[#666]">
              {selected.size} selected
            </span>
            {selected.size > 0 && (
              <NeoButton
                variant="danger"
                size="sm"
                className="ml-1 px-2.5 py-1 text-[11px]"
                onClick={() => void handleRemoveSelected()}
              >
                Remove
              </NeoButton>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex overflow-hidden rounded-[10px] neo-border">
            {(["list", "grid"] as const).map((v, idx) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className="cursor-pointer border-none px-3.5 py-2 text-[15px] font-bold transition-[background,color] duration-150"
                style={{
                  background: viewMode === v ? "var(--foreground)" : "#ffffff",
                  color: viewMode === v ? "#ffffff" : "var(--foreground)",
                  borderRight:
                    idx === 0 ? "2px solid var(--foreground)" : undefined,
                }}
                aria-label={v === "list" ? "List view" : "Grid view"}
              >
                {v === "list" ? "☰" : "⊞"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-[13px] font-bold neo-border transition-neo hover:bg-[var(--mint-l)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>

          <NeoButton
            variant="mint"
            onClick={() => setShowAddJob(true)}
            className="inline-flex items-center gap-1.5 font-extrabold"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Job
          </NeoButton>
        </div>

        {viewMode === "list" ? (
          <div className="overflow-hidden rounded-2xl bg-white neo-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 w-11 border-b-[2.5px] border-r-2 border-[var(--foreground)] bg-white px-3 py-2.5 text-left">
                      <TrackerCheckbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                        ariaLabel="Select all jobs in table"
                      />
                    </th>
                    <ColHeader
                      label="Job Position"
                      sortKey="title"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[180px]"
                    />
                    <ColHeader
                      label="Company"
                      sortKey="company"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[120px]"
                    />
                    <ColHeader
                      label="Max. Salary"
                      sortKey="salary"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[110px]"
                    />
                    <ColHeader
                      label="Location"
                      sortKey="location"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[130px]"
                    />
                    <ColHeader
                      label="Status"
                      sortKey="status"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[110px]"
                    />
                    <ColHeader
                      label="Date Saved"
                      sortKey="dateAdded"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[110px]"
                    />
                    <ColHeader
                      label="Deadline"
                      sortKey="deadline"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[100px]"
                    />
                    <ColHeader
                      label="Date Applied"
                      sortKey="dateApplied"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[120px]"
                    />
                    <ColHeader
                      label="Follow Up"
                      sortKey="followUp"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[110px]"
                    />
                    <ColHeader
                      label="Excitement"
                      sortKey="excitement"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="min-w-[130px] border-r-0"
                    />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-12 text-center text-sm font-semibold text-[#aaa]"
                      >
                        No jobs found. Try adjusting your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((job, i) => {
                      const isSelected = selected.has(job.id);
                      const isEven = i % 2 === 0;
                      const rowBg = isSelected
                        ? "var(--lav-l)"
                        : isEven
                          ? "#ffffff"
                          : "var(--background)";

                      return (
                        <tr
                          key={job.id}
                          className="transition-[background] duration-150 ease-in-out"
                          style={{ background: rowBg }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = "var(--mint-l)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = rowBg;
                          }}
                        >
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle">
                            <TrackerCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelect(job.id)}
                              ariaLabel={`Select ${job.title}`}
                            />
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle">
                            <Link
                              href={`/jobs?selected=${job.id}`}
                              className="font-sans text-[13px] font-bold text-[var(--foreground)] underline underline-offset-[3px] transition-opacity duration-150 hover:opacity-70"
                            >
                              {job.title}
                            </Link>
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] font-medium text-[#555]">
                            {job.company}
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] text-[#555]">
                            {job.salary}
                          </td>
                          <td className="max-w-[130px] border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] text-[#555]">
                            <span className="block truncate">{job.location}</span>
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle">
                            <select
                              value={job.status}
                              onChange={(e) =>
                                void handleStatusChange(
                                  job.id,
                                  e.target.value as JobStatus,
                                )
                              }
                              className="cursor-pointer rounded-full px-2.5 py-1 font-sans text-xs font-bold text-[var(--foreground)] outline-none neo-border-sm transition-[background] duration-150"
                              style={{
                                background:
                                  STATUS_COLORS[job.status] ?? "#ffffff",
                              }}
                            >
                              {STATUS_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] text-[#555]">
                            {job.dateAdded}
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] text-[#aaa]">
                            {job.deadline || "N/A"}
                          </td>
                          <td
                            className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px]"
                            style={{ color: job.dateApplied ? "#555555" : "#aaaaaa" }}
                          >
                            {job.dateApplied || "—"}
                          </td>
                          <td className="border-b-2 border-r-2 border-[var(--foreground)] px-3 py-3 align-middle text-[13px] text-[#aaa]">
                            {job.followUp ? (
                              <span className="text-[#555]">{job.followUp}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toast("Set follow-up date!")}
                                className="cursor-pointer border-none bg-transparent p-0 font-sans text-xs font-semibold text-[#bbbbbb] transition-colors duration-150 hover:text-[var(--foreground)]"
                              >
                                Add date
                              </button>
                            )}
                          </td>
                          <td className="border-b-2 border-[var(--foreground)] px-3 py-3 align-middle">
                            <StarRating
                              value={job.excitement}
                              onChange={(val) =>
                                void handleExcitementChange(job.id, val)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {filtered.map((job) => (
              <Link
                key={job.id}
                href={`/jobs?selected=${job.id}`}
                className="cursor-pointer rounded-2xl bg-white p-5 neo-border transition-neo hover:-translate-y-0.5 hover:bg-[var(--mint-l)]"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-extrabold">{job.title}</div>
                    <div className="text-xs font-medium text-[#666]">
                      {job.company}
                    </div>
                  </div>
                  <NeoBadge
                    color={STATUS_COLORS[job.status] ?? "#ffffff"}
                    className="shrink-0 text-[11px]"
                  >
                    {job.status}
                  </NeoBadge>
                </div>
                <div className="mb-2.5 text-xs text-[#888]">{job.location}</div>
                <div className="flex items-center justify-between">
                  <StarRating
                    value={job.excitement}
                    onChange={() => {}}
                  />
                  {job.matchScore !== null && job.matchScore !== undefined && (
                    <MatchScore score={job.matchScore} size="xs" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
