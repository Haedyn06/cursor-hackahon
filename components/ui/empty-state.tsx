import { NeoButton } from "@/components/ui/neo-button";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  const action = actionLabel && (
    actionHref ? (
      <Link href={actionHref}>
        <NeoButton variant="primary">{actionLabel}</NeoButton>
      </Link>
    ) : (
      <NeoButton variant="primary" onClick={onAction}>
        {actionLabel}
      </NeoButton>
    )
  );

  return (
    <div className="neo-card flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-neo-ink bg-neo-blue text-white">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm font-medium opacity-80">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingAI({ label }: { label: string }) {
  return (
    <div className="neo-card-flat flex items-center gap-3 border-dashed p-4">
      <div className="ai-loading flex gap-1">
        <span className="h-2 w-2 rounded-full bg-neo-ink" />
        <span className="h-2 w-2 rounded-full bg-neo-ink" />
        <span className="h-2 w-2 rounded-full bg-neo-ink" />
      </div>
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-neo-ink bg-neo-pink/30 p-4 font-bold">
      <span>{message}</span>
      {onRetry && (
        <NeoButton size="sm" onClick={onRetry}>
          Retry
        </NeoButton>
      )}
    </div>
  );
}
