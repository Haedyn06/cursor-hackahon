import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function NeoCard({
  children,
  className,
  flat,
}: {
  children: ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return (
    <div className={cn(flat ? "neo-card-flat" : "neo-card", "p-5", className)}>
      {children}
    </div>
  );
}
