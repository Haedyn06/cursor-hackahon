"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/layout/logo";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  CollapsibleSection,
  ProfileFormEntry,
  ProfileSectionStack,
} from "@/components/ui/collapsible-section";
import { useToast } from "@/components/providers";
import { API_PROVIDERS, OAUTH_PROVIDERS } from "@/lib/constants";
import { verifyApiKey, autofillProfileFromDocuments } from "@/lib/ai/client";
import { getProviderConfig } from "@/lib/ai/providers";
import { loadAiSession, saveAiSession } from "@/lib/ai/session";
import {
  mockAiResumeName,
  persistOnboardingCompletion,
} from "@/lib/onboarding-storage";
import type { OnboardingResume } from "@/lib/mock-data";

type ResumeItem = {
  id: number;
  storageId?: string;
  file: string;
  aiName: string;
  naming: boolean;
  mimeType?: string;
  sizeBytes?: number;
  sourceType: "upload" | "paste";
  status: "pending" | "imported" | "parsed" | "failed";
};

function toResumeDisplayName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function makeResumeItem(partial: Omit<ResumeItem, "id">): ResumeItem {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    ...partial,
  };
}

async function uploadResumeFile(uploadUrl: string, file: File) {
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!result.ok) {
    throw new Error("Upload failed");
  }

  const { storageId } = await result.json();
  return storageId as string;
}

