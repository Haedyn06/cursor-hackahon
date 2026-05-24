"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  fallbackRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
};

export function AuthModal({
  open,
  onClose,
  fallbackRedirectUrl,
  signUpFallbackRedirectUrl,
}: AuthModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4 py-8">
      <button
        type="button"
        aria-label="Close sign in modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-[121] w-full max-w-[430px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in modal"
          className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--lav-l)] text-xl font-bold text-[var(--foreground)] neo-border-sm"
        >
          ✕
        </button>

        <SignIn
          routing="hash"
          fallbackRedirectUrl={fallbackRedirectUrl}
          signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none",
              socialButtonsBlockButton:
                "h-12 rounded-2xl border-2 border-[#1a1a1a] bg-white text-[var(--foreground)] shadow-none font-bold hover:bg-[var(--yellow-l)]",
              socialButtonsBlockButtonText: "font-bold text-[15px]",
              dividerLine: "bg-[#d9d9d9]",
              dividerText: "text-[#888] text-sm font-semibold",
              formFieldLabel: "text-[13px] font-bold text-[var(--foreground)]",
              formFieldInput:
                "h-12 rounded-2xl border-2 border-[#1a1a1a] bg-white text-sm text-[var(--foreground)] shadow-none focus:ring-0 focus:border-[#1a1a1a]",
              formButtonPrimary:
                "h-12 rounded-2xl border-2 border-[#1a1a1a] bg-[var(--foreground)] text-white shadow-none font-bold hover:bg-[#303030]",
              footerActionLink: "text-[var(--foreground)] font-bold",
              identityPreviewText: "text-[var(--foreground)]",
              formResendCodeLink: "text-[var(--foreground)] font-bold",
              otpCodeFieldInput:
                "h-12 w-12 rounded-2xl border-2 border-[#1a1a1a] bg-white text-[var(--foreground)] shadow-none",
              alertText: "text-sm",
              formFieldErrorText: "text-[#c43d3d] text-xs font-semibold",
            },
          }}
        />
      </div>
    </div>
  );
}
