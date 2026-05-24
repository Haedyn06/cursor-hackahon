"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RezumeLogo } from "@/components/layout/rezume-logo";

const SIDEBAR_EXPANDED_KEY = "rezume_sidebar_expanded";

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

function useSidebarExpanded() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
    return stored !== "false";
  });

  const toggle = () => {
    setExpanded((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(next));
      return next;
    });
  };

  return { expanded, toggle };
}

export function AppSidebar() {
  const pathname = usePathname();
  const { expanded, toggle } = useSidebarExpanded();

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "flex shrink-0 flex-col border-r-[2.5px] border-[var(--foreground)] bg-white py-4 transition-[width] duration-200 ease-out",
        expanded ? "w-[220px]" : "w-16",
      )}
    >
      <div className={cn("mb-5 px-3", !expanded && "px-0")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex w-full cursor-pointer items-center rounded-xl border-none bg-transparent text-[var(--foreground)] transition-colors hover:bg-[var(--mint-l)]",
            expanded ? "gap-2.5 px-2 py-2" : "justify-center px-0 py-1",
          )}
        >
          <RezumeLogo
            className="shrink-0"
            style={{ width: 36, height: 36 }}
          />
          <span
            className={cn(
              "overflow-hidden font-heading text-[22px] font-extrabold tracking-tight whitespace-nowrap transition-[opacity,width] duration-200",
              expanded ? "w-auto opacity-100" : "w-0 opacity-0",
            )}
          >
            Rezume
          </span>
        </button>
      </div>

      <nav
        className={cn(
          "flex flex-col gap-1.5",
          expanded ? "px-3" : "items-center px-0",
        )}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={expanded ? undefined : item.label}
              className={cn(
                "flex items-center rounded-xl text-[var(--foreground)] transition-all",
                expanded
                  ? "h-11 gap-3 px-3"
                  : "h-11 w-11 justify-center",
                active
                  ? "bg-[var(--mint)] neo-border-sm"
                  : "border-2 border-transparent hover:bg-[var(--mint-l)]",
              )}
            >
              <span className="shrink-0">{item.svg}</span>
              <span
                className={cn(
                  "overflow-hidden text-sm font-bold whitespace-nowrap transition-[opacity,width] duration-200",
                  expanded ? "w-auto opacity-100" : "w-0 opacity-0",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const PAGE_TITLES: Record<string, string> = {
  jobs: "Jobs",
  tracker: "Tracker",
  resumes: "Resume Builder",
  profile: "My Profile",
  settings: "Settings",
};

function UserMenu() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="Settings"
          href="/settings"
          labelIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}

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
            <UserMenu />
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
