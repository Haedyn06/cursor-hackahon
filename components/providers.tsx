"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ToastType } from "@/lib/types";

type Toast = { id: number; msg: string; type: ToastType };

const ToastContext = createContext<((msg: string, type?: ToastType) => void) | null>(
  null,
);

export function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-up flex items-center gap-2 rounded-xl px-[18px] py-2.5 text-[13px] font-bold neo-border"
            style={{
              background:
                t.type === "error"
                  ? "var(--red)"
                  : t.type === "warn"
                    ? "var(--yellow)"
                    : "var(--mint)",
            }}
          >
            {t.type === "error" ? "✕" : "✓"} {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within Providers");
  return ctx;
}
