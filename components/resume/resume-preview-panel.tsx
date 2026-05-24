"use client";

import { useState } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { MatchScore } from "@/components/ui/match-score";
import { MOCK_RESUME } from "@/lib/mock-data";

export type GeneratedResume = {
  id: number;
  title: string;
  matchJob: string;
  templateName: string;
  content: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
};

type ResumePreviewPanelProps = {
  resume: GeneratedResume;
  onBack: () => void;
  onSave: (resume: GeneratedResume) => void;
  onDownload: () => void;
};

export function ResumePreviewPanel({
  resume,
  onBack,
  onSave,
  onDownload,
}: ResumePreviewPanelProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(resume.content);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex shrink-0 items-center justify-between gap-5 border-b-[2.5px] border-[var(--foreground)] bg-white px-10 py-">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1.5 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors hover:text-[var(--foreground)]"
          >
            ← Back to library
          </button>
          <h1 className="font-heading text-[20px] font-extrabold">{resume.title}</h1>
          <p className="text-sm font-medium text-gray-500">
            {resume.matchJob} · {resume.templateName} template
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {editing ? (
            <>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setContent(resume.content);
                  setEditing(false);
                }}
              >
                Cancel
              </NeoButton>
              <NeoButton
                variant="mint"
                size="sm"
                onClick={() => {
                  onSave({ ...resume, content });
                  setEditing(false);
                }}
              >
                Save changes
              </NeoButton>
            </>
          ) : (
            <>
              <NeoButton variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit
              </NeoButton>
              <NeoButton variant="secondary" size="sm" onClick={onDownload}>
                Download
              </NeoButton>
              <NeoButton
                variant="mint"
                size="sm"
                onClick={() => onSave({ ...resume, content })}
              >
                Save to Library
              </NeoButton>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-6 flex items-start gap-5 rounded-2xl bg-white p-5 neo-border">
              <MatchScore score={resume.matchScore} size="lg" />
              <div className="flex-1">
                <div className="mb-2.5 font-heading text-base font-extrabold">
                  Keyword Match
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.matchedKeywords.map((k) => (
                    <NeoBadge key={k} color="var(--mint)" className="text-[11px]">
                      ✓ {k}
                    </NeoBadge>
                  ))}
                  {resume.missingKeywords.map((k) => (
                    <NeoBadge key={k} color="var(--peach)" className="text-[11px]">
                      ✕ {k}
                    </NeoBadge>
                  ))}
                </div>
              </div>
            </div>

            {editing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[520px] w-full resize-y rounded-xl bg-white p-10 font-sans text-[15px] leading-relaxed outline-none neo-border"
              />
            ) : (
              <div className="rounded-xl bg-white p-10 text-[15px] leading-relaxed whitespace-pre-line neo-border">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function buildMockResumeContent(jobTitle: string, company: string): string {
  return MOCK_RESUME.replace(
    "Frontend Engineer with 4 years",
    `${jobTitle} candidate with 4 years`,
  ).replace("Acme Corp", company);
}
