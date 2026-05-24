"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { KeyIcon, LinkIcon, LockIcon } from "@/components/ui/provider-icons";

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
      <div className="mb-5 border-b-2.5 border-[var(--foreground)] pb-2.5 font-heading text-[20px] font-extrabold">
        {title}
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const toast = useToast();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [showProviderUI, setShowProviderUI] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"apikey" | "oauth">("apikey");
  const [apiKey, setApiKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDangerConfirm, setShowDangerConfirm] = useState<string | null>(null);
  const [oauthConnected, setOauthConnected] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    resumeComplete: true,
    applicationReminders: false,
    weeklySummary: true,
  });

  const notificationItems = [
    {
      id: "resumeComplete" as const,
      label: "Resume generation complete",
      desc: "Get notified when your AI resume is ready",
    },
    {
      id: "applicationReminders" as const,
      label: "Application reminders",
      desc: "Reminders to follow up on applications",
    },
    {
      id: "weeklySummary" as const,
      label: "Weekly summary",
      desc: "A digest of your job hunt activity",
    },
  ];

  const accountEmail =
    user?.primaryEmailAddress?.emailAddress ?? "alex@example.com";
  const maskedPassword = "••••••••••••";

  const handleChangeEmail = () => {
    if (openUserProfile) {
      openUserProfile();
      return;
    }
    toast("Redirecting to change email...");
  };

  const handleChangePassword = () => {
    if (openUserProfile) {
      openUserProfile();
      return;
    }
    toast("Redirecting to change password...");
  };

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
      <div className="mx-auto max-w-[640px] px-5 py-10">
        <h1 className="mb-10 font-heading text-5xl font-extrabold tracking-tight">
          Settings
        </h1>

        <SettingsSection title="AI Provider">
          <NeoCard className="mb-5">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-heading text-base font-extrabold neo-border"
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
              <div className="flex shrink-0 gap-2.5">
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
            <div className="mt-5">
              <div className="mb-5 flex w-fit overflow-hidden rounded-full neo-border">
                {(
                  [
                    ["apikey", "API Key", KeyIcon] as const,
                    ["oauth", "OAuth / SSO", LinkIcon] as const,
                  ] as const
                ).map(([v, label, Icon]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setProviderType(v);
                      setExpandedProvider(null);
                    }}
                    className="inline-flex cursor-pointer items-center gap-2.5 border-none px-5 py-2.5 font-sans text-[15px] font-bold"
                    style={{
                      background:
                        providerType === v ? "var(--foreground)" : "#ffffff",
                      color: providerType === v ? "#ffffff" : "var(--foreground)",
                    }}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>

              {providerType === "apikey" && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {PROVIDERS.map((prov) => {
                    const isExpanded = expandedProvider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        className="overflow-hidden rounded-[15px] transition-colors neo-border"
                        style={{
                          background: isExpanded ? prov.color : "#ffffff",
                        }}
                      >
                        <div
                          onClick={() =>
                            setExpandedProvider(isExpanded ? null : prov.id)
                          }
                          className="cursor-pointer px-5 pt-5 pb-2.5"
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <span className="font-heading text-[15px] font-extrabold">
                              {prov.name}
                            </span>
                            <NeoBadge color="#ffffff" className="text-[10px]">
                              {prov.badge}
                            </NeoBadge>
                          </div>
                          <div className="text-xs text-gray-500">{prov.desc}</div>
                        </div>
                        {isExpanded && (
                          <div className="border-t-2.5 border-[var(--foreground)] px-5 pb-5">
                            <a
                              href="#"
                              className="my-2 block text-[10px] font-bold"
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
                              className="text-[15px]"
                            />
                            <div className="mt-5">
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
                  <div className="mb-2.5 flex items-center gap-2.5 rounded-[10px] bg-[var(--lav-l)] px-3.5 py-2.5 text-xs font-medium text-[#555] neo-border-sm">
                    <LockIcon className="shrink-0" />
                    We never read your code or files — only the AI inference endpoint.
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {OAUTH.map((prov) => {
                      const connected = !!oauthConnected[prov.id];
                      const isExpanded = expandedProvider === prov.id;
                      return (
                        <div
                          key={prov.id}
                          className="overflow-hidden rounded-[15px] neo-border"
                          style={{
                            background: connected || isExpanded ? prov.color : "#ffffff",
                          }}
                        >
                          <div
                            onClick={() =>
                              !connected &&
                              setExpandedProvider(isExpanded ? null : prov.id)
                            }
                            className="cursor-pointer px-5 pt-5 pb-2.5"
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
                            <div className="border-t-2.5 border-[var(--foreground)] px-5 pb-5">
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
            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold">Email</label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
                  <div className="flex min-h-[42px] items-center rounded-full bg-[#f5f5f5] px-5 py-2.5 text-sm text-[#444] neo-border-sm">
                    <span className="truncate">{accountEmail}</span>
                  </div>
                  <NeoButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center sm:w-[12rem]"
                    onClick={handleChangeEmail}
                  >
                    Change email →
                  </NeoButton>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold">Password</label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
                  <div className="relative min-w-0">
                    <div className="flex min-h-[40px] items-center rounded-full bg-[#f5f5f5] py-2.5 pr-10 pl-5 text-sm text-[#444] neo-border-sm">
                      {showPassword ? (
                        <span className="truncate font-medium text-gray-500">
                          Secured by Clerk — not shown for safety
                        </span>
                      ) : (
                        <span className="font-mono">{maskedPassword}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "View password"}
                      className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white text-[var(--foreground)] neo-border-sm transition-transform hover:scale-105"
                    >
                      {showPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <NeoButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center sm:w-[12rem]"
                    onClick={handleChangePassword}
                  >
                    Change password →
                  </NeoButton>
                </div>
              </div>

              <p className="text-xs text-[#888]">
                Email and password are managed through your auth provider (Clerk).
                Update your full name on the Profile page.
              </p>
            </div>
          </NeoCard>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <NeoCard>
            {notificationItems.map((item, i, arr) => {
              const on = notifications[item.id];
              return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5"
                style={{
                  borderBottom:
                    i < arr.length - 1
                      ? "2.5px solid var(--foreground)"
                      : undefined,
                }}
              >
                <div>
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className="mt-0.5 text-xs text-[#888]">{item.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={item.label}
                  onClick={() => {
                    setNotifications((prev) => ({
                      ...prev,
                      [item.id]: !prev[item.id],
                    }));
                    toast("Preference updated");
                  }}
                  className="relative h-5 w-15 shrink-0 cursor-pointer rounded-full neo-border-sm"
                  style={{ background: on ? "var(--mint)" : "#dddddd" }}
                >
                  <div
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white neo-border-sm transition-[left] duration-200"
                    style={{ left: on ? 22 : 2 }}
                  />
                </button>
              </div>
            );
            })}
          </NeoCard>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <NeoCard className="bg-[var(--red-l)]">
            <div className="flex flex-col gap-5">
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
