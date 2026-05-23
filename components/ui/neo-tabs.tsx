"use client";

import { cn } from "@/lib/utils";

export function NeoTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b-[3px] border-neo-ink pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "neo-btn px-4 py-2 text-sm",
            active === tab.id
              ? "bg-neo-lime"
              : "bg-white shadow-none hover:shadow-[3px_3px_0_0_#0a0a0a]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
