"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";

type PromptState = {
  title: string;
  message?: string;
  label: string;
  value: string;
  confirmLabel?: string;
  resolve: (value: string | null) => void;
};

export function useRenamePrompt() {
  const [state, setState] = useState<PromptState | null>(null);
  const pendingRef = useRef<((value: string | null) => void) | null>(null);

  const promptRename = useCallback(
    (options: {
      title?: string;
      message?: string;
      label?: string;
      defaultValue: string;
      confirmLabel?: string;
    }) => {
      return new Promise<string | null>((resolve) => {
        pendingRef.current = resolve;
        setState({
          title: options.title ?? "Rename",
          message: options.message,
          label: options.label ?? "Name",
          value: options.defaultValue,
          confirmLabel: options.confirmLabel ?? "Save",
          resolve,
        });
      });
    },
    [],
  );

  const close = useCallback((value: string | null) => {
    pendingRef.current?.(value);
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
        aria-labelledby="prompt-dialog-title"
        className="fixed top-1/2 left-1/2 z-[301] w-[420px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-6 neo-border"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const trimmed = state.value.trim();
            close(trimmed || null);
          }
        }}
      >
        <h2
          id="prompt-dialog-title"
          className="mb-1 font-heading text-[20px] font-extrabold"
        >
          {state.title}
        </h2>
        {state.message && (
          <p className="mb-4 text-sm font-medium leading-relaxed text-[#666]">
            {state.message}
          </p>
        )}
        <NeoInput
          label={state.label}
          value={state.value}
          onChange={(e) =>
            setState((prev) =>
              prev ? { ...prev, value: e.target.value } : prev,
            )
          }
        />
        <div className="mt-5 flex justify-end gap-2.5">
          <NeoButton variant="secondary" size="sm" onClick={() => close(null)}>
            Cancel
          </NeoButton>
          <NeoButton
            variant="mint"
            size="sm"
            onClick={() => {
              const trimmed = state.value.trim();
              close(trimmed || null);
            }}
          >
            {state.confirmLabel}
          </NeoButton>
        </div>
      </div>
    </>
  ) : null;

  return { promptRename, dialog };
}