function ApiKeyCard({
  prov,
  expanded,
  onExpand,
  apiKey,
  setApiKey,
  verified,
  onVerify,
}: {
  prov: (typeof API_PROVIDERS)[number];
  expanded: boolean;
  onExpand: () => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  verified: boolean;
  onVerify: () => void;
}) {
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const keyUrl = getProviderConfig(prov.id).keyUrl;

  const handleVerify = async () => {
    if (!apiKey.trim()) return;
    setVerifying(true);
    try {
      const result = await verifyApiKey(prov.id, apiKey.trim());
      saveAiSession({
        providerId: result.providerId,
        apiKey: apiKey.trim(),
        model: result.model,
        verifiedAt: new Date().toISOString(),
      });
      toast(`${prov.name} connected!`);
      onVerify();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not verify API key.",
        "error",
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="overflow-hidden rounded-2xl transition-colors neo-border"
      style={{ background: expanded ? prov.color : "#ffffff" }}
    >
      <div onClick={onExpand} className="cursor-pointer px-[18px] pt-[18px] pb-3.5">
        <div className="mb-1.5 flex items-start gap-2">
          <span className="shrink-0 font-mono text-lg font-extrabold leading-snug">
            {prov.icon}
          </span>
          <div className="min-w-0">
            <div className="mb-1 font-heading text-sm font-extrabold leading-tight">
              {prov.name}
            </div>
            <NeoBadge color="#ffffff" className="text-[10px]">
              {prov.badge}
            </NeoBadge>
          </div>
        </div>
        <div className="pl-[26px] text-xs font-medium text-[#555]">{prov.desc}</div>
      </div>
      {expanded && (
        <div className="border-t-2 border-[var(--foreground)] px-[18px] pb-[18px]">
          <a
            href={keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="my-2.5 flex items-center gap-1 text-xs font-bold text-[var(--foreground)]"
          >
            Get API Key ↗
          </a>
          <NeoInput
            placeholder={`Paste your ${prov.name} API key...`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
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
}

function OAuthCard({
  prov,
  expanded,
  onExpand,
  connected,
  onConnect,
}: {
  prov: (typeof OAUTH_PROVIDERS)[number];
  expanded: boolean;
  onExpand: () => void;
  connected: boolean;
  onConnect: () => void;
}) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onConnect();
    }, 1800);
  };

  return (
    <div
      className="overflow-hidden rounded-2xl transition-colors neo-border"
      style={{ background: expanded ? prov.color : "#ffffff" }}
    >
      <div onClick={onExpand} className="cursor-pointer px-[18px] pt-[18px] pb-3.5">
        <div className="mb-1.5 flex items-start gap-2">
          <span className="shrink-0 font-mono text-lg font-extrabold leading-snug">
            {prov.icon}
          </span>
          <div className="min-w-0">
            <div className="mb-1 font-heading text-sm font-extrabold leading-tight">
              {prov.name}
            </div>
            <NeoBadge
              color={prov.badge.includes("New") ? "var(--peach)" : "#ffffff"}
              className="text-[10px]"
            >
              {prov.badge}
            </NeoBadge>
          </div>
        </div>
        <div className="pl-[26px] text-xs font-medium text-[#555]">{prov.desc}</div>
      </div>
      {expanded && (
        <div className="border-t-2 border-[var(--foreground)] px-[18px] pb-[18px]">
          <p className="my-3 text-xs leading-relaxed font-medium text-[#666]">
            No API key needed — connect via OAuth. We only request permission to use the AI model endpoint.
          </p>
          {connected ? (
            <NeoBadge color="var(--mint)" className="px-3.5 py-1.5 text-xs">
              ✓ Connected to {prov.name}!
            </NeoBadge>
          ) : (
            <NeoButton
              variant="secondary"
              size="sm"
              disabled={connecting}
              onClick={handleConnect}
            >
              {connecting ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 animate-spin-slow rounded-full border-2 border-[#aaa] border-t-[var(--foreground)]" />
                  Connecting...
                </span>
              ) : (
                `Connect with ${prov.name} →`
              )}
            </NeoButton>
          )}
        </div>
      )}
    </div>
  );
}

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Professional",
  "Conversational",
  "Basic",
];

const defaultProfile = {
  name: "",
  location: "",
  email: "",
  phone: "",
  links: [{ id: 1, name: "", url: "" }],
  linkedin: "",
  github: "",
  portfolio: "",
  targetRole: "",
  experience: "",
  about: "",
  skills: [] as string[],
  languages: [{ id: 1, name: "", level: "Conversational" }],
  certifications: [{ id: 1, name: "", issuer: "", date: "" }],
  experience_entries: [{ id: 1, title: "", company: "", dates: "", bullets: "" }],
};

type ProfileState = typeof defaultProfile;

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function AIAutoFillZone({
  onFill,
}: {
  onFill: (data: ProfileState) => void;
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [done, setDone] = useState(false);
  const [fillSummary, setFillSummary] = useState("");

  const addFiles = (fileList: FileList | File[]) => {
    const picked = Array.from(fileList);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canExtract = files.length > 0 || pastedText.trim().length > 20;

  const fileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word") || type.includes("document")) return "📝";
    return "📎";
  };

  const handleExtract = async () => {
    const session = loadAiSession();
    if (!session) {
      toast("Connect an AI provider in Step 1 before using auto-fill.", "error");
      return;
    }

    setExtracting(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type || "application/octet-stream",
          data: await fileToBase64(file),
        })),
      );

      const result = await autofillProfileFromDocuments({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        pastedText: pastedText.trim() || undefined,
        uploads,
      });

      onFill(result.profile as ProfileState);
      setFillSummary(result.summary);
      setDone(true);
      toast("Profile fields filled from your documents.");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not extract profile info.",
        "error",
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleReset = () => {
    setDone(false);
    setFillSummary("");
    setFiles([]);
    setPastedText("");
  };

  return (
    <>
      {dialog}
      <NeoCard className="mb-1 transition-colors duration-200" style={{ background: done ? "var(--mint-l)" : "#ffffff", borderWidth: done ? "2.5px" : undefined }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--lav)] text-lg neo-border-sm">✦</div>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[17px] font-extrabold">AI Auto-Fill</div>
          <div className="text-xs font-medium text-[#666]">Drop anything — resume, LinkedIn screenshot, bio, notes — AI will fill the form for you.</div>
        </div>
        {done && (
          <NeoBadge color="var(--mint)" className="ml-auto shrink-0 text-xs">
            ✓ Form filled!
          </NeoBadge>
        )}
      </div>

      {!done && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="mb-2.5 flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-dashed px-4 py-5 text-center transition-all duration-150"
            style={{ borderColor: dragOver ? "var(--foreground)" : "#cccccc", background: dragOver ? "var(--lav-l)" : "var(--background)" }}
          >
            <div className="text-[28px]">📎</div>
            <div className="text-sm font-bold">Drop files here</div>
            <div className="text-xs text-[#888]">PDF, DOCX, PNG, JPG, screenshots — anything</div>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" onChange={handleFileInput} />
              <NeoButton variant="secondary" size="sm" className="pointer-events-none">
                Browse files
              </NeoButton>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <NeoBadge key={`${f.name}-${i}`} color="var(--mint-l)">
                  {fileIcon(f.type)} {f.name}
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: "Remove file?",
                        message: `Remove "${f.name}" from the upload list?`,
                        confirmLabel: "Remove",
                      });
                      if (!confirmed) return;
                      removeFile(i);
                    }}
                    className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[#888]"
                  >
                    ✕
                  </button>
                </NeoBadge>
              ))}
            </div>
          )}

          <NeoInput
            placeholder="…or paste text here: LinkedIn bio, old resume, cover letter, anything you've got. The more the better!"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            multiline
            rows={3}
            className="mb-3 rounded-xl text-[13px]"
          />

          <div className="flex justify-end">
            <NeoButton
              variant="primary"
              disabled={!canExtract || extracting}
              onClick={() => void handleExtract()}
            >
              {extracting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-[#aaa] border-t-[var(--foreground)]" />
                  AI extracting info...
                </span>
              ) : (
                "✦ Extract & Fill Form →"
              )}
            </NeoButton>
          </div>
        </>
      )}

      {done && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-medium text-[#555]">
            ✓ Filled: {fillSummary || "profile fields from your documents"}.
            Review and edit anything below.
          </p>
          <NeoButton variant="secondary" size="sm" onClick={handleReset}>
            Upload again
          </NeoButton>
        </div>
      )}
    </NeoCard>
    </>
  );
}

