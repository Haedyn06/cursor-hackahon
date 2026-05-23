"use client";

import { NeoButton } from "@/components/ui/neo-button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function SlideOver({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel backdrop"
        className="absolute inset-0 bg-neo-ink/40"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative flex h-full w-full flex-col border-l-[3px] border-neo-ink bg-neo-bg shadow-[-8px_0_0_0_#0a0a0a]",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <header className="flex items-center justify-between border-b-[3px] border-neo-ink bg-neo-lime px-5 py-4">
          <h2 className="text-xl font-black uppercase">{title}</h2>
          <NeoButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </NeoButton>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
