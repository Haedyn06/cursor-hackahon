import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="mb-2 text-[32px]">{icon}</div>
      <div className="mb-1 text-sm font-bold">{title}</div>
      {description && (
        <div className="mb-4 text-xs text-[#888]">{description}</div>
      )}
      {action}
    </div>
  );
}
