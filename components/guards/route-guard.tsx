"use client";

import { useRezume } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Ensures onboarding is done. API key is optional — reconnect via Settings or banner. */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { onboardingComplete } = useRezume();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [onboardingComplete, pathname, router]);

  if (!onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neo-bg dot-grid">
        <div className="neo-card px-8 py-6 font-bold">Redirecting to setup…</div>
      </div>
    );
  }

  return <>{children}</>;
}
