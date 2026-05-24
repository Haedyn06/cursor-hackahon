"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { API_PROVIDERS, OAUTH_PROVIDERS } from "@/lib/constants";
import { useToast } from "@/components/providers";
import { useJobs } from "@/components/providers/jobs-provider";
import { useResumeBuilderLibrary } from "@/components/providers/resume-builder-library-provider";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { verifyApiKey } from "@/lib/ai/client";
import { AI_PROVIDER_CONFIGS } from "@/lib/ai/providers";
import {
  clearAiSession,
  loadAiSession,
  maskApiKey,
  saveAiSession,
  type AiSession,
} from "@/lib/ai/session";
import type { ApiProviderId } from "@/lib/ai/types";
import { clearLocalAppData } from "@/lib/settings/client-data";

const PROVIDERS = API_PROVIDERS;

const NOTIFICATION_ITEMS = [
  {
    key: "resumeComplete" as const,
    label: "Resume generation complete",
    desc: "Get notified when your AI resume is ready",
  },
  {
    key: "applicationReminders" as const,
    label: "Application reminders",
    desc: "Reminders to follow up on applications",
  },
  {
    key: "weeklySummary" as const,
    label: "Weekly summary",
    desc: "A digest of your job hunt activity",
  },
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
  const router = useRouter();
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { refresh: refreshJobs } = useJobs();
  const { clearLibrary } = useResumeBuilderLibrary();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const notificationPreferences = useQuery(api.settings.getNotificationPreferences);
  const saveProviderConnections = useMutation(api.onboarding.saveProviderConnections);
  const disconnectProviderConnection = useMutation(api.onboarding.disconnectProviderConnection);
  const updateNotificationPreferences = useMutation(
    api.settings.updateNotificationPreferences,
  );
  const deleteAllResumeData = useMutation(api.settings.deleteAllResumeData);
  const deleteAccountMutation = useMutation(api.settings.deleteAccount);
  const [showProviderUI, setShowProviderUI] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(null);
  const [aiSession, setAiSession] = useState<AiSession | null>(() => loadAiSession());
  const [openProviderMenu, setOpenProviderMenu] = useState<string | null>(null);
  const [showDangerConfirm, setShowDangerConfirm] = useState<string | null>(null);
  const [dangerLoading, setDangerLoading] = useState(false);
  const syncedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onboardingState || !aiSession) return;

    const syncKey = `${aiSession.providerId}:${aiSession.verifiedAt}`;
    if (syncedSessionRef.current === syncKey) return;

    const hasMatchingConnection = onboardingState.providerConnections.some(
      (connection) =>
        connection.providerId === aiSession.providerId &&
        connection.connectionType === "apikey" &&
        connection.status === "connected",
    );

    if (hasMatchingConnection) {
      syncedSessionRef.current = syncKey;
      return;
    }

    const oauthConnections = onboardingState.providerConnections
      .filter(
        (connection) =>
          connection.connectionType === "oauth" && connection.status === "connected",
      )
      .map((connection) => ({
        providerId: connection.providerId,
        providerName: connection.providerName,
        connectionType: "oauth" as const,
        status: "connected" as const,
        lastVerifiedAt: connection.lastVerifiedAt,
      }));

    syncedSessionRef.current = syncKey;
    void saveProviderConnections({
      connections: [
        ...oauthConnections,
        {
          providerId: aiSession.providerId,
          providerName: AI_PROVIDER_CONFIGS[aiSession.providerId].name,
          connectionType: "apikey",
          status: "connected",
          lastVerifiedAt: Date.now(),
        },
      ],
    }).catch(() => {
      syncedSessionRef.current = null;
    });
  }, [aiSession, onboardingState, saveProviderConnections]);

  const connectedProviders = useMemo(() => {
    return (onboardingState?.providerConnections ?? [])
      .filter((connection) => connection.status === "connected")
      .map((connection) => {
        const providerMeta = [...PROVIDERS, ...OAUTH_PROVIDERS].find(
          (provider) => provider.id === connection.providerId,
        );

        return {
          id: connection.providerId,
          name: connection.providerName,
          model:
            connection.connectionType === "apikey"
              ? aiSession?.providerId === connection.providerId
                ? aiSession.model
                : "API key connected"
              : "OAuth connected",
          maskedKey:
            connection.connectionType === "apikey" &&
            aiSession?.providerId === connection.providerId
              ? maskApiKey(aiSession.apiKey)
              : connection.connectionType === "apikey"
                ? "Stored client-side"
                : "No API key required",
          color: providerMeta?.color ?? "var(--lav)",
        };
      });
  }, [onboardingState, aiSession]);

  const accountName = user?.fullName ?? onboardingState?.user?.name ?? "—";
  const accountEmail =
    user?.primaryEmailAddress?.emailAddress ?? onboardingState?.user?.email ?? "—";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : onboardingState?.user?.createdAt
      ? new Date(onboardingState.user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const handleNotificationToggle = async (
    key: (typeof NOTIFICATION_ITEMS)[number]["key"],
  ) => {
    if (!notificationPreferences) return;

    const nextValue = !notificationPreferences[key];
    try {
      await updateNotificationPreferences({ [key]: nextValue });
      toast("Notification preference saved.");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Could not update notification preference.",
        "error",
      );
    }
  };

  const handleDeleteResumeData = async () => {
    setDangerLoading(true);
    try {
      const result = await deleteAllResumeData({});
      clearLibrary();
      await refreshJobs();
      setShowDangerConfirm(null);
      toast(
        `Removed ${result.deletedJobs} job${result.deletedJobs === 1 ? "" : "s"} and ${result.deletedImportedResumes} imported resume${result.deletedImportedResumes === 1 ? "" : "s"}. Your profile was kept.`,
        "warn",
      );
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to delete resume data.",
        "error",
      );
    } finally {
      setDangerLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDangerLoading(true);
    try {
      await deleteAccountMutation({});
      clearLocalAppData();
      setShowDangerConfirm(null);

      if (user) {
        await user.delete();
      } else {
        await signOut();
      }

      router.push("/");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to delete account.",
        "error",
      );
    } finally {
      setDangerLoading(false);
    }
  };

  const handleDangerConfirm = async (action: string) => {
    if (action === "delete-resumes") {
      await handleDeleteResumeData();
      return;
    }
    if (action === "delete-account") {
      await handleDeleteAccount();
    }
  };

  const handleVerify = async (providerId: ApiProviderId) => {
    const apiKey = apiKeys[providerId]?.trim();
    if (!apiKey) return;

    setVerifyingProvider(providerId);
    try {
      const result = await verifyApiKey(providerId, apiKey);
      const session: AiSession = {
        providerId: result.providerId,
        apiKey,
        model: result.model,
        verifiedAt: new Date().toISOString(),
      };
      saveAiSession(session);
      setAiSession(session);
      setVerified({ [providerId]: true });

      const oauthConnections = (onboardingState?.providerConnections ?? [])
        .filter(
          (connection) =>
            connection.connectionType === "oauth" && connection.status === "connected",
        )
        .map((connection) => ({
          providerId: connection.providerId,
          providerName: connection.providerName,
          connectionType: "oauth" as const,
          status: "connected" as const,
          lastVerifiedAt: connection.lastVerifiedAt,
        }));

      await saveProviderConnections({
        connections: [
          ...oauthConnections,
          {
            providerId,
            providerName: AI_PROVIDER_CONFIGS[providerId].name,
            connectionType: "apikey",
            status: "connected",
            lastVerifiedAt: Date.now(),
          },
        ],
      });

      setShowProviderUI(false);
      toast(`${AI_PROVIDER_CONFIGS[providerId].name} connected!`);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not verify API key.",
        "error",
      );
    } finally {
      setVerifyingProvider(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    try {
      await disconnectProviderConnection({ providerId });
      if (aiSession?.providerId === providerId) {
        clearAiSession();
        setAiSession(null);
      }
      setApiKeys((current) => ({ ...current, [providerId]: "" }));
      setVerified((current) => ({ ...current, [providerId]: false }));
      setOpenProviderMenu(null);
      toast("Provider disconnected", "warn");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to disconnect provider.",
        "error",
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="mb-10 font-heading text-4xl font-extrabold tracking-tight">
          Settings
        </h1>

        <SettingsSection title="AI Provider">
          {connectedProviders.length > 0 ? (
            <div className="mb-4 space-y-3">
              {connectedProviders.map((provider) => (
                <NeoCard key={provider.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl font-heading text-base font-extrabold neo-border"
                        style={{ background: provider.color ?? "#ffffff" }}
                      >
                        {provider.name[0] ?? "?"}
                      </div>
                      <div>
                        <div className="text-base font-extrabold">{provider.name}</div>
                        <div className="mt-0.5 text-xs font-medium text-[#888]">
                          {provider.model}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-[#aaa]">
                          {provider.maskedKey}
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label={`Open ${provider.name} options`}
                        onClick={() =>
                          setOpenProviderMenu((current) =>
                            current === provider.id ? null : provider.id,
                          )
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-lg font-black neo-border-sm"
                      >
                        ⋯
                      </button>
                      {openProviderMenu === provider.id ? (
                        <div className="absolute top-11 right-0 z-10 min-w-[140px] rounded-[12px] bg-white p-1.5 neo-border">
                          <button
                            type="button"
                            onClick={() => void handleDisconnect(provider.id)}
                            className="w-full cursor-pointer rounded-[8px] border-none px-3 py-2 text-left text-sm font-bold text-[var(--red)] hover:bg-[var(--red-l)]"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </NeoCard>
              ))}
              <div className="flex gap-2">
                <NeoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowProviderUI(!showProviderUI)}
                >
                  Manage providers
                </NeoButton>
              </div>
            </div>
          ) : (
            <NeoCard className="mb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-base font-extrabold">No provider connected</div>
                  <div className="mt-1 text-xs font-medium text-[#888]">
                    Add an API key to enable AI features.
                  </div>
                </div>
                <NeoButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowProviderUI(true)}
                >
                  Connect provider
                </NeoButton>
              </div>
            </NeoCard>
          )}

          {(showProviderUI || connectedProviders.length === 0) && (
            <div className="mt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PROVIDERS.map((prov) => {
                    const isConnected = onboardingState?.providerConnections.some(
                      (connection) =>
                        connection.providerId === prov.id &&
                        connection.connectionType === "apikey" &&
                        connection.status === "connected",
                    );
                    const isExpanded = expandedProvider === prov.id;
                    const apiKey = apiKeys[prov.id] ?? "";
                    const isVerified = !!verified[prov.id];
                    const isVerifying = verifyingProvider === prov.id;
                    const keyUrl = AI_PROVIDER_CONFIGS[prov.id].keyUrl;

                    return (
                      <div
                        key={prov.id}
                        className="overflow-hidden rounded-[14px] transition-colors neo-border"
                        style={{
                          background: isConnected || isExpanded ? prov.color : "#ffffff",
                        }}
                      >
                        <div
                          onClick={() =>
                            !isConnected &&
                            setExpandedProvider(isExpanded ? null : prov.id)
                          }
                          className="cursor-pointer px-4 pt-4 pb-3"
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <span className="font-heading text-[15px] font-extrabold">
                              {prov.name}
                            </span>
                            {isConnected ? (
                              <NeoBadge color="var(--mint)" className="text-[10px]">
                                ✓ Connected
                              </NeoBadge>
                            ) : (
                              <NeoBadge color="#ffffff" className="text-[10px]">
                                {prov.badge}
                              </NeoBadge>
                            )}
                          </div>
                          <div className="text-xs text-[#666]">{prov.desc}</div>
                        </div>
                        {isExpanded && !isConnected && (
                          <div className="border-t-2 border-[var(--foreground)] px-4 pb-4">
                            <a
                              href={keyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="my-2 block text-[11px] font-bold"
                            >
                              Get API Key ↗
                            </a>
                            <NeoInput
                              placeholder={`Paste ${prov.name} API key...`}
                              value={apiKey}
                              onChange={(e) => {
                                setApiKeys((keys) => ({
                                  ...keys,
                                  [prov.id]: e.target.value,
                                }));
                                setVerified((state) => ({ ...state, [prov.id]: false }));
                              }}
                              type="password"
                              className="text-[13px]"
                            />
                            <div className="mt-2">
                              {isVerified ? (
                                <NeoBadge color="var(--mint)" className="px-3.5 py-1.5 text-xs">
                                  ✓ Connected!
                                </NeoBadge>
                              ) : (
                                <NeoButton
                                  variant="secondary"
                                  size="sm"
                                  disabled={isVerifying || !apiKey.trim()}
                                  onClick={() => handleVerify(prov.id)}
                                >
                                  {isVerifying ? "Verifying..." : "Verify key →"}
                                </NeoButton>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="Account">
          <NeoCard>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold">Full Name</label>
                <div className="rounded-full bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#666] neo-border-sm">
                  {accountName}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold">Email</label>
                <div className="rounded-full bg-[#f5f5f5] px-4 py-2.5 text-sm text-[#666] neo-border-sm">
                  {accountEmail}
                </div>
              </div>
            </div>
            {memberSince ? (
              <p className="mb-4 text-xs font-medium text-[#888]">
                Member since {memberSince}
              </p>
            ) : null}
            <p className="mb-4 text-xs text-[#888]">
              Name, email, and password are managed through your auth provider (Clerk).
            </p>
            <div className="flex flex-wrap gap-2">
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => openUserProfile?.()}
              >
                Manage account →
              </NeoButton>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => openUserProfile?.()}
              >
                Change password →
              </NeoButton>
            </div>
          </NeoCard>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <NeoCard>
            {NOTIFICATION_ITEMS.map((item, i, arr) => {
              const enabled = notificationPreferences?.[item.key] ?? false;
              return (
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
                  type="button"
                  aria-pressed={enabled}
                  disabled={!notificationPreferences}
                  onClick={() => void handleNotificationToggle(item.key)}
                  className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full neo-border-sm disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: enabled ? "var(--mint)" : "#dddddd" }}
                >
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white neo-border-sm transition-[left]"
                    style={{ left: enabled ? 22 : 2 }}
                  />
                </button>
              </div>
            );
            })}
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
                        disabled={dangerLoading}
                        onClick={() => void handleDangerConfirm(item.action)}
                      >
                        {dangerLoading ? "Deleting…" : "Confirm"}
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