function MultiResumeImport({
  resumes,
  setResumes,
  pasteText,
  setPasteText,
  onUploadFiles,
  onSavePastedResume,
  savingPaste,
}: {
  resumes: ResumeItem[];
  setResumes: React.Dispatch<React.SetStateAction<ResumeItem[]>>;
  pasteText: string;
  setPasteText: React.Dispatch<React.SetStateAction<string>>;
  onUploadFiles: (files: File[]) => Promise<void>;
  onSavePastedResume: () => Promise<void>;
  savingPaste: boolean;
}) {
  const [activeTab, setActiveTab] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await onUploadFiles(files);
    } finally {
      setUploading(false);
    }
  };

  const handleDropFiles = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    await handleFiles(Array.from(event.dataTransfer.files));
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const removeResume = (id: number) => {
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
  };

  const renameResume = (id: number, value: string) => {
    setResumes((prev) => prev.map((resume) => (resume.id === id ? { ...resume, aiName: value, naming: false } : resume)));
  };

  const canSavePaste = pasteText.trim().length > 20;
  const uploadBusy = uploading || savingPaste;

  return (
    <NeoCard>
      <NeoTabs
        tabs={[
          { id: "upload", label: "Upload Files" },
          { id: "paste", label: "Paste Text" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-5"
      />

      {activeTab === "upload" && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDropFiles}
            className="mb-4 rounded-[14px] border-[2.5px] border-dashed px-6 py-8 text-center transition-all"
            style={{ borderColor: dragOver ? "var(--foreground)" : "#cccccc", background: dragOver ? "var(--mint-l)" : "var(--background)" }}
          >
            <div className="mb-2 text-4xl">📄</div>
            <div className="mb-1 text-[15px] font-bold">Drop resumes here</div>
            <div className="mb-4 text-[13px] text-[#888]">PDF or DOCX — upload files into Convex storage.</div>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileInput} />
              <NeoButton variant="secondary" size="sm" className="pointer-events-none">
                {uploadBusy ? "Uploading..." : "Browse files"}
              </NeoButton>
            </label>
          </div>

          {resumes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="mb-0.5 text-xs font-bold text-[#888]">{resumes.length} RESUMES IMPORTED</div>
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 neo-border-sm">
                  <div className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--lav-l)] text-base neo-border-sm">📄</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 truncate text-xs text-[#888]">{r.file}</div>
                    <div className="flex items-center gap-1.5">
                      <NeoBadge color={r.sourceType === "paste" ? "var(--lav)" : "var(--mint)"} className="text-[10px]">
                        {r.sourceType === "paste" ? "✎ Paste" : "✦ AI"}
                      </NeoBadge>
                      <input
                        value={r.aiName}
                        onChange={(e) => renameResume(r.id, e.target.value)}
                        className="w-full border-none border-b-2 border-[var(--foreground)] bg-transparent font-sans text-[13px] font-bold outline-none"
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeResume(r.id)} className="cursor-pointer border-none bg-transparent p-1 text-base text-[#aaa]">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "paste" && (
        <div>
          <p className="mb-2.5 text-[13px] font-medium text-[#666]">Paste resume text below. AI will extract and name it automatically.</p>
          <NeoInput
            placeholder="Paste resume text here..."
            multiline
            rows={10}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="rounded-xl"
          />
          <div className="mt-3 flex justify-end">
            <NeoButton variant="secondary" size="sm" disabled={!canSavePaste || savingPaste} onClick={onSavePastedResume}>
              {savingPaste ? "Saving..." : "Save pasted resume →"}
            </NeoButton>
          </div>
        </div>
      )}

      <p className="mt-3.5 text-xs font-medium text-[#888]">🔒 Uploaded files are stored in Convex storage. Pasted text is saved as metadata only.</p>
    </NeoCard>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const initializeOnboarding = useMutation(api.onboarding.initializeOnboarding);
  const saveProviderConnections = useMutation(api.onboarding.saveProviderConnections);
  const saveProfileMutation = useMutation(api.onboarding.saveProfile);
  const saveImportedResumesMutation = useMutation(api.onboarding.saveImportedResumes);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  const generateResumeUploadUrl = useMutation(api.onboarding.generateResumeUploadUrl);
  const savePastedResumeMutation = useMutation(api.onboarding.savePastedResume);

  const { confirm, dialog } = useConfirm();
  const [step, setStep] = useState(1);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<"apikey" | "oauth">("apikey");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [oauthConnected, setOauthConnected] = useState<Record<string, boolean>>({});
  const [newSkill, setNewSkill] = useState("");
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [savingPaste, setSavingPaste] = useState(false);
  const [savingStep, setSavingStep] = useState<1 | 2 | 3 | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      void initializeOnboarding({});
    }
  }, [initializeOnboarding, isSignedIn]);

  useEffect(() => {
    if (!onboardingState || hydrated) return;

    queueMicrotask(() => {
      if (onboardingState.providerConnections.length > 0) {
        const nextVerified: Record<string, boolean> = {};
        const nextOauth: Record<string, boolean> = {};
        for (const connection of onboardingState.providerConnections) {
          if (connection.connectionType === "apikey") {
            nextVerified[connection.providerId] = connection.status === "connected";
          } else {
            nextOauth[connection.providerId] = connection.status === "connected";
          }
        }
        setVerified(nextVerified);
        setOauthConnected(nextOauth);
      }

      if (onboardingState.profile) {
        setProfile({
          name: onboardingState.profile.fullName,
          location: onboardingState.profile.location,
          email: onboardingState.profile.email,
          phone: onboardingState.profile.phone ?? "",
          links:
            (onboardingState.links ?? []).length > 0
              ? [...(onboardingState.links ?? [])]
                  .sort((a, b) => a.position - b.position)
                  .map((link, index) => ({
                    id: index + 1,
                    name: link.name,
                    url: link.url,
                  }))
              : defaultProfile.links,
          linkedin: onboardingState.profile.linkedin,
          github: onboardingState.profile.github,
          portfolio: onboardingState.profile.portfolio,
          targetRole: onboardingState.profile.targetRole,
          experience: onboardingState.profile.experienceLevel,
          about: onboardingState.profile.about,
          skills: [...onboardingState.skills]
            .sort((a, b) => a.position - b.position)
            .map((skill) => skill.name),
          languages:
            (onboardingState.languages ?? []).length > 0
              ? [...(onboardingState.languages ?? [])]
                  .sort((a, b) => a.position - b.position)
                  .map((language, index) => ({
                    id: index + 1,
                    name: language.name,
                    level: language.level,
                  }))
              : defaultProfile.languages,
          certifications:
            (onboardingState.certifications ?? []).length > 0
              ? [...(onboardingState.certifications ?? [])]
                  .sort((a, b) => a.position - b.position)
                  .map((certification, index) => ({
                    id: index + 1,
                    name: certification.name,
                    issuer: certification.issuer,
                    date: certification.date,
                  }))
              : defaultProfile.certifications,
          experience_entries:
            onboardingState.experienceEntries.length > 0
              ? [...onboardingState.experienceEntries]
                  .sort((a, b) => a.position - b.position)
                  .map((entry, index) => ({
                    id: index + 1,
                    title: entry.title,
                    company: entry.company,
                    dates: entry.dates,
                    bullets: entry.bullets,
                  }))
              : defaultProfile.experience_entries,
        });
      }

      if (onboardingState.importedResumes.length > 0) {
        setResumes(
          onboardingState.importedResumes.map((resume, index) => ({
            id: index + 1,
            storageId: resume.storageId,
            file: resume.fileName,
            aiName: resume.displayName,
            naming: false,
            mimeType: resume.mimeType,
            sizeBytes: resume.sizeBytes,
            sourceType: resume.sourceType,
            status: resume.status,
          })),
        );
      }

      setHydrated(true);
    });
  }, [hydrated, onboardingState]);
  const setProfileField =
    (
      field: keyof Omit<
        ProfileState,
        "skills" | "experience_entries" | "languages" | "certifications" | "links"
      >,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProfile((p) => ({ ...p, [field]: e.target.value }));
    };

  const updateExperienceEntry = (
    id: number,
    field: keyof ProfileState["experience_entries"][number],
    value: string,
  ) => {
    setProfile((p) => ({
      ...p,
      experience_entries: p.experience_entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }));
  };

  const addExperienceEntry = () => {
    setProfile((p) => ({
      ...p,
      experience_entries: [...p.experience_entries, { id: Date.now(), title: "", company: "", dates: "", bullets: "" }],
    }));
  };

  const removeExperienceEntry = (id: number) => {
    setProfile((p) => {
      if (p.experience_entries.length <= 1) return p;
      return {
        ...p,
        experience_entries: p.experience_entries.filter((entry) => entry.id !== id),
      };
    });
  };

  const updateLanguageEntry = (
    id: number,
    field: keyof ProfileState["languages"][number],
    value: string,
  ) => {
    setProfile((p) => ({
      ...p,
      languages: p.languages.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addLanguageEntry = () => {
    setProfile((p) => ({
      ...p,
      languages: [
        ...p.languages,
        { id: Date.now(), name: "", level: "Conversational" },
      ],
    }));
  };

  const removeLanguageEntry = (id: number) => {
    setProfile((p) => {
      if (p.languages.length <= 1) return p;
      return {
        ...p,
        languages: p.languages.filter((entry) => entry.id !== id),
      };
    });
  };

  const updateCertificationEntry = (
    id: number,
    field: keyof ProfileState["certifications"][number],
    value: string,
  ) => {
    setProfile((p) => ({
      ...p,
      certifications: p.certifications.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addCertificationEntry = () => {
    setProfile((p) => ({
      ...p,
      certifications: [
        ...p.certifications,
        { id: Date.now(), name: "", issuer: "", date: "" },
      ],
    }));
  };

  const removeCertificationEntry = (id: number) => {
    setProfile((p) => {
      if (p.certifications.length <= 1) return p;
      return {
        ...p,
        certifications: p.certifications.filter((entry) => entry.id !== id),
      };
    });
  };

  const updateLinkEntry = (
    id: number,
    field: keyof ProfileState["links"][number],
    value: string,
  ) => {
    setProfile((p) => ({
      ...p,
      links: p.links.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addLinkEntry = () => {
    setProfile((p) => ({
      ...p,
      links: [...p.links, { id: Date.now(), name: "", url: "" }],
    }));
  };

  const removeLinkEntry = (id: number) => {
    setProfile((p) => {
      if (p.links.length <= 1) return p;
      return {
        ...p,
        links: p.links.filter((entry) => entry.id !== id),
      };
    });
  };

  const handleAIFill = (data: ProfileState) => {
    setProfile(data);
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      e.preventDefault();
      setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const anyConnected = useMemo(
    () => Object.values(verified).some(Boolean) || Object.values(oauthConnected).some(Boolean),
    [oauthConnected, verified],
  );

  const handleUploadFiles = async (files: File[]) => {
    const uploaded: ResumeItem[] = [];
    for (const file of files) {
      const uploadUrl = await generateResumeUploadUrl({});
      const storageId = await uploadResumeFile(uploadUrl, file);
      uploaded.push(
        makeResumeItem({
          storageId,
          file: file.name,
          aiName: toResumeDisplayName(file.name),
          naming: true,
          mimeType: file.type || undefined,
          sizeBytes: file.size,
          sourceType: "upload",
          status: "imported",
        }),
      );
    }
    setResumes((prev) => [...prev, ...uploaded]);
  };

  const handleSavePastedResume = async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length <= 20) return;
    setSavingPaste(true);
    try {
      const displayName = `Pasted resume ${resumes.filter((resume) => resume.sourceType === "paste").length + 1}`;
      await savePastedResumeMutation({ fileName: `${displayName}.txt`, displayName });
      setResumes((prev) => [
        ...prev,
        makeResumeItem({
          file: `${displayName}.txt`,
          aiName: displayName,
          naming: false,
          sourceType: "paste",
          status: "imported",
        }),
      ]);
      setPasteText("");
    } finally {
      setSavingPaste(false);
    }
  };

  const handleContinueFromProviders = async (nextStep: number) => {
    setSavingStep(1);
    try {
      await saveProviderConnections({
        connections: [
          ...API_PROVIDERS.filter((provider) => verified[provider.id]).map((provider) => ({
            providerId: provider.id,
            providerName: provider.name,
            connectionType: "apikey" as const,
            status: "connected" as const,
            lastVerifiedAt: Date.now(),
          })),
          ...OAUTH_PROVIDERS.filter((provider) => oauthConnected[provider.id]).map((provider) => ({
            providerId: provider.id,
            providerName: provider.name,
            connectionType: "oauth" as const,
            status: "connected" as const,
          })),
        ],
      });
      setStep(nextStep);
    } finally {
      setSavingStep(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingStep(2);
    try {
      await saveProfileMutation({
        profile: {
          fullName: profile.name,
          location: profile.location,
          email: profile.email,
          phone: profile.phone,
          linkedin: profile.linkedin,
          github: profile.github,
          portfolio: profile.portfolio,
          targetRole: profile.targetRole,
          experienceLevel: profile.experience,
          about: profile.about,
          links: profile.links.map((entry) => ({
            name: entry.name,
            url: entry.url,
          })),
          skills: profile.skills,
          languages: profile.languages.map((entry) => ({
            name: entry.name,
            level: entry.level,
          })),
          certifications: profile.certifications.map((entry) => ({
            name: entry.name,
            issuer: entry.issuer,
            date: entry.date,
          })),
          experienceEntries: profile.experience_entries.map((entry) => ({
            title: entry.title,
            company: entry.company,
            dates: entry.dates,
            bullets: entry.bullets,
          })),
        },
      });
      setStep(3);
    } finally {
      setSavingStep(null);
    }
  };

  const finish = async () => {
    setSavingStep(3);
    try {
      await saveImportedResumesMutation({
        resumes: resumes.map((resume) => ({
          storageId: resume.storageId as never,
          fileName: resume.file,
          displayName: resume.aiName,
          mimeType: resume.mimeType,
          sizeBytes: resume.sizeBytes,
          sourceType: resume.sourceType,
          status: resume.status,
        })),
      });
      await completeOnboarding({});
      router.push("/jobs");
    } finally {
      setSavingStep(null);
    }
  };

  if (isLoaded && !isSignedIn) {
    router.push("/");
  }

  if (!isLoaded || onboardingState === undefined || onboardingState === null || !hydrated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="flex h-16 items-center justify-between border-b-[2.5px] border-[var(--foreground)] bg-white px-10">
        <Logo />
        <ProgressSteps steps={["Connect AI", "Build Profile", "Import Resumes"]} currentStep={step} />
        <div className="w-[120px]" />
      </div>

      {dialog}
      <div className="mx-auto w-full max-w-[800px] flex-1 px-6 py-12">
        {step === 1 && (
          <div>
            <div className="mb-10 text-center">
              <NeoBadge color="var(--mint)" className="mb-4">Step 1 of 3</NeoBadge>
              <h1 className="mb-2.5 font-heading text-[40px] font-extrabold tracking-tight">Connect your AI</h1>
              <p className="text-base font-medium text-[#555]">Choose how you want to power Rezume — paste an API key or connect via OAuth.</p>
            </div>

            <div className="mx-auto mb-7 flex w-fit overflow-hidden rounded-full neo-border">
              {([
                ["apikey", "🔑  API Key"],
                ["oauth", "🔗  OAuth / SSO"],
              ] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => {
                    setProviderType(v);
                    setExpandedProvider(null);
                  }}
                  className="cursor-pointer border-none px-7 py-2.5 font-sans text-sm font-bold"
                  style={{ background: providerType === v ? "var(--foreground)" : "#ffffff", color: providerType === v ? "#ffffff" : "var(--foreground)" }}
                >
                  {l}
                </button>
              ))}
            </div>

            {providerType === "apikey" && (
              <div className="mb-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {API_PROVIDERS.map((prov) => (
                  <ApiKeyCard
                    key={prov.id}
                    prov={prov}
                    expanded={expandedProvider === prov.id}
                    onExpand={() => setExpandedProvider(expandedProvider === prov.id ? null : prov.id)}
                    apiKey={apiKeys[prov.id] ?? ""}
                    setApiKey={(v) => {
                      setApiKeys((k) => ({ ...k, [prov.id]: v }));
                      setVerified((k) => ({ ...k, [prov.id]: false }));
                    }}
                    verified={!!verified[prov.id]}
                    onVerify={() => setVerified({ [prov.id]: true })}
                  />
                ))}
              </div>
            )}

            {providerType === "oauth" && (
              <>
                <div className="mb-4 rounded-xl bg-[var(--lav-l)] px-4 py-2.5 text-[13px] font-medium text-[#555] neo-border-sm">🔒 OAuth connection never shares your code or files.</div>
                <div className="mb-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  {OAUTH_PROVIDERS.map((prov) => (
                    <OAuthCard
                      key={prov.id}
                      prov={prov}
                      expanded={expandedProvider === prov.id}
                      onExpand={() => setExpandedProvider(expandedProvider === prov.id ? null : prov.id)}
                      connected={!!oauthConnected[prov.id]}
                      onConnect={() => setOauthConnected((k) => ({ ...k, [prov.id]: true }))}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <NeoButton variant="secondary" size="sm" onClick={() => void handleContinueFromProviders(2)}>
                Skip for now
              </NeoButton>
              <NeoButton variant="primary" onClick={() => void handleContinueFromProviders(2)} disabled={!anyConnected || savingStep === 1}>
                {savingStep === 1 ? "Saving..." : "Continue →"}
              </NeoButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-9 text-center">
              <NeoBadge color="var(--lav)" className="mb-4">Step 2 of 3 — Most Important</NeoBadge>
              <h1 className="mb-2.5 font-heading text-[40px] font-extrabold tracking-tight">Build your ultimate profile</h1>
              <p className="text-base font-medium text-[#555]">More detail here = better resumes. You only do this once.</p>
            </div>

            <AIAutoFillZone onFill={handleAIFill} />

            <ProfileSectionStack className="mt-2">
              <CollapsibleSection
                label="Personal Info"
                description="Your name and how employers can reach you"
                color="var(--mint)"
                defaultOpen={false}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NeoInput label="Full Name" placeholder="Alex Johnson" value={profile.name} onChange={setProfileField("name")} />
                  <NeoInput label="Location" placeholder="San Francisco, CA" value={profile.location} onChange={setProfileField("location")} />
                  <NeoInput label="Email" placeholder="alex@example.com" type="email" value={profile.email} onChange={setProfileField("email")} />
                  <NeoInput label="Phone" placeholder="(415) 555-0123" type="tel" value={profile.phone} onChange={setProfileField("phone")} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                label="Links"
                description="LinkedIn, portfolio, GitHub, and other profiles"
                color="var(--lav)"
                defaultOpen={false}
                action={<NeoButton variant="secondary" size="sm" onClick={addLinkEntry}>+ Add</NeoButton>}
              >
                <div className="flex flex-col gap-3">
                  {profile.links.map((entry) => (
                    <ProfileFormEntry key={entry.id}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <NeoInput label="Name" placeholder="e.g. LinkedIn" value={entry.name} onChange={(e) => updateLinkEntry(entry.id, "name", e.target.value)} />
                        <NeoInput label="URL" placeholder="https://..." value={entry.url} onChange={(e) => updateLinkEntry(entry.id, "url", e.target.value)} />
                      </div>
                      {profile.links.length > 1 && (
                        <button type="button" onClick={async () => {
                          const confirmed = await confirm({ title: "Remove link?", message: `Remove "${entry.name || "this link"}"? This can't be undone.`, confirmLabel: "Remove" });
                          if (!confirmed) return;
                          removeLinkEntry(entry.id);
                        }} className="mt-3 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]">
                          Remove link
                        </button>
                      )}
                    </ProfileFormEntry>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                label="Target Role & Skills"
                description="What you're looking for and your top skills"
                color="var(--yellow)"
                defaultOpen={false}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NeoInput label="Target Role" placeholder="e.g. Frontend Engineer" value={profile.targetRole} onChange={setProfileField("targetRole")} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold">Experience Level</label>
                    <select value={profile.experience} onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))} className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border">
                      <option value="">Select...</option>
                      <option>Internship</option>
                      <option>Entry Level (0-2 yrs)</option>
                      <option>Mid Level (2-5 yrs)</option>
                      <option>Senior (5+ yrs)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold">Top Skills</label>
                  <div className="flex min-h-11 flex-wrap gap-1.5 rounded-xl bg-[var(--background)] px-3 py-2 neo-border-sm">
                    {profile.skills.map((s) => (
                      <NeoBadge key={s} color="var(--mint)" className="cursor-pointer" onClick={async () => {
                        const confirmed = await confirm({ title: "Remove skill?", message: `Remove "${s}" from your skills?`, confirmLabel: "Remove" });
                        if (!confirmed) return;
                        setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }));
                      }}>
                        {s} ✕
                      </NeoBadge>
                    ))}
                    <input placeholder="Add skill, press Enter..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={addSkill} className="min-w-[120px] flex-1 border-none bg-transparent font-sans text-[13px] outline-none" />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection label="About You" description="A short summary the AI uses for every application" color="var(--peach)" defaultOpen={false}>
                <NeoInput label="Professional summary" placeholder="3-5 sentences about yourself. The AI uses this as context for every resume it generates — be specific!" multiline rows={4} value={profile.about} onChange={setProfileField("about")} />
              </CollapsibleSection>

              <CollapsibleSection label="Work Experience" description="Roles, companies, and bullet points for your resume" color="var(--lav)" defaultOpen={false} action={<NeoButton variant="secondary" size="sm" onClick={addExperienceEntry}>+ Add role</NeoButton>}>
                <div className="flex flex-col gap-3">
                  {profile.experience_entries.map((entry) => (
                    <ProfileFormEntry key={entry.id}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <NeoInput label="Job Title" placeholder="Frontend Engineer" value={entry.title} onChange={(e) => updateExperienceEntry(entry.id, "title", e.target.value)} />
                        <NeoInput label="Company" placeholder="Acme Corp" value={entry.company} onChange={(e) => updateExperienceEntry(entry.id, "company", e.target.value)} />
                        <NeoInput label="Dates" placeholder="Jan 2023 – Present" value={entry.dates} onChange={(e) => updateExperienceEntry(entry.id, "dates", e.target.value)} className="sm:col-span-2" />
                      </div>
                      <NeoInput label="Bullet Points (aim for 10–15 per role)" placeholder={"• Led migration from Vue to React, improving velocity by 40%\n• Built real-time dashboard using WebSockets..."} multiline rows={6} value={entry.bullets} onChange={(e) => updateExperienceEntry(entry.id, "bullets", e.target.value)} />
                      <p className="text-[11px] font-medium text-[#888]">More bullets give the AI more context — you can trim later.</p>
                      {profile.experience_entries.length > 1 && (
                        <button type="button" onClick={async () => {
                          const confirmed = await confirm({ title: "Remove role?", message: `Remove "${entry.title || "this role"}"? This can't be undone.`, confirmLabel: "Remove" });
                          if (!confirmed) return;
                          removeExperienceEntry(entry.id);
                        }} className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]">
                          Remove role
                        </button>
                      )}
                    </ProfileFormEntry>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection label="Languages" description="Languages you speak and your proficiency level" color="var(--lav-l)" defaultOpen={false} action={<NeoButton variant="secondary" size="sm" onClick={addLanguageEntry}>+ Add</NeoButton>}>
                <div className="flex flex-col gap-3">
                  {profile.languages.map((entry) => (
                    <ProfileFormEntry key={entry.id}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <NeoInput label="Language" placeholder="e.g. English" value={entry.name} onChange={(e) => updateLanguageEntry(entry.id, "name", e.target.value)} />
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold">Proficiency</label>
                          <select value={entry.level} onChange={(e) => updateLanguageEntry(entry.id, "level", e.target.value)} className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border">
                            {LANGUAGE_LEVELS.map((level) => <option key={level}>{level}</option>)}
                          </select>
                        </div>
                      </div>
                      {profile.languages.length > 1 && (
                        <button type="button" onClick={async () => {
                          const confirmed = await confirm({ title: "Remove language?", message: `Remove "${entry.name || "this language"}"? This can't be undone.`, confirmLabel: "Remove" });
                          if (!confirmed) return;
                          removeLanguageEntry(entry.id);
                        }} className="mt-3 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]">
                          Remove language
                        </button>
                      )}
                    </ProfileFormEntry>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection label="Certifications" description="Professional certs, licenses, and credentials" color="var(--peach-l)" defaultOpen={false} action={<NeoButton variant="secondary" size="sm" onClick={addCertificationEntry}>+ Add</NeoButton>}>
                <div className="flex flex-col gap-3">
                  {profile.certifications.map((entry) => (
                    <ProfileFormEntry key={entry.id}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <NeoInput label="Certification" placeholder="e.g. AWS Solutions Architect" value={entry.name} onChange={(e) => updateCertificationEntry(entry.id, "name", e.target.value)} />
                        <NeoInput label="Issuer" placeholder="e.g. Amazon Web Services" value={entry.issuer} onChange={(e) => updateCertificationEntry(entry.id, "issuer", e.target.value)} />
                        <NeoInput label="Date earned" placeholder="e.g. 2024" value={entry.date} onChange={(e) => updateCertificationEntry(entry.id, "date", e.target.value)} />
                      </div>
                      {profile.certifications.length > 1 && (
                        <button type="button" onClick={async () => {
                          const confirmed = await confirm({ title: "Remove certification?", message: `Remove "${entry.name || "this certification"}"? This can't be undone.`, confirmLabel: "Remove" });
                          if (!confirmed) return;
                          removeCertificationEntry(entry.id);
                        }} className="mt-3 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]">
                          Remove certification
                        </button>
                      )}
                    </ProfileFormEntry>
                  ))}
                </div>
              </CollapsibleSection>

              <div className="flex justify-between pt-2">
                <NeoButton variant="secondary" onClick={() => setStep(1)}>← Back</NeoButton>
                <NeoButton variant="primary" onClick={() => void handleSaveProfile()}>
                  {savingStep === 2 ? "Saving..." : "Save & Continue →"}
                </NeoButton>
              </div>
            </ProfileSectionStack>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-10 text-center">
              <NeoBadge color="var(--peach)" className="mb-4">Step 3 of 3 — Almost done!</NeoBadge>
              <h1 className="mb-2.5 font-heading text-[40px] font-extrabold tracking-tight">Import your resumes</h1>
              <p className="text-base font-medium text-[#555]">Add all the resumes you have. AI will name each one.</p>
            </div>
            <MultiResumeImport
              resumes={resumes}
              setResumes={setResumes}
              pasteText={pasteText}
              setPasteText={setPasteText}
              onUploadFiles={handleUploadFiles}
              onSavePastedResume={handleSavePastedResume}
              savingPaste={savingPaste}
            />
            <div className="mt-6 flex items-center justify-between">
              <NeoButton variant="secondary" onClick={() => setStep(2)}>← Back</NeoButton>
              <div className="flex items-center gap-3">
                <button onClick={() => void finish()} className="cursor-pointer border-none bg-transparent text-[13px] font-semibold text-[#888] underline">
                  Skip
                </button>
                <NeoButton variant="primary" onClick={() => void finish()}>
                  {savingStep === 3 ? "Saving..." : "Finish setup →"}
                </NeoButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
