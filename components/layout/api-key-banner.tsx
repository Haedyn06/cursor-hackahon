"use client";

import { NeoButton } from "@/components/ui/neo-button";
import { useRezume } from "@/lib/store";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function ApiKeyBanner() {
  const { apiKey, onboardingComplete } = useRezume();

  if (!onboardingComplete || apiKey?.verified) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-neo-ink bg-neo-orange px-4 py-3 md:px-8">
      <div className="flex items-center gap-2 text-sm font-bold">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>AI provider disconnected — reconnect to tailor resumes and cover letters.</span>
      </div>
      <Link href="/onboarding">
        <NeoButton size="sm" variant="primary">
          Reconnect AI
        </NeoButton>
      </Link>
    </div>
  );
}
