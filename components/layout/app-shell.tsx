"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

const NAV_ITEMS = [
  {
    id: "jobs",
    label: "Jobs",
    href: "/jobs",
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    id: "tracker",
    label: "Tracker",
    href: "/tracker",
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="9" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    id: "resumes",
    label: "Resume Builder",
    href: "/resumes",
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    svg: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 border-r-[2.5px] border-[var(--foreground)] bg-white py-4">
      <div className="mb-5">
        <Logo size="icon" href="/jobs" />
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            title={item.label}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-[var(--foreground)] transition-all",
              active
                ? "bg-[var(--mint)] neo-border-sm"
                : "border-2 border-transparent hover:bg-[var(--mint-l)]",
            )}
          >
            {item.svg}
          </Link>
        );
      })}
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  jobs: "Jobs",
  tracker: "Tracker",
  resumes: "Resume Builder",
  profile: "My Profile",
  settings: "Settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "jobs";
  const title = PAGE_TITLES[segment] ?? "Rezume";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b-[2.5px] border-[var(--foreground)] bg-white px-6">
          <div className="font-heading text-lg font-extrabold whitespace-nowrap">
            {title}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-[5px] font-sans text-[11px] font-bold text-[#888] transition-colors duration-150 hover:bg-[var(--background)]"
            >
              <span className="tracking-widest">···</span>
              Landing
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-[5px] font-sans text-[11px] font-bold text-[#888] transition-colors duration-150 hover:bg-[var(--background)]"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Onboarding
            </Link>
            <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--lav)] font-heading text-sm font-extrabold neo-border-sm">
              AJ
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
