import { cn } from "@/lib/utils";
import type { ReactNode, CSSProperties } from "react";

type NeoBadgeProps = {
  children: ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
};

export function NeoBadge({
  children,
  color = "#ffffff",
  className,
  onClick,
  style,
}: NeoBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[11px] py-[3px] text-xs font-bold text-[var(--foreground)] neo-border-sm",
        onClick && "cursor-pointer",
        className,
      )}
      style={{ background: color, ...style }}
    >
      {children}
    </span>
  );
}
