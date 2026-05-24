import { STATUS_COLORS, STATUS_STAGES } from "@/lib/constants";
import type { JobStatus } from "@/lib/constants";
import { matchScoreCircleColor } from "@/lib/match-score-styles";

type MatchScoreProps = {
  score: number | null;
  size?: "lg" | "md" | "sm" | "xs";
};

export function MatchScore({ score, size = "lg" }: MatchScoreProps) {
  if (score === null || score === undefined) return null;

  const sz =
    size === "lg" ? 72 : size === "md" ? 48 : size === "sm" ? 36 : 28;
  const fs =
    size === "lg" ? 20 : size === "md" ? 14 : size === "sm" ? 11 : 9;
  const color = matchScoreCircleColor(score);

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-full neo-border-sm"
      style={{ width: sz, height: sz, background: color }}
    >
      <span
        className="font-heading font-extrabold leading-none"
        style={{ fontSize: fs }}
      >
        {score}%
      </span>
      {size === "lg" && (
        <span className="text-[9px] font-semibold text-[#444]">match</span>
      )}
    </div>
  );
}

type StatusPipelineProps = {
  currentStatus: JobStatus;
  onStatusChange: (status: JobStatus) => void;
};

export function StatusPipeline({
  currentStatus,
  onStatusChange,
}: StatusPipelineProps) {
  const idx = STATUS_STAGES.indexOf(
    currentStatus as (typeof STATUS_STAGES)[number],
  );

  return (
    <div className="overflow-hidden rounded-full neo-border-sm">
      <div className="flex">
        {STATUS_STAGES.map((stage, i) => {
          const isActive = i === idx;
          const isPast = i < idx;
          const isLast = i === STATUS_STAGES.length - 1;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => onStatusChange(stage)}
              className="flex min-w-[80px] flex-1 cursor-pointer items-center justify-center gap-1 whitespace-nowrap font-sans text-[13px] text-[var(--foreground)] transition-[background] duration-150 ease-in-out"
              style={{
                padding: "9px 14px",
                background: isActive
                  ? STATUS_COLORS[stage]
                  : isPast
                    ? "#e8e8e4"
                    : "#ffffff",
                borderRight: isLast ? undefined : "2px solid var(--foreground)",
                fontWeight: isActive ? 800 : 600,
              }}
            >
              {isActive && (
                <span className="text-[10px] leading-none" aria-hidden>
                  ●
                </span>
              )}
              {stage}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  label: string;
  color?: string;
  action?: React.ReactNode;
};

export function SectionHeader({
  label,
  color = "var(--mint)",
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span
        className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-bold text-[var(--foreground)] neo-border-sm"
        style={{ background: color }}
      >
        {label}
      </span>
      {action}
    </div>
  );
}
