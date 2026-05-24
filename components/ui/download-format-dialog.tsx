"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { NeoButton } from "@/components/ui/neo-button";

export type DownloadFormat = "pdf" | "docx" | "txt";

const FORMATS: { id: DownloadFormat; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "docx", label: "DOCX" },
  { id: "txt", label: "TXT" },
];

type PickState = {
  title: string;
  itemName: string;
  resolve: (format: DownloadFormat | null) => void;
};

export function useDownloadFormat() {
  const [state, setState] = useState<PickState | null>(null);
  const pendingRef = useRef<((format: DownloadFormat | null) => void) | null>(null);

  const pickFormat = useCallback((itemName: string, title = "Choose download format") => {
    return new Promise<DownloadFormat | null>((resolve) => {
      pendingRef.current = resolve;
      setState({ title, itemName, resolve });
    });
  }, []);

  const close = useCallback((format: DownloadFormat | null) => {
    pendingRef.current?.(format);
    pendingRef.current = null;
    setState(null);
  }, []);

  const dialog: ReactNode = state ? (
    <>
      <div
        className="fixed inset-0 z-[300] bg-black/25"
        onClick={() => close(null)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-format-title"
        className="fixed top-1/2 left-1/2 z-[301] w-[400px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-6 neo-border"
      >
        <h2
          id="download-format-title"
          className="mb-1 font-heading text-[20px] font-extrabold"
        >
          {state.title}
        </h2>
        <p className="mb-5 text-sm font-medium text-[#666]">
          Select a format for <strong>{state.itemName}</strong>.
        </p>
        <div className="mb-5 flex gap-2">
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => close(format.id)}
              className="flex-1 cursor-pointer rounded-xl bg-[var(--background)] px-3 py-3 text-sm font-bold neo-border transition-colors duration-150 hover:bg-[var(--mint-l)]"
            >
              {format.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <NeoButton variant="secondary" size="sm" onClick={() => close(null)}>
            Cancel
          </NeoButton>
        </div>
      </div>
    </>
  ) : null;

  return { pickFormat, dialog };
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
