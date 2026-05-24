"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  id?: string;
  label: string;
  description?: string;
  color?: string;
  action?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
};

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Inner block for repeatable fields inside a profile section */
export function ProfileFormEntry({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-[#e8e8e8] bg-white p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CollapsibleSection({
  id,
  label,
  description,
  color = "var(--mint)",
  action,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div id={id} className={cn("scroll-mt-24", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl bg-white neo-border transition-[box-shadow,transform] duration-200",
          open && "shadow-[4px_4px_0_#1a1a1a]",
        )}
      >
        <div
          className="flex items-stretch gap-0"
          style={{ background: open ? `${color}40` : "#ffffff" }}
        >
          <div
            className="w-1.5 shrink-0"
            style={{ background: color }}
            aria-hidden
          />

          <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[15px] font-extrabold leading-tight text-[var(--foreground)]">
                  {label}
                </span>
                {description && (
                  <span className="mt-0.5 block text-xs font-medium leading-snug text-[#666]">
                    {description}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--foreground)] transition-transform duration-300 ease-out neo-border-sm",
                  open && "rotate-180",
                )}
              >
                <ChevronIcon />
              </span>
            </button>

            {action && (
              <div
                className="shrink-0 border-l-2 border-[var(--foreground)]/10 pl-3"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {action}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-in-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="border-t-2 border-[var(--foreground)] px-4 py-4 sm:px-5 sm:py-5"
              style={{ background: "#ffffff" }}
            >
              <div className="flex flex-col gap-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSectionStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>{children}</div>
  );
}
