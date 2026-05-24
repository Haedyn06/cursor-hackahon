import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NeoCardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
};

export function NeoCard({
  children,
  className,
  onClick,
  onMouseLeave,
  style,
}: NeoCardProps) {
  return (
    <div
      onClick={onClick}
      onMouseLeave={onMouseLeave}
      className={cn(
        "rounded-2xl bg-white p-5 neo-border",
        onClick && "cursor-pointer",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
