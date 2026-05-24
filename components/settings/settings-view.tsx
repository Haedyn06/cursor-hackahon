"use client";

import { useState } from "react";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", desc: "GPT-4o & o1", badge: "Pay-as-you-go", color: "var(--mint)" },
  { id: "anthropic", name: "Anthropic", desc: "Claude 3.5 Sonnet", badge: "Free tier", color: "var(--lav)" },
  { id: "groq", name: "Groq", desc: "Llama 3.3 — ultra fast", badge: "Free tier", color: "var(--peach)" },
  { id: "gemini", name: "Gemini", desc: "Gemini 1.5 Pro", badge: "Free tier", color: "var(--yellow)" },
];

const OAUTH = [
  { id: "copilot", name: "GitHub Copilot", desc: "GPT-4o via GitHub", badge: "OAuth", color: "var(--mint)" },
  { id: "cursor", name: "Cursor", desc: "Cursor IDE AI models", badge: "OAuth", color: "var(--yellow)" },
];

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="mb-5 border-b-2 border-[var(--foreground)] pb-3 font-heading text-[22px] font-extrabold">
        {title}
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const toast = useToast();
  const [showProviderUI, setShowProviderUI] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"apikey" | "oauth">("apikey");
  const [apiKey, setApiKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDangerConfirm, setShowDangerConfirm] = useState<string | null>(null);
  const [oauthConnected, setOauthConnected] = useState<Record<string, boolean>>({});

  const currentProvider = {
    name: "Anthropic",
    model: "claude-3-5-sonnet-20241022",
    maskedKey: "sk-ant-••••••••••••••••••XK4D",
    color: "var(--lav)",
  };

  const handleVerify = () => {
    if (!apiKey.trim()) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="mb-10 font-heading text-4xl font-extrabold tracking-tight">
          Settings
        </h1>

        <SettingsSection title="AI Provider">
          <NeoCard className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl font-heading text-base font-extrabold neo-border"
                  style={{ background: currentProvider.color }}
                >
                  {currentProvider.name[0]}
                </div>
                <div>
                  <div className="text-base font-extrabold">{currentProvider.name}</div>
                  <div className="mt-0.5 text-xs font-medium text-[#888]">
                    {currentProvider.model}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-[#aaa]">
                    {currentProvider.maskedKey}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <NeoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowProviderUI(!showProviderUI)}
                >
                  Change provider
                </NeoButton>
                <NeoButton
                  variant="danger"
                  size="sm"
                  onClick={() => toast("Provider disconnected", "warn")}
                >
                  Disconnect
                </NeoButton>
              </div>
            </div>
          </NeoCard>

          {showProviderUI && (
            <div className="mt-4">
              <div className="mb-4 flex w-fit overflow-hidden rounded-full neo-border">
                {(
                  [
                    ["apikey", "🔑  API Key"],
                    ["oauth", "🔗  OAuth / SSO"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setProviderType(v);
                      setExpandedProvider(null);
                    }}
                    className="cursor-pointer border-none px-5 py-2 font-sans text-[13px] font-bold"
                    style={{
                      background:
                        providerType === v ? "var(--foreground)" : "#ffffff",
                      color: providerType === v ? "#ffffff" : "var(--foreground)",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {providerType === "apikey" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {PROVIDERS.map((prov) => {
                    const isExpanded = expandedProvider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        className="overflow-hidden rounded-[14px] transition-colors neo-border"
                        style={{
                          background: isExpanded ? prov.color : "#ffffff",
                        }}
                      >
                        <div
                          onClick={() =>
                            setExpandedProvider(isExpanded ? null : prov.id)
                          }
                          className="cursor-pointer px-4 pt-4 pb-3"
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <span className="font-heading text-[15px] font-extrabold">
                              {prov.name}
                            </span>
                            <NeoBadge color="#ffffff" className="text-[10px]">
                              {prov.badge}
                            </NeoBadge>
                          </div>
                          <div className="text-xs text-[#666]">{prov.desc}</div>
                        </div>
                        {isExpanded && (
                          <div className="border-t-2 border-[var(--foreground)] px-4 pb-4">
                            <a
                              href="#"
                              className="my-2 block text-[11px] font-bold"
                            >
                              Get API Key ↗
                            </a>
                            <NeoInput
                              placeholder={`Paste ${prov.name} API key...`}
                              value={apiKey}
                              onChange={(e) => {
                                setApiKey(e.target.value);
                                setVerified(false);
                              }}
                              type="password"
                              className="text-[13px]"
                            />
                            <div className="mt-2">
                              {verified ? (
                                <NeoBadge color="var(--mint)" className="px-3.5 py-1.5 text-xs">
                                  ✓ Connected!
                                </NeoBadge>
                              ) : (
                                <NeoButton
                                  variant="secondary"
                                  size="sm"
                                  disabled={verifying || !apiKey.trim()}
                                  onClick={handleVerify}
                                >
                                  {verifying ? "Verifying..." : "Verify key →"}
                                </NeoButton>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {providerType === "oauth" && (
                <>
                  <div className="mb-3 rounded-[10px] bg-[var(--lav-l)] px-3.5 py-2 text-xs font-medium text-[#555] neo-border-sm">
                    🔒 We never read your code or files — only the AI inference endpoint.
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {OAUTH.map((prov) => {
                      const connected = !!oauthConnected[prov.id];
                      const isExpanded = expandedProvider === prov.id;
                      return (
                        <div
                          key={prov.id}
                          className="overflow-hidden rounded-[14px] neo-border"
                          style={{
                            background: connected || isExpanded ? prov.color : "#ffffff",
                          }}
                        >
                          <div
                            onClick={() =>
                              !connected &&
                              setExpandedProvider(isExpanded ? null : prov.id)
                            }
                            className="cursor-pointer px-4 pt-4 pb-3"
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <span className="font-heading text-[15px] font-extrabold">
                                {prov.name}
                              </span>
                              {connected ? (
                                <NeoBadge color="var(--mint)" className="text-[10px]">
                                  ✓ Connected
                                </NeoBadge>
                              ) : (
                                <NeoBadge color="#ffffff" className="text-[10px]">
                                  {prov.badge}
                                </NeoBadge>
                              )}
                            </div>
                            <div className="text-xs text-[#555]">{prov.desc}</div>
                          </div>
                          {isExpanded && !connected && (
                            <div className="border-t-2 border-[var(--foreground)] px-4 pb-4">
                              <NeoButton
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setOauthConnected((p) => ({ ...p, [prov.id]: true }));
                                  toast(`Connected to ${prov.name}!`);
                                  setShowProviderUI(false);
                                }}
                              >
                                Connect with {prov.name} →
                              </NeoButton>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="Account">
          <NeoCard>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold">Full Name</label>
                <div className="rounded-full bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#666] neo-border-sm">
                  Alex Johnson
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold">Email</label>
                <div className="rounded-full bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#666] neo-border-sm">
                  alex@example.com
                </div>
              </div>
            </div>
            <p className="mb-4 text-xs text-[#888]">
              Name and email are managed through your auth provider (Clerk).
            </p>
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => toast("Redirecting to change password...")}
            >
              Change password →
            </NeoButton>
          </NeoCard>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <NeoCard>
            {[
              {
                label: "Resume generation complete",
                desc: "Get notified when your AI resume is ready",
                on: true,
              },
              {
                label: "Application reminders",
                desc: "Reminders to follow up on applications",
                on: false,
              },
              {
                label: "Weekly summary",
                desc: "A digest of your job hunt activity",
                on: true,
              },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom:
                    i < arr.length - 1
                      ? "2px solid var(--foreground)"
                      : undefined,
                }}
              >
                <div>
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className="mt-0.5 text-xs text-[#888]">{item.desc}</div>
                </div>
                <button
                  onClick={() => toast("Preference updated")}
                  className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full neo-border-sm"
                  style={{ background: item.on ? "var(--mint)" : "#dddddd" }}
                >
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white neo-border-sm transition-[left]"
                    style={{ left: item.on ? 22 : 2 }}
                  />
                </button>
              </div>
            ))}
          </NeoCard>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <NeoCard className="bg-[var(--red-l)]">
            <div className="flex flex-col gap-4">
              {[
                {
                  label: "Delete all resume data",
                  desc: "Removes all generated resumes and job applications. Profile is kept.",
                  action: "delete-resumes",
                },
                {
                  label: "Delete account",
                  desc: "Permanently deletes your account and all associated data.",
                  action: "delete-account",
                },
              ].map((item) => (
                <div
                  key={item.action}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="mt-0.5 text-xs text-[#666]">{item.desc}</div>
                  </div>
                  {showDangerConfirm === item.action ? (
                    <div className="flex shrink-0 gap-1.5">
                      <NeoButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDangerConfirm(null)}
                      >
                        Cancel
                      </NeoButton>
                      <NeoButton
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setShowDangerConfirm(null);
                          toast("Deleted.", "error");
                        }}
                      >
                        Confirm
                      </NeoButton>
                    </div>
                  ) : (
                    <NeoButton
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDangerConfirm(item.action)}
                    >
                      Delete →
                    </NeoButton>
                  )}
                </div>
              ))}
            </div>
          </NeoCard>
        </SettingsSection>
      </div>
    </div>
  );
}
