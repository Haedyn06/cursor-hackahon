"use client";

import { useCallback, useState, type ReactNode } from "react";
import { NeoButton } from "@/components/ui/neo-button";

export type DownloadFormat = "pdf" | "docx" | "txt";

const FORMATS: { id: DownloadFormat; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "docx", label: "DOCX" },
  { id: "txt", label: "TXT" },
];

type DownloadRequest = {
  title: string;
  itemName: string;
  run: (format: DownloadFormat) => Promise<void>;
};

export function useDownloadFormat() {
  const [state, setState] = useState<DownloadRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestDownload = useCallback(
    (
      itemName: string,
      run: (format: DownloadFormat) => Promise<void>,
      title = "Choose download format",
    ) => {
      setError(null);
      setState({ title, itemName, run });
    },
    [],
  );

  const close = useCallback(() => {
    if (busy) return;
    setState(null);
    setError(null);
  }, [busy]);

  const handleSelect = useCallback(
    async (format: DownloadFormat) => {
      if (!state || busy) return;

      setBusy(true);
      setError(null);
      try {
        await state.run(format);
        setState(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Download failed. Try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, state],
  );

  const dialog: ReactNode = state ? (
    <>
      <div
        className="fixed inset-0 z-[300] bg-black/25"
        onClick={close}
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
        {error ? (
          <div className="mb-4 rounded-xl bg-[var(--red-l)] px-3 py-2 text-xs font-bold text-[#800] neo-border-sm">
            {error}
          </div>
        ) : null}
        <div className="mb-5 flex gap-2">
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              disabled={busy}
              onClick={() => void handleSelect(format.id)}
              className="flex-1 cursor-pointer rounded-xl bg-[var(--background)] px-3 py-3 text-sm font-bold neo-border transition-colors duration-150 hover:bg-[var(--mint-l)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "…" : format.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <NeoButton variant="secondary" size="sm" disabled={busy} onClick={close}>
            Cancel
          </NeoButton>
        </div>
      </div>
    </>
  ) : null;

  return { requestDownload, dialog };
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
