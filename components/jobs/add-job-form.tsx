"use client";

import { useState } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/providers";
import type { JobStatus } from "@/lib/constants";
import type { MockJob } from "@/lib/mock-data";

const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Company Site",
  "GitHub Jobs",
  "Referral",
  "Other",
];

type AddJobFormProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (job: MockJob) => void;
};

export function AddJobForm({ open, onClose, onAdd }: AddJobFormProps) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: "",
    company: "",
    url: "",
    jd: "",
    source: "LinkedIn",
  });

  const handleAdd = () => {
    if (!form.title || !form.company) return;
    onAdd({
      id: String(Date.now()),
      title: form.title,
      company: form.company,
      location: "Remote",
      url: form.url,
      jd: form.jd,
      source: form.source,
      status: "Saved" as JobStatus,
      matchScore: null,
      dateAdded: "just now",
      matchedKeywords: [],
      missingKeywords: [],
      resumeGenerated: false,
      salary: "$0",
      deadline: null,
      dateApplied: null,
      followUp: null,
      excitement: 0,
    });
    setForm({ title: "", company: "", url: "", jd: "", source: "LinkedIn" });
    toast("Job added!");
    onClose();
  };

  const f =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <SlideOver open={open} onClose={onClose} title="Add Job" width={460}>
      <div className="flex flex-col gap-4">
        <NeoInput
          label="Job Title *"
          placeholder="e.g. Frontend Engineer"
          value={form.title}
          onChange={f("title")}
        />
        <NeoInput
          label="Company *"
          placeholder="e.g. Stripe"
          value={form.company}
          onChange={f("company")}
        />
        <NeoInput
          label="Job URL (optional)"
          placeholder="https://..."
          value={form.url}
          onChange={f("url")}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold">Source</label>
          <select
            value={form.source}
            onChange={f("source")}
            className="rounded-full bg-white px-4 py-2.5 font-sans text-sm outline-none neo-border"
          >
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <NeoInput
          label="Job Description *"
          placeholder="Paste the full job description here..."
          value={form.jd}
          onChange={f("jd")}
          multiline
          rows={10}
        />
        <NeoButton
          variant="mint"
          onClick={handleAdd}
          disabled={!form.title || !form.company}
          className="self-end"
        >
          Save job →
        </NeoButton>
      </div>
    </SlideOver>
  );
}
