"use client";

import { useState } from "react";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import {
  CollapsibleSection,
  ProfileFormEntry,
  ProfileSectionStack,
} from "@/components/ui/collapsible-section";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getInitialProfile } from "@/lib/onboarding-storage";

const NAV_ITEMS = [
  { id: "personal", label: "Personal Info" },
  { id: "links", label: "Links" },
  { id: "experience", label: "Work Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "languages", label: "Languages" },
  { id: "certifications", label: "Certifications" },
  { id: "education", label: "Education" },
  { id: "library", label: "Resume Library" },
];

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Professional",
  "Conversational",
  "Basic",
];

function PencilButton({
  onClick,
  label = "Edit",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--foreground)] bg-white text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--mint-l)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </button>
  );
}

function EditActions({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <NeoButton variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </NeoButton>
      <NeoButton variant="mint" size="sm" onClick={onSave}>
        Save
      </NeoButton>
    </div>
  );
}

export function ProfileView() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [activeSection, setActiveSection] = useState("personal");
  const [newSkill, setNewSkill] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "txt">("pdf");
  const [profile, setProfile] = useState(() => getInitialProfile());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_ITEMS.map((item) => [item.id, true])),
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, unknown> | null>(
    null,
  );

  const isEditing = (key: string) => editingKey === key;

  const startEdit = (key: string, draft: Record<string, unknown>) => {
    setEditingKey(key);
    setEditDraft(structuredClone(draft));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditDraft(null);
  };

  const saveEdit = (onSave: () => void) => {
    onSave();
    setEditingKey(null);
    setEditDraft(null);
    toast("Changes saved!");
  };

  const updateDraft = (patch: Record<string, unknown>) => {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleExportProfile = () => {
    toast(`Export as ${exportFormat.toUpperCase()} — coming soon!`);
  };

  const setSectionOpen = (id: string, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setSectionOpen(id, true);
    document.getElementById(`section-${id}`)?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--background)]">
      {dialog}
      <div className="flex w-[200px] shrink-0 flex-col gap-1 border-r-[2.5px] border-[var(--foreground)] bg-white px-4 py-6">
        <div className="mb-4 px-2 font-heading text-lg font-extrabold">Profile</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="cursor-pointer rounded-[10px] border-none px-3.5 py-2 text-left font-sans text-[13px] font-bold transition-colors"
            style={{
              background:
                activeSection === item.id ? "var(--mint)" : "transparent",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-y-auto px-10 py-8"
        onScroll={() => {
          for (const item of NAV_ITEMS) {
            const el = document.getElementById(`section-${item.id}`);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 200) setActiveSection(item.id);
            }
          }
        }}
      >
        <div className="max-w-[720px]">
          <NeoCard className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--yellow)] text-lg neo-border-sm">
                📄
              </div>
              <div>
                <div className="font-heading text-base font-extrabold">
                  Export profile
                </div>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#666]">
                  Download your profile as a document to back up or reuse
                  elsewhere later.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:items-end">
              <div className="flex overflow-hidden rounded-full neo-border-sm">
                {(
                  [
                    ["pdf", "PDF"],
                    ["docx", "DOCX"],
                    ["txt", "TXT"],
                  ] as const
                ).map(([id, label], idx) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setExportFormat(id)}
                    className="cursor-pointer border-none px-3 py-1.5 font-sans text-[11px] font-bold transition-[background,color] duration-150"
                    style={{
                      background:
                        exportFormat === id
                          ? "var(--foreground)"
                          : "#ffffff",
                      color:
                        exportFormat === id ? "#ffffff" : "var(--foreground)",
                      borderRight:
                        idx < 2 ? "2px solid var(--foreground)" : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={handleExportProfile}
                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export as document
              </NeoButton>
            </div>
          </NeoCard>

          <ProfileSectionStack>
          <CollapsibleSection
            id="section-personal"
            label="Personal Info"
            description="Name, contact details, and professional summary"
            color="var(--mint)"
            open={openSections.personal}
            onOpenChange={(open) => setSectionOpen("personal", open)}
          >
              {isEditing("personal") && editDraft ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NeoInput
                      label="Full Name"
                      value={String(editDraft.name ?? "")}
                      onChange={(e) => updateDraft({ name: e.target.value })}
                    />
                    <NeoInput
                      label="Location"
                      value={String(editDraft.location ?? "")}
                      onChange={(e) => updateDraft({ location: e.target.value })}
                    />
                    <NeoInput
                      label="Email"
                      value={String(editDraft.email ?? "")}
                      type="email"
                      onChange={(e) => updateDraft({ email: e.target.value })}
                    />
                    <NeoInput
                      label="Phone"
                      value={String(editDraft.phone ?? "")}
                      type="tel"
                      onChange={(e) => updateDraft({ phone: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NeoInput
                      label="Target Role"
                      value={String(editDraft.targetRole ?? "")}
                      onChange={(e) => updateDraft({ targetRole: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold">Experience Level</label>
                      <select
                        value={String(editDraft.experience ?? "")}
                        onChange={(e) =>
                          updateDraft({ experience: e.target.value })
                        }
                        className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border"
                      >
                        <option>Internship</option>
                        <option>Entry Level (0-2 yrs)</option>
                        <option>Mid Level (2-5 yrs)</option>
                        <option>Senior (5+ yrs)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <NeoInput
                      label="About You"
                      value={String(editDraft.about ?? "")}
                      multiline
                      rows={4}
                      onChange={(e) => updateDraft({ about: e.target.value })}
                    />
                  </div>
                  <EditActions
                    onCancel={cancelEdit}
                    onSave={() =>
                      saveEdit(() =>
                        setProfile((p) => ({
                          ...p,
                          name: String(editDraft.name ?? p.name),
                          location: String(editDraft.location ?? p.location),
                          email: String(editDraft.email ?? p.email),
                          phone: String(editDraft.phone ?? p.phone),
                          targetRole: String(editDraft.targetRole ?? p.targetRole),
                          experience: String(editDraft.experience ?? p.experience),
                          about: String(editDraft.about ?? p.about),
                        })),
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-xl font-extrabold">
                        {profile.name}
                      </div>
                      <div className="mt-0.5 text-sm font-medium text-[#666]">
                        {profile.targetRole} · {profile.experience}
                      </div>
                    </div>
                    <PencilButton
                      label="Edit personal info"
                      onClick={() =>
                        startEdit("personal", {
                          name: profile.name,
                          location: profile.location,
                          email: profile.email,
                          phone: profile.phone,
                          targetRole: profile.targetRole,
                          experience: profile.experience,
                          about: profile.about,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-bold text-[#888]">LOCATION</div>
                      <div className="font-medium">{profile.location}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#888]">EMAIL</div>
                      <div className="font-medium">{profile.email}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#888]">PHONE</div>
                      <div className="font-medium">{profile.phone}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#888]">ABOUT</div>
                    <p className="text-[13px] leading-relaxed font-medium text-[#555]">
                      {profile.about}
                    </p>
                  </div>
                </>
              )}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-links"
            label="Links"
            description="LinkedIn, portfolio, and other profile URLs"
            color="var(--lav)"
            open={openSections.links}
            onOpenChange={(open) => setSectionOpen("links", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newLink = { id: Date.now(), name: "", url: "" };
                  setProfile((p) => ({
                    ...p,
                    links: [...p.links, newLink],
                  }));
                  startEdit(`link-${newLink.id}`, { name: "", url: "" });
                }}
              >
                + Add Link
              </NeoButton>
            }
          >
            {profile.links.map((link) => {
              const linkKey = `link-${link.id}`;
              const editing = isEditing(linkKey) && editDraft;
              return (
              <ProfileFormEntry key={link.id}>
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NeoInput
                        label="Name"
                        value={String(editDraft.name ?? "")}
                        placeholder="e.g. LinkedIn"
                        onChange={(e) => updateDraft({ name: e.target.value })}
                      />
                      <NeoInput
                        label="URL"
                        value={String(editDraft.url ?? "")}
                        placeholder="https://..."
                        onChange={(e) => updateDraft({ url: e.target.value })}
                      />
                    </div>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            links: p.links.map((item) =>
                              item.id === link.id
                                ? {
                                    ...item,
                                    name: String(editDraft.name ?? ""),
                                    url: String(editDraft.url ?? ""),
                                  }
                                : item,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-base font-extrabold">
                        {link.name || "Untitled link"}
                      </div>
                      <div className="truncate text-sm font-medium text-[#666]">
                        {link.url || "No URL added"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PencilButton
                        label={`Edit ${link.name || "link"}`}
                        onClick={() =>
                          startEdit(linkKey, {
                            name: link.name,
                            url: link.url,
                          })
                        }
                      />
                      {profile.links.length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Remove link?",
                              message: `Remove "${link.name || "this link"}"? This can't be undone.`,
                              confirmLabel: "Remove",
                            });
                            if (!confirmed) return;
                            if (isEditing(linkKey)) cancelEdit();
                            setProfile((p) => ({
                              ...p,
                              links: p.links.filter((item) => item.id !== link.id),
                            }));
                          }}
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-experience"
            label="Work Experience"
            description="Roles, companies, and resume bullet points"
            color="var(--lav)"
            open={openSections.experience}
            onOpenChange={(open) => setSectionOpen("experience", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newEntry = {
                    id: Date.now(),
                    title: "New Role",
                    company: "",
                    dates: "",
                    bullets: [],
                  };
                  setProfile((p) => ({
                    ...p,
                    experience_entries: [...p.experience_entries, newEntry],
                  }));
                  startEdit(`experience-${newEntry.id}`, newEntry);
                }}
              >
                + Add Role
              </NeoButton>
            }
          >
            {profile.experience_entries.map((entry) => {
              const entryKey = `experience-${entry.id}`;
              const editing = isEditing(entryKey) && editDraft;
              type BulletDraft = { id: number; text: string; active: boolean };
              const draftBullets = (editDraft?.bullets as BulletDraft[] | undefined) ?? [];

              return (
              <ProfileFormEntry key={entry.id}>
                {editing ? (
                  <>
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NeoInput
                        label="Job Title"
                        value={String(editDraft.title ?? "")}
                        onChange={(e) => updateDraft({ title: e.target.value })}
                      />
                      <NeoInput
                        label="Company"
                        value={String(editDraft.company ?? "")}
                        onChange={(e) => updateDraft({ company: e.target.value })}
                      />
                      <NeoInput
                        label="Dates"
                        value={String(editDraft.dates ?? "")}
                        onChange={(e) => updateDraft({ dates: e.target.value })}
                        className="sm:col-span-2"
                      />
                    </div>
                    <div className="mb-2 text-xs font-bold text-[#888]">
                      BULLET POINTS
                    </div>
                    <div className="flex flex-col gap-2">
                      {draftBullets.map((bullet, index) => (
                        <div
                          key={bullet.id}
                          className="flex items-start gap-2.5 rounded-[10px] bg-white px-3.5 py-2.5 neo-border-sm"
                        >
                          <input
                            type="checkbox"
                            checked={bullet.active}
                            onChange={(e) => {
                              const next = draftBullets.map((b, i) =>
                                i === index ? { ...b, active: e.target.checked } : b,
                              );
                              updateDraft({ bullets: next });
                            }}
                            className="mt-2 h-4 w-4 shrink-0 cursor-pointer accent-[var(--foreground)]"
                          />
                          <NeoInput
                            value={bullet.text}
                            multiline
                            rows={2}
                            onChange={(e) => {
                              const next = draftBullets.map((b, i) =>
                                i === index ? { ...b, text: e.target.value } : b,
                              );
                              updateDraft({ bullets: next });
                            }}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = draftBullets.filter((_, i) => i !== index);
                              updateDraft({ bullets: next });
                            }}
                            className="mt-2 shrink-0 cursor-pointer border-none bg-transparent text-xs font-bold text-[#888] hover:text-[#cc0000]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          bullets: [
                            ...draftBullets,
                            { id: Date.now(), text: "", active: true },
                          ],
                        })
                      }
                      className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[var(--foreground)] underline"
                    >
                      + Add bullet
                    </button>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            experience_entries: p.experience_entries.map((e) =>
                              e.id === entry.id
                                ? {
                                    ...e,
                                    title: String(editDraft.title ?? e.title),
                                    company: String(editDraft.company ?? e.company),
                                    dates: String(editDraft.dates ?? e.dates),
                                    bullets: draftBullets,
                                  }
                                : e,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-heading text-lg font-extrabold">
                          {entry.title}
                        </div>
                        <div className="text-sm font-medium text-[#666]">
                          {entry.company} · {entry.dates}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <NeoBadge color="var(--mint-l)" className="text-[11px]">
                          {entry.bullets.filter((b) => b.active).length}/
                          {entry.bullets.length} active
                        </NeoBadge>
                        <PencilButton
                          label={`Edit ${entry.title}`}
                          onClick={() =>
                            startEdit(entryKey, {
                              title: entry.title,
                              company: entry.company,
                              dates: entry.dates,
                              bullets: entry.bullets,
                            })
                          }
                        />
                        {profile.experience_entries.length > 1 && (
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: "Remove role?",
                                message: `Remove "${entry.title}" at ${entry.company || "this company"}? This can't be undone.`,
                                confirmLabel: "Remove",
                              });
                              if (!confirmed) return;
                              if (isEditing(entryKey)) cancelEdit();
                              setProfile((p) => ({
                                ...p,
                                experience_entries: p.experience_entries.filter(
                                  (e) => e.id !== entry.id,
                                ),
                              }));
                            }}
                            className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {entry.bullets.map((bullet) => (
                        <div
                          key={bullet.id}
                          className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-2.5 neo-border-sm"
                          style={{
                            background: bullet.active ? "#ffffff" : "#f5f5f5",
                            opacity: bullet.active ? 1 : 0.55,
                          }}
                        >
                          <span className="mt-0.5 shrink-0 text-[11px] font-bold text-[#888]">
                            {bullet.active ? "●" : "○"}
                          </span>
                          <span className="flex-1 text-[13px] leading-relaxed font-medium">
                            {bullet.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-projects"
            label="Projects"
            description="Side projects and open-source work"
            color="var(--peach)"
            open={openSections.projects}
            onOpenChange={(open) => setSectionOpen("projects", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newProj = {
                    id: Date.now(),
                    title: "New Project",
                    url: "",
                    desc: "",
                    active: true,
                  };
                  setProfile((p) => ({
                    ...p,
                    projects: [...p.projects, newProj],
                  }));
                  startEdit(`project-${newProj.id}`, newProj);
                }}
              >
                + Add Project
              </NeoButton>
            }
          >
            {profile.projects.map((proj) => {
              const projKey = `project-${proj.id}`;
              const editing = isEditing(projKey) && editDraft;
              return (
              <ProfileFormEntry key={proj.id}>
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <NeoInput
                        label="Project Name"
                        value={String(editDraft.title ?? "")}
                        onChange={(e) => updateDraft({ title: e.target.value })}
                      />
                      <NeoInput
                        label="URL"
                        value={String(editDraft.url ?? "")}
                        onChange={(e) => updateDraft({ url: e.target.value })}
                      />
                      <NeoInput
                        label="Description"
                        value={String(editDraft.desc ?? "")}
                        multiline
                        rows={3}
                        onChange={(e) => updateDraft({ desc: e.target.value })}
                      />
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(editDraft.active)}
                          onChange={(e) =>
                            updateDraft({ active: e.target.checked })
                          }
                          className="h-4 w-4 accent-[var(--foreground)]"
                        />
                        Include on resume
                      </label>
                    </div>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            projects: p.projects.map((item) =>
                              item.id === proj.id
                                ? {
                                    ...item,
                                    title: String(editDraft.title ?? ""),
                                    url: String(editDraft.url ?? ""),
                                    desc: String(editDraft.desc ?? ""),
                                    active: Boolean(editDraft.active),
                                  }
                                : item,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-0.5 text-[15px] font-extrabold">
                        {proj.title}
                      </div>
                      <div className="mb-1 text-xs font-medium text-[#888]">
                        {proj.url || "No URL"}
                      </div>
                      <div className="text-[13px] font-medium text-[#555]">
                        {proj.desc}
                      </div>
                      {!proj.active && (
                        <NeoBadge color="#f5f5f5" className="mt-2 text-[11px]">
                          Hidden from resume
                        </NeoBadge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PencilButton
                        label={`Edit ${proj.title}`}
                        onClick={() =>
                          startEdit(projKey, {
                            title: proj.title,
                            url: proj.url,
                            desc: proj.desc,
                            active: proj.active,
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Remove project?",
                            message: `Remove "${proj.title}"? This can't be undone.`,
                            confirmLabel: "Remove",
                          });
                          if (!confirmed) return;
                          if (isEditing(projKey)) cancelEdit();
                          setProfile((p) => ({
                            ...p,
                            projects: p.projects.filter((item) => item.id !== proj.id),
                          }));
                        }}
                        className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline hover:text-[#cc0000]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-skills"
            label="Skills"
            description="Technologies and tools you work with"
            color="var(--yellow)"
            open={openSections.skills}
            onOpenChange={(open) => setSectionOpen("skills", open)}
          >
              <div className="flex min-h-12 flex-wrap gap-2 rounded-xl bg-white px-3 py-2 neo-border-sm">
                {profile.skills.map((s) => (
                  <NeoBadge
                    key={s}
                    color="var(--mint)"
                    className="cursor-pointer px-3 py-1 text-[13px]"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: "Remove skill?",
                        message: `Remove "${s}" from your skills?`,
                        confirmLabel: "Remove",
                      });
                      if (!confirmed) return;
                      setProfile((p) => ({
                        ...p,
                        skills: p.skills.filter((x) => x !== s),
                      }));
                    }}
                  >
                    {s} ✕
                  </NeoBadge>
                ))}
                <input
                  placeholder="Add skill, press Enter..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === ",") &&
                      newSkill.trim()
                    ) {
                      e.preventDefault();
                      setProfile((p) => ({
                        ...p,
                        skills: [...p.skills, newSkill.trim()],
                      }));
                      setNewSkill("");
                    }
                  }}
                  className="min-w-[140px] flex-1 border-none bg-transparent font-sans text-[13px] outline-none"
                />
              </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="section-languages"
            label="Languages"
            description="Spoken languages and proficiency levels"
            color="var(--lav-l)"
            open={openSections.languages}
            onOpenChange={(open) => setSectionOpen("languages", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newLang = {
                    id: Date.now(),
                    name: "",
                    level: "Conversational",
                  };
                  setProfile((p) => ({
                    ...p,
                    languages: [...p.languages, newLang],
                  }));
                  startEdit(`language-${newLang.id}`, newLang);
                }}
              >
                + Add Language
              </NeoButton>
            }
          >
            {profile.languages.map((lang) => {
              const langKey = `language-${lang.id}`;
              const editing = isEditing(langKey) && editDraft;
              return (
              <ProfileFormEntry key={lang.id}>
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NeoInput
                        label="Language"
                        value={String(editDraft.name ?? "")}
                        placeholder="e.g. English"
                        onChange={(e) => updateDraft({ name: e.target.value })}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold">Proficiency</label>
                        <select
                          value={String(editDraft.level ?? "Conversational")}
                          onChange={(e) => updateDraft({ level: e.target.value })}
                          className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border"
                        >
                          {LANGUAGE_LEVELS.map((level) => (
                            <option key={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            languages: p.languages.map((l) =>
                              l.id === lang.id
                                ? {
                                    ...l,
                                    name: String(editDraft.name ?? ""),
                                    level: String(editDraft.level ?? l.level),
                                  }
                                : l,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-heading text-base font-extrabold">
                        {lang.name || "Untitled language"}
                      </div>
                      <NeoBadge color="var(--lav-l)" className="mt-1 text-[11px]">
                        {lang.level}
                      </NeoBadge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PencilButton
                        label={`Edit ${lang.name || "language"}`}
                        onClick={() =>
                          startEdit(langKey, {
                            name: lang.name,
                            level: lang.level,
                          })
                        }
                      />
                      {profile.languages.length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Remove language?",
                              message: `Remove "${lang.name || "this language"}"? This can't be undone.`,
                              confirmLabel: "Remove",
                            });
                            if (!confirmed) return;
                            if (isEditing(langKey)) cancelEdit();
                            setProfile((p) => ({
                              ...p,
                              languages: p.languages.filter((l) => l.id !== lang.id),
                            }));
                          }}
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-certifications"
            label="Certifications"
            description="Professional credentials and licenses"
            color="var(--peach-l)"
            open={openSections.certifications}
            onOpenChange={(open) => setSectionOpen("certifications", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newCert = {
                    id: Date.now(),
                    name: "",
                    issuer: "",
                    date: "",
                  };
                  setProfile((p) => ({
                    ...p,
                    certifications: [...p.certifications, newCert],
                  }));
                  startEdit(`cert-${newCert.id}`, newCert);
                }}
              >
                + Add Certification
              </NeoButton>
            }
          >
            {profile.certifications.map((cert) => {
              const certKey = `cert-${cert.id}`;
              const editing = isEditing(certKey) && editDraft;
              return (
              <ProfileFormEntry key={cert.id}>
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NeoInput
                        label="Certification"
                        value={String(editDraft.name ?? "")}
                        placeholder="e.g. AWS Solutions Architect"
                        onChange={(e) => updateDraft({ name: e.target.value })}
                      />
                      <NeoInput
                        label="Issuer"
                        value={String(editDraft.issuer ?? "")}
                        placeholder="e.g. Amazon Web Services"
                        onChange={(e) => updateDraft({ issuer: e.target.value })}
                      />
                      <NeoInput
                        label="Date earned"
                        value={String(editDraft.date ?? "")}
                        placeholder="e.g. 2024"
                        onChange={(e) => updateDraft({ date: e.target.value })}
                      />
                    </div>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            certifications: p.certifications.map((c) =>
                              c.id === cert.id
                                ? {
                                    ...c,
                                    name: String(editDraft.name ?? ""),
                                    issuer: String(editDraft.issuer ?? ""),
                                    date: String(editDraft.date ?? ""),
                                  }
                                : c,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-base font-extrabold">
                        {cert.name || "Untitled certification"}
                      </div>
                      <div className="text-sm font-medium text-[#666]">
                        {cert.issuer}
                        {cert.date ? ` · ${cert.date}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PencilButton
                        label={`Edit ${cert.name || "certification"}`}
                        onClick={() =>
                          startEdit(certKey, {
                            name: cert.name,
                            issuer: cert.issuer,
                            date: cert.date,
                          })
                        }
                      />
                      {profile.certifications.length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Remove certification?",
                              message: `Remove "${cert.name || "this certification"}"? This can't be undone.`,
                              confirmLabel: "Remove",
                            });
                            if (!confirmed) return;
                            if (isEditing(certKey)) cancelEdit();
                            setProfile((p) => ({
                              ...p,
                              certifications: p.certifications.filter(
                                (c) => c.id !== cert.id,
                              ),
                            }));
                          }}
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors duration-150 hover:text-[#cc0000]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-education"
            label="Education"
            description="Degrees, schools, and academic details"
            color="var(--mint-l)"
            open={openSections.education}
            onOpenChange={(open) => setSectionOpen("education", open)}
            action={
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newEdu = {
                    id: Date.now(),
                    degree: "New Degree",
                    school: "",
                    dates: "",
                    gpa: "",
                  };
                  setProfile((p) => ({
                    ...p,
                    education: [...p.education, newEdu],
                  }));
                  startEdit(`education-${newEdu.id}`, newEdu);
                }}
              >
                + Add Education
              </NeoButton>
            }
          >
            {profile.education.map((edu) => {
              const eduKey = `education-${edu.id}`;
              const editing = isEditing(eduKey) && editDraft;
              return (
              <ProfileFormEntry key={edu.id}>
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <NeoInput
                        label="Degree"
                        value={String(editDraft.degree ?? "")}
                        onChange={(e) => updateDraft({ degree: e.target.value })}
                      />
                      <NeoInput
                        label="School"
                        value={String(editDraft.school ?? "")}
                        onChange={(e) => updateDraft({ school: e.target.value })}
                      />
                      <NeoInput
                        label="Dates"
                        value={String(editDraft.dates ?? "")}
                        onChange={(e) => updateDraft({ dates: e.target.value })}
                      />
                      <NeoInput
                        label="GPA (optional)"
                        value={String(editDraft.gpa ?? "")}
                        onChange={(e) => updateDraft({ gpa: e.target.value })}
                      />
                    </div>
                    <EditActions
                      onCancel={cancelEdit}
                      onSave={() =>
                        saveEdit(() =>
                          setProfile((p) => ({
                            ...p,
                            education: p.education.map((item) =>
                              item.id === edu.id
                                ? {
                                    ...item,
                                    degree: String(editDraft.degree ?? ""),
                                    school: String(editDraft.school ?? ""),
                                    dates: String(editDraft.dates ?? ""),
                                    gpa: String(editDraft.gpa ?? ""),
                                  }
                                : item,
                            ),
                          })),
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-base font-extrabold">
                        {edu.degree}
                      </div>
                      <div className="text-sm font-medium text-[#666]">
                        {edu.school}
                        {edu.dates ? ` · ${edu.dates}` : ""}
                      </div>
                      {edu.gpa && (
                        <div className="mt-1 text-xs font-medium text-[#888]">
                          GPA: {edu.gpa}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PencilButton
                        label={`Edit ${edu.degree}`}
                        onClick={() =>
                          startEdit(eduKey, {
                            degree: edu.degree,
                            school: edu.school,
                            dates: edu.dates,
                            gpa: edu.gpa,
                          })
                        }
                      />
                      {profile.education.length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Remove education?",
                              message: `Remove "${edu.degree}"? This can't be undone.`,
                              confirmLabel: "Remove",
                            });
                            if (!confirmed) return;
                            if (isEditing(eduKey)) cancelEdit();
                            setProfile((p) => ({
                              ...p,
                              education: p.education.filter(
                                (item) => item.id !== edu.id,
                              ),
                            }));
                          }}
                          className="cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline hover:text-[#cc0000]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ProfileFormEntry>
            );
            })}
          </CollapsibleSection>

          <CollapsibleSection
            id="section-library"
            label="Resume Library"
            description="Saved resumes tied to your applications"
            color="var(--lav)"
            open={openSections.library}
            onOpenChange={(open) => setSectionOpen("library", open)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {profile.resumeLibrary.map((resume) => (
                <NeoCard key={resume.id} className="p-4">
                  <div className="mb-3 flex h-12 w-10 items-center justify-center rounded-lg bg-[var(--lav-l)] text-lg neo-border-sm">
                    📄
                  </div>
                  <div className="mb-1 text-sm font-bold">{resume.label}</div>
                  <div className="mb-1 text-[11px] text-[#888]">{resume.job}</div>
                  <div className="mb-3.5 text-[11px] text-[#aaa]">{resume.date}</div>
                  <div className="flex gap-1.5">
                    <NeoButton
                      variant="secondary"
                      size="sm"
                      className="px-2.5 py-1 text-[11px]"
                      onClick={() => toast("Downloading...")}
                    >
                      Download
                    </NeoButton>
                    <NeoButton
                      variant="mint"
                      size="sm"
                      className="px-2.5 py-1 text-[11px]"
                      onClick={() => toast("Set as base!")}
                    >
                      Use as base
                    </NeoButton>
                  </div>
                </NeoCard>
              ))}
            </div>
          </CollapsibleSection>
          </ProfileSectionStack>
        </div>
      </div>
    </div>
  );
}
