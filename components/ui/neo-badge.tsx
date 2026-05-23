import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function NeoBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border-2 border-neo-ink px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}
