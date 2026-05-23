"use client";

import { NeoBadge } from "@/components/ui/neo-badge";
import { NAV_ITEMS } from "@/lib/constants";
import { useRezume } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Settings,
};

export function AppSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { apiKey } = useRezume();

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col border-r-[3px] border-neo-ink bg-neo-blue text-white",
        "fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="border-b-[3px] border-neo-ink bg-neo-lime px-4 py-5 text-neo-ink">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <Sparkles className="h-6 w-6" strokeWidth={3} />
          <span className="text-2xl font-black tracking-tight">REZUME</span>
        </Link>
        <p className="mt-1 text-xs font-bold opacity-80">Job hunt command center</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg border-[3px] border-transparent px-3 py-2.5 font-bold transition-colors",
                active
                  ? "border-neo-ink bg-white text-neo-ink shadow-[3px_3px_0_0_#0a0a0a]"
                  : "hover:bg-white/20"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-[3px] border-neo-ink p-4">
        <p className="text-xs font-bold uppercase opacity-80">AI Provider</p>
        {apiKey?.verified ? (
          <NeoBadge className="mt-2 bg-neo-lime text-neo-ink">
            {apiKey.provider} connected
          </NeoBadge>
        ) : (
          <NeoBadge className="mt-2 bg-neo-orange text-neo-ink">Not connected</NeoBadge>
        )}
      </div>
    </aside>
  );
}
