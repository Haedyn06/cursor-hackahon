"use client";

import { NeoButton } from "@/components/ui/neo-button";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoCard } from "@/components/ui/neo-card";
import {
  NeoInput,
  NeoLabel,
  NeoSelect,
  NeoTextarea,
} from "@/components/ui/neo-input";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ResumeUpload } from "@/components/onboarding/resume-upload";
import { ErrorBanner } from "@/components/ui/empty-state";
import { EXPERIENCE_LEVELS, PROVIDERS } from "@/lib/constants";
import {
  listFilledFields,
  mergeAutofillIntoProfile,
  parseResumeForAutofill,
} from "@/lib/parse-resume";
import { verifyApiKey } from "@/lib/mock-ai";
import { useRezume } from "@/lib/store";
import type { AIProvider } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = ["AI Provider", "Your Profile", "Base Resume"];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    setApiKey,
    updateProfile,
    profile,
    setBaseResume,
    baseResumeText,
    completeOnboarding,
    onboardingComplete,
    apiKey,
  } = useRezume();

  const isReconnect = onboardingComplete && !apiKey?.verified;
  const [step, setStep] = useState(isReconnect ? 0 : 0);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [resumeTab, setResumeTab] = useState<"paste" | "upload">("upload");
  const [autofillLabels, setAutofillLabels] = useState<string[]>([]);
  const [overwriteOnAutofill, setOverwriteOnAutofill] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const [form, setForm] = useState({
    targetRole: profile.targetRole,
    experienceLevel: profile.experienceLevel,
    topSkills: profile.topSkills,
    aboutYou: profile.aboutYou,
    linkedin: profile.linkedin,
    github: profile.github,
    portfolio: profile.portfolio,
  });

  const handleVerify = async () => {
    if (!selectedProvider || !apiKeyInput.trim()) return;
    setVerifying(true);
    setKeyError(null);
    const ok = await verifyApiKey(apiKeyInput);
    setVerifying(false);
    if (ok) {
      setVerified(true);
      setApiKey(selectedProvider, apiKeyInput, true);
      if (isReconnect) {
        router.push("/settings");
      }
    } else {
      setKeyError("Invalid API key. Check your provider dashboard and try again.");
    }
  };

  const canStep1 = verified;

  const profileGaps: string[] = [];
  if (!form.targetRole.trim()) profileGaps.push("target role");
  if (!form.topSkills.trim()) profileGaps.push("top skills");
  if (form.aboutYou.trim().length < 20) {
    profileGaps.push(
      `about you (${Math.max(0, 20 - form.aboutYou.trim().length)} more characters)`
    );
  }

  const isProfileComplete = profileGaps.length === 0;

  const applyAutofillFromText = (text: string) => {
    const parsed = parseResumeForAutofill(text);
    const merged = mergeAutofillIntoProfile(
      form,
      parsed,
      overwriteOnAutofill ? "overwrite" : "empty"
    );
    setForm(merged);
    setAutofillLabels(listFilledFields(parsed));
  };

  const finish = () => {
    setFinishError(null);
    if (!baseResumeText.trim()) {
      setFinishError("Upload or paste your resume to finish.");
      return;
    }
    if (!isProfileComplete) {
      setFinishError(
        `Complete your profile: ${profileGaps.join(", ")}. Upload a resume to auto-fill, or edit the review section below.`
      );
      return;
    }
    updateProfile({ ...form, hasUltimateProfile: true });
    completeOnboarding();
    router.push("/dashboard");
  };

  useEffect(() => {
    if (onboardingComplete && apiKey?.verified) {
      router.replace("/dashboard");
    }
  }, [onboardingComplete, apiKey, router]);

  if (onboardingComplete && apiKey?.verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neo-bg dot-grid">
        <div className="neo-card px-8 py-6 font-bold">Redirecting to dashboard…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neo-bg dot-grid">
      <header className="border-b-[3px] border-neo-ink bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href={isReconnect ? "/dashboard" : "/"} className="flex items-center gap-2 font-black">
            <ArrowLeft className="h-4 w-4" /> {isReconnect ? "Dashboard" : "Rezume"}
          </Link>
          {!isReconnect && <ProgressSteps steps={STEPS} current={step} />}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {isReconnect && (
          <NeoCard className="mb-6 bg-neo-orange/30">
            <p className="font-black">Reconnect your AI provider</p>
            <p className="mt-1 text-sm font-medium">
              Your profile and jobs are saved. Verify a new API key to continue tailoring.
            </p>
            <NeoButton
              className="mt-3"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </NeoButton>
          </NeoCard>
        )}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black">Choose your AI provider</h1>
              <p className="mt-2 font-medium">
                Your key is encrypted client-side and never stored in plaintext.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p.id);
                    setVerified(false);
                  }}
                  className={cn(
                    "neo-card text-left transition-transform hover:-translate-y-0.5",
                    selectedProvider === p.id && "ring-4 ring-neo-ink ring-offset-2"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-lg font-black">{p.name}</span>
                    {p.freeTier && <NeoBadge className="bg-neo-lime">Free tier</NeoBadge>}
                  </div>
                  <a
                    href={p.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-neo-blue underline"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </button>
              ))}
            </div>

            {selectedProvider && (
              <NeoCard className="space-y-4">
                <NeoLabel htmlFor="api-key">API Key</NeoLabel>
                <NeoInput
                  id="api-key"
                  type="password"
                  placeholder="sk-…"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setVerified(false);
                  }}
                />
                {keyError && <ErrorBanner message={keyError} onRetry={handleVerify} />}
                <NeoButton
                  variant="primary"
                  onClick={handleVerify}
                  disabled={verifying || !apiKeyInput.trim()}
                >
                  {verifying ? "Verifying…" : verified ? (
                    <>
                      <Check className="h-4 w-4" /> Verified
                    </>
                  ) : (
                    "Verify key"
                  )}
                </NeoButton>
              </NeoCard>
            )}

            {isReconnect ? (
              <NeoButton
                variant="lime"
                className="w-full sm:w-auto"
                disabled={!canStep1}
                onClick={() => router.push("/dashboard")}
              >
                Return to dashboard <ArrowRight className="h-4 w-4" />
              </NeoButton>
            ) : (
              <NeoButton
                variant="lime"
                className="w-full sm:w-auto"
                disabled={!canStep1}
                onClick={() => setStep(1)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </NeoButton>
            )}
          </div>
        )}

        {!isReconnect && step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black">Build your Ultimate Profile</h1>
              <p className="mt-2 font-medium">
                Fill this now, or skip and auto-fill on the next step when you upload your
                resume.
              </p>
            </div>

            <NeoCard className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <NeoLabel htmlFor="target-role">Target role</NeoLabel>
                <NeoInput
                  id="target-role"
                  placeholder="e.g. Junior Full Stack Developer"
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                />
              </div>
              <div>
                <NeoLabel htmlFor="exp">Experience level</NeoLabel>
                <NeoSelect
                  id="exp"
                  value={form.experienceLevel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      experienceLevel: e.target.value as typeof form.experienceLevel,
                    })
                  }
                >
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </NeoSelect>
              </div>
              <div>
                <NeoLabel htmlFor="skills">Top skills (comma-separated)</NeoLabel>
                <NeoInput
                  id="skills"
                  placeholder="React, TypeScript, Python"
                  value={form.topSkills}
                  onChange={(e) => setForm({ ...form, topSkills: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <NeoLabel htmlFor="about">
                  About you <span className="text-neo-purple">(min. 20 characters)</span>
                </NeoLabel>
                <NeoTextarea
                  id="about"
                  placeholder="Your story, strengths, what you're looking for…"
                  rows={5}
                  value={form.aboutYou}
                  onChange={(e) => setForm({ ...form, aboutYou: e.target.value })}
                />
                <p
                  className={cn(
                    "mt-1 text-xs font-bold",
                    form.aboutYou.trim().length >= 20
                      ? "text-green-700"
                      : "text-neo-orange"
                  )}
                >
                  {form.aboutYou.trim().length}/20 characters
                </p>
              </div>
              <div>
                <NeoLabel htmlFor="linkedin">LinkedIn</NeoLabel>
                <NeoInput
                  id="linkedin"
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>
              <div>
                <NeoLabel htmlFor="github">GitHub</NeoLabel>
                <NeoInput
                  id="github"
                  placeholder="https://github.com/…"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <NeoLabel htmlFor="portfolio">Portfolio URL</NeoLabel>
                <NeoInput
                  id="portfolio"
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                />
              </div>
            </NeoCard>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <NeoButton variant="outline" onClick={() => setStep(0)}>
                Back
              </NeoButton>
              <NeoButton
                variant="primary"
                onClick={() => {
                  updateProfile(form);
                  setStep(2);
                }}
              >
                Continue
              </NeoButton>
            </div>
            {!isProfileComplete && (
              <p className="text-sm font-medium text-neo-purple">
                Optional for this step: {profileGaps.join(" · ")} — you can auto-fill on the
                next step from your resume.
              </p>
            )}
          </div>
        )}

        {!isReconnect && step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black">Your base resume</h1>
              <p className="mt-2 font-medium">
                Upload a PDF or paste text — we&apos;ll extract content and auto-fill your
                profile fields.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["upload", "paste"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setResumeTab(tab)}
                  className={cn(
                    "neo-btn px-4 py-2 text-sm",
                    resumeTab === tab ? "bg-neo-lime" : "bg-white"
                  )}
                >
                  {tab === "upload" ? "Upload file" : "Paste text"}
                </button>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={overwriteOnAutofill}
                onChange={(e) => setOverwriteOnAutofill(e.target.checked)}
                className="h-4 w-4 accent-neo-ink"
              />
              Overwrite profile fields I already filled
            </label>

            {resumeTab === "upload" ? (
              <ResumeUpload
                baseResumeText={baseResumeText}
                form={form}
                overwrite={overwriteOnAutofill}
                onResumeText={setBaseResume}
                onFormAutofill={setForm}
                onAutofillLabels={setAutofillLabels}
              />
            ) : (
              <div className="space-y-3">
                <NeoTextarea
                  rows={12}
                  placeholder="Paste your resume text here…"
                  value={baseResumeText}
                  onChange={(e) => setBaseResume(e.target.value)}
                />
                <NeoButton
                  type="button"
                  variant="outline"
                  disabled={baseResumeText.trim().length < 80}
                  onClick={() => applyAutofillFromText(baseResumeText)}
                >
                  <Sparkles className="h-4 w-4" /> Auto-fill profile from paste
                </NeoButton>
              </div>
            )}

            {autofillLabels.length > 0 && resumeTab === "paste" && (
              <div className="neo-card bg-neo-lime/40 p-4">
                <p className="font-black">Auto-filled: {autofillLabels.join(", ")}</p>
              </div>
            )}

            {!isProfileComplete && (
              <NeoCard className="space-y-4">
                <p className="font-black uppercase">Complete your profile</p>
                <div>
                  <NeoLabel>Target role</NeoLabel>
                  <NeoInput
                    value={form.targetRole}
                    onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  />
                </div>
                <div>
                  <NeoLabel>Top skills</NeoLabel>
                  <NeoInput
                    value={form.topSkills}
                    onChange={(e) => setForm({ ...form, topSkills: e.target.value })}
                  />
                </div>
                <div>
                  <NeoLabel>About you</NeoLabel>
                  <NeoTextarea
                    rows={4}
                    value={form.aboutYou}
                    onChange={(e) => setForm({ ...form, aboutYou: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <NeoLabel>LinkedIn</NeoLabel>
                    <NeoInput
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    />
                  </div>
                  <div>
                    <NeoLabel>GitHub</NeoLabel>
                    <NeoInput
                      value={form.github}
                      onChange={(e) => setForm({ ...form, github: e.target.value })}
                    />
                  </div>
                </div>
              </NeoCard>
            )}

            {finishError && <ErrorBanner message={finishError} />}

            <div className="flex gap-3">
              <NeoButton variant="outline" onClick={() => setStep(1)}>
                Back
              </NeoButton>
              <NeoButton
                variant="lime"
                disabled={!baseResumeText.trim()}
                onClick={finish}
              >
                Finish setup <Check className="h-4 w-4" />
              </NeoButton>
            </div>
            {!baseResumeText.trim() && (
              <p className="text-sm font-bold text-neo-orange">
                Add a resume (upload or paste) to finish.
              </p>
            )}
            {baseResumeText.trim() && !isProfileComplete && (
              <p className="text-sm font-medium text-neo-purple">
                Profile still needs: {profileGaps.join(", ")}. Use auto-fill or the review
                section above.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
