"use client";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import {
  NeoInput,
  NeoLabel,
  NeoSelect,
  NeoTextarea,
} from "@/components/ui/neo-input";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { useRezume } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { profile, updateProfile, savedResumes, removeSavedResume, resetAll } =
    useRezume();
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Delete all local data? This cannot be undone (demo uses localStorage)."
      )
    ) {
      resetAll();
      router.push("/");
    }
  };

  return (
    <AppShell title="Profile">
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-black uppercase">Ultimate Profile</h2>
          <NeoCard className="grid gap-4">
            <div>
              <NeoLabel>Target role</NeoLabel>
              <NeoInput
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              />
            </div>
            <div>
              <NeoLabel>Experience level</NeoLabel>
              <NeoSelect
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
              <NeoLabel>Top skills</NeoLabel>
              <NeoInput
                value={form.topSkills}
                onChange={(e) => setForm({ ...form, topSkills: e.target.value })}
              />
            </div>
            <div>
              <NeoLabel>About you</NeoLabel>
              <NeoTextarea
                rows={5}
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
            <div>
              <NeoLabel>Portfolio</NeoLabel>
              <NeoInput
                value={form.portfolio}
                onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
              />
            </div>
            <NeoButton variant="primary" onClick={handleSave}>
              {saved ? "Saved!" : "Save profile"}
            </NeoButton>
          </NeoCard>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-black uppercase">Resume library</h2>
          {savedResumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No saved resumes"
              description="Save tailored resumes from the resume builder to reuse or reference later."
              actionLabel="Go to job board"
              actionHref="/jobs"
            />
          ) : (
            <div className="space-y-3">
              {savedResumes.map((r) => (
                <NeoCard
                  key={r.id}
                  flat
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-black">{r.label}</p>
                    <p className="text-sm opacity-70">{formatDate(r.createdAt)}</p>
                  </div>
                  <NeoButton
                    variant="danger"
                    size="sm"
                    onClick={() => removeSavedResume(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </NeoButton>
                </NeoCard>
              ))}
            </div>
          )}

          <NeoCard className="mt-8 border-neo-pink bg-neo-pink/10">
            <h3 className="font-black uppercase text-red-800">Danger zone</h3>
            <p className="mt-2 text-sm font-medium">
              Permanently delete all local Rezume data (profile, jobs, keys metadata).
            </p>
            <NeoButton
              variant="danger"
              className="mt-4"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4" /> Delete account data
            </NeoButton>
          </NeoCard>
        </section>
      </div>
    </AppShell>
  );
}
