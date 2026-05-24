"use client";

import { useState } from "react";
import { useToast } from "@/components/providers";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoInput } from "@/components/ui/neo-input";
import { SectionHeader } from "@/components/ui/match-score";
import { MOCK_PROFILE } from "@/lib/mock-data";

const NAV_ITEMS = [
  { id: "personal", label: "Personal Info" },
  { id: "experience", label: "Work Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "library", label: "Resume Library" },
];

export function ProfileView() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState("personal");
  const [newSkill, setNewSkill] = useState("");
  const [profile, setProfile] = useState(() => structuredClone(MOCK_PROFILE));

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--background)]">
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
          <div id="section-personal" className="mb-8">
            <SectionHeader label="Personal Info" color="var(--mint)" />
            <NeoCard>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NeoInput label="Full Name" defaultValue={profile.name} />
                <NeoInput label="Location" defaultValue={profile.location} />
                <NeoInput label="Email" defaultValue={profile.email} type="email" />
                <NeoInput label="LinkedIn" defaultValue={profile.linkedin} />
                <NeoInput label="GitHub" defaultValue={profile.github} />
                <NeoInput label="Portfolio" defaultValue={profile.portfolio} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NeoInput label="Target Role" defaultValue={profile.targetRole} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold">Experience Level</label>
                  <select
                    defaultValue={profile.experience}
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
                <NeoInput label="About You" defaultValue={profile.about} multiline rows={4} />
              </div>
              <div className="mt-3 text-right">
                <NeoButton variant="mint" size="sm" onClick={() => toast("Personal info saved!")}>
                  Save changes
                </NeoButton>
              </div>
            </NeoCard>
          </div>

          <div id="section-experience" className="mb-8">
            <SectionHeader
              label="Work Experience"
              color="var(--lav)"
              action={
                <NeoButton variant="secondary" size="sm" onClick={() => toast("Add role!")}>
                  + Add Role
                </NeoButton>
              }
            />
            {profile.experience_entries.map((entry) => (
              <NeoCard key={entry.id} className="mb-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-heading text-lg font-extrabold">
                      {entry.title}
                    </div>
                    <div className="text-sm font-medium text-[#666]">
                      {entry.company} · {entry.dates}
                    </div>
                  </div>
                  <NeoBadge color="var(--mint-l)" className="text-[11px]">
                    {entry.bullets.filter((b) => b.active).length}/
                    {entry.bullets.length} active
                  </NeoBadge>
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
                      <input
                        type="checkbox"
                        defaultChecked={bullet.active}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--foreground)]"
                      />
                      <span className="flex-1 text-[13px] leading-relaxed font-medium">
                        {bullet.text}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => toast("AI improved bullet!")}
                          className="cursor-pointer rounded-full bg-[var(--lav-l)] px-2.5 py-0.5 text-[11px] font-bold neo-border-sm"
                        >
                          ✦ Improve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </NeoCard>
            ))}
          </div>

          <div id="section-projects" className="mb-8">
            <SectionHeader
              label="Projects"
              color="var(--peach)"
              action={
                <NeoButton variant="secondary" size="sm" onClick={() => toast("Add project!")}>
                  + Add Project
                </NeoButton>
              }
            />
            {profile.projects.map((proj) => (
              <NeoCard key={proj.id} className="mb-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="mb-0.5 text-[15px] font-extrabold">{proj.title}</div>
                  <div className="mb-1 text-xs font-medium text-[#888]">{proj.url}</div>
                  <div className="text-[13px] font-medium text-[#555]">{proj.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={proj.active}
                  className="h-[18px] w-[18px] cursor-pointer accent-[var(--foreground)]"
                />
              </NeoCard>
            ))}
          </div>

          <div id="section-skills" className="mb-8">
            <SectionHeader label="Skills" color="var(--yellow)" />
            <NeoCard>
              <div className="flex min-h-12 flex-wrap gap-2 rounded-xl bg-white px-3 py-2 neo-border-sm">
                {profile.skills.map((s) => (
                  <NeoBadge
                    key={s}
                    color="var(--mint)"
                    className="cursor-pointer px-3 py-1 text-[13px]"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        skills: p.skills.filter((x) => x !== s),
                      }))
                    }
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
            </NeoCard>
          </div>

          <div id="section-education" className="mb-8">
            <SectionHeader label="Education" color="var(--mint-l)" />
            {profile.education.map((edu) => (
              <NeoCard key={edu.id} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NeoInput label="Degree" defaultValue={edu.degree} />
                <NeoInput label="School" defaultValue={edu.school} />
                <NeoInput label="Dates" defaultValue={edu.dates} />
                <NeoInput label="GPA (optional)" defaultValue={edu.gpa} />
              </NeoCard>
            ))}
          </div>

          <div id="section-library" className="mb-8">
            <SectionHeader label="Resume Library" color="var(--lav)" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
