"use client";

import { cn } from "@/lib/utils";

type ProgressStepsProps = {
  steps: string[];
  currentStep: number;
};

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = currentStep > n;
        const active = currentStep === n;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold neo-border-sm",
                )}
                style={{
                  background: done
                    ? "var(--mint)"
                    : active
                      ? "var(--lav)"
                      : "#ffffff",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  active ? "font-bold text-[var(--foreground)]" : "text-[#888]",
                )}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 w-7 rounded-sm"
                style={{ background: done ? "var(--mint)" : "#dddddd" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
