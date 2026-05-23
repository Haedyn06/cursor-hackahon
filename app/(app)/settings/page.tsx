"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoInput, NeoLabel } from "@/components/ui/neo-input";
import { PROVIDERS } from "@/lib/constants";
import { verifyApiKey } from "@/lib/mock-ai";
import { useRezume } from "@/lib/store";
import type { AIProvider } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey } = useRezume();
  const [provider, setProvider] = useState<AIProvider | null>(apiKey?.provider ?? null);
  const [key, setKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (!provider || !key.trim()) return;
    setVerifying(true);
    setError(null);
    const ok = await verifyApiKey(key);
    setVerifying(false);
    if (ok) {
      setApiKey(provider, key, true);
      setKey("");
    } else {
      setError("Invalid API key.");
    }
  };

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <NeoCard>
          <h2 className="text-lg font-black uppercase">AI provider</h2>
          <p className="mt-1 text-sm font-medium">
            Keys are encrypted client-side (AES-GCM demo) before storage. Decrypted only
            in-browser for API calls.
          </p>

          {apiKey?.verified && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <NeoBadge className="bg-neo-lime capitalize">{apiKey.provider}</NeoBadge>
              <span className="font-mono text-sm">{apiKey.maskedKey}</span>
              <NeoButton
                variant="danger"
                size="sm"
                onClick={() => {
                  clearApiKey();
                }}
              >
                Disconnect
              </NeoButton>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={cn(
                  "rounded-lg border-[3px] border-neo-ink px-3 py-2 text-left font-bold",
                  provider === p.id ? "bg-neo-blue text-white" : "bg-white"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>

          {!apiKey?.verified && (
            <p className="mt-4 rounded-md border-2 border-neo-orange bg-neo-orange/20 p-3 text-sm font-bold">
              No AI provider connected. Pick a provider below and verify your key.
            </p>
          )}

          {provider && (
            <div className="mt-4 space-y-3">
              <a
                href={PROVIDERS.find((p) => p.id === provider)?.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold text-neo-blue underline"
              >
                Get API key <ExternalLink className="h-3 w-3" />
              </a>
              <NeoLabel htmlFor="new-key">
                {apiKey ? "Enter new key to update" : "API key"}
              </NeoLabel>
              <NeoInput
                id="new-key"
                type="password"
                placeholder="••••••••"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              {error && <ErrorBanner message={error} onRetry={verify} />}
              <NeoButton variant="primary" onClick={verify} disabled={verifying}>
                {verifying ? "Verifying…" : "Save & verify"}
              </NeoButton>
            </div>
          )}
        </NeoCard>

        <NeoCard>
          <h2 className="text-lg font-black uppercase">Account</h2>
          <p className="mt-2 text-sm font-medium">
            Clerk authentication will appear here in production. Demo uses local session
            state.
          </p>
          <div className="mt-4 rounded-lg border-2 border-dashed border-neo-ink bg-neo-bg p-4">
            <p className="font-bold">alex.chen@demo.rezume.app</p>
            <p className="text-sm opacity-70">Signed in (demo)</p>
          </div>
        </NeoCard>
      </div>
    </AppShell>
  );
}
