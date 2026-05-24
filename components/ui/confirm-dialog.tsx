"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { NeoButton } from "@/components/ui/neo-button";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const pendingRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current = resolve;
      setState({ ...options, resolve });
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    pendingRef.current?.(confirmed);
    pendingRef.current = null;
    setState(null);
  }, []);

  const dialog: ReactNode = state ? (
    <>
      <div
        className="fixed inset-0 z-[300] bg-black/25"
        onClick={() => close(false)}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="fixed top-1/2 left-1/2 z-[301] w-[420px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-6 neo-border"
      >
        <h2
          id="confirm-dialog-title"
          className="mb-2 font-heading text-[20px] font-extrabold"
        >
          {state.title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mb-5 text-sm font-medium leading-relaxed text-[#666]"
        >
          {state.message}
        </p>
        <div className="flex justify-end gap-2.5">
          <NeoButton variant="secondary" size="sm" onClick={() => close(false)}>
            {state.cancelLabel ?? "Cancel"}
          </NeoButton>
          <NeoButton variant="danger" size="sm" onClick={() => close(true)}>
            {state.confirmLabel ?? "Remove"}
          </NeoButton>
        </div>
      </div>
    </>
  ) : null;

  return { confirm, dialog };
}
