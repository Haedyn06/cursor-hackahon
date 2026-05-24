"use client";

import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; icon?: string };

type NeoTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
};

export function NeoTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: NeoTabsProps) {
  return (
    <div className={cn("flex gap-1 pb-3", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 font-sans text-[13px] font-bold text-[var(--foreground)]",
              "transition-[background,border-color] duration-150 ease-in-out",
              isActive
                ? "border-[var(--foreground)] bg-[var(--mint)]"
                : "border-transparent bg-transparent hover:bg-[var(--mint-l)]",
            )}
          >
            {tab.icon && <span className="text-sm leading-none">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
