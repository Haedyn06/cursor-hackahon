"use client";

import type { ReactNode } from "react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
};

export function SlideOver({
  open,
  onClose,
  title,
  children,
  width = 420,
}: SlideOverProps) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/25"
          aria-hidden
        />
      )}
      <div
        className="fixed top-0 right-0 z-[101] flex h-screen flex-col overflow-y-auto bg-white transition-transform duration-250 ease-[cubic-bezier(.4,0,.2,1)] neo-border-sm"
        style={{
          width,
          borderLeft: "var(--neo-border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex items-center justify-between border-b-2 border-[var(--foreground)] px-6 py-5">
          <span className="font-heading text-lg font-extrabold">{title}</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--peach)] text-base font-bold neo-border-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </>
  );
}
