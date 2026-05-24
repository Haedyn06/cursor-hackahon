import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

const PROVIDER_LOGOS: Partial<Record<string, string>> = {
  openai: "/images/providers/openai.png",
  anthropic: "/images/providers/anthropic.png",
  gemini: "/images/providers/gemini.png",
  mistral: "/images/providers/mistral.png",
  together: "/images/providers/together.png",
};

/** Vertical key — circular bow on top, shaft, two teeth lower-right */
export function KeyIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="7" r="3.5" />
      <path d="M12 10.5v8.5" />
      <path d="M12 16h4" />
      <path d="M12 18.5h3" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

export function EnvelopeIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function MicrophoneIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

export type ProviderIconName =
  | "hexagon"
  | "layers"
  | "triangle"
  | "diamond"
  | "diamond-outline"
  | "nodes"
  | "brackets"
  | "infinity"
  | "arrow-up-right"
  | "waves"
  | "chevron-right";

const providerIconPaths: Record<ProviderIconName, ReactNode> = {
  hexagon: <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" />,
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
    </>
  ),
  triangle: <path d="M12 4l9 16H3L12 4z" />,
  diamond: <path d="M12 3l8 9-8 9-8-9 8-9z" />,
  "diamond-outline": <path d="M12 4l7 8-7 8-7-8 7-8z" />,
  nodes: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M8 7.5l4 8.5M16 7.5l-4 8.5" />
    </>
  ),
  brackets: (
    <>
      <path d="M8 6C5 6 4 8 4 12s1 6 4 6" />
      <path d="M16 6c3 0 4 2 4 6s-1 6-4 6" />
    </>
  ),
  infinity: <path d="M6 12c0-2.5 2-4 4-4s2 1.5 2 4-2 4-2 4 2 1.5 2 4 2 4-2 4-4-2-4-2-4 2-1.5 2-4z" />,
  "arrow-up-right": (
    <>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  waves: (
    <>
      <path d="M4 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M4 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </>
  ),
  "chevron-right": <path d="M8 6l8 6-8 6" />,
};

export function ProviderIcon({
  name,
  className,
}: {
  name: ProviderIconName;
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {providerIconPaths[name]}
    </svg>
  );
}

export function ProviderIconBadge({
  providerId,
  icon,
  color,
}: {
  providerId: string;
  icon?: ProviderIconName;
  color: string;
}) {
  const logoSrc = PROVIDER_LOGOS[providerId];

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg neo-border-sm"
      style={{ background: logoSrc ? "#ffffff" : color }}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] object-contain"
        />
      ) : icon ? (
        <ProviderIcon name={icon} className="h-[18px] w-[18px] text-[var(--foreground)]" />
      ) : null}
    </span>
  );
}
