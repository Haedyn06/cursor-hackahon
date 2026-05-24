"use client";

import { useMemo, useRef, useState } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { MatchScore } from "@/components/ui/match-score";
import { AtsResumeTemplate } from "@/components/resume/ats-resume-template";
import { MOCK_RESUME } from "@/lib/mock-data";
import {
  buildResumeDocument,
  parseResumeText,
  resumeDocumentToPlainText,
  type ResumeDocument,
} from "@/lib/resume-document";

export type ResumeProfileContext = {
  fullName?: string | null;
  email?: string | null;
  location?: string | null;
  phone?: string | null;
  targetRole?: string | null;
  about?: string | null;
  skills?: string[];
};

const DEFAULT_SUMMARY =
  "Frontend Engineer with 4 years of experience building high-performance, accessible web applications using React, TypeScript, and GraphQL. Passionate about developer experience and pixel-perfect UI.";

const DEFAULT_SKILLS = "React · TypeScript · GraphQL · CSS · Next.js · Node.js · Jest · Git";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceLine(content: string, currentLine: string, nextLine: string) {
  return content.replace(new RegExp(`^${escapeRegExp(currentLine)}$`, "m"), nextLine);
}

function replaceSection(content: string, heading: string, nextValue: string) {
  return content.replace(
    new RegExp(`(${escapeRegExp(heading)}\\n)([\\s\\S]*?)(\\n\\n[A-Z][A-Z\\s]+\\n|$)`),
    (_, start, __, end) => `${start}${nextValue}${end}`,
  );
}

export type GeneratedResume = {
  id: number;
  title: string;
  matchJob: string;
  templateName: string;
  templateId?: string;
  content: string;
  document?: ResumeDocument;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
};

export type ResumeDownloadContext = {
  document: ResumeDocument;
  getExportElement: () => HTMLElement | null;
};

type ResumePreviewPanelProps = {
  resume: GeneratedResume;
  onBack: () => void;
  onSave: (resume: GeneratedResume) => void;
  onDownload: (context: ResumeDownloadContext) => void | Promise<void>;
};

export function ResumePreviewPanel({
  resume,
  onBack,
  onSave,
  onDownload,
}: ResumePreviewPanelProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(resume.content);

  const resumeDocument = useMemo(
    () => (editing ? parseResumeText(content) : resume.document ?? parseResumeText(content)),
    [content, editing, resume.document],
  );

  const persistContent = () => {
    const parsed = parseResumeText(content);
    return {
      ...resume,
      content,
      document: parsed,
    };
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b-[2.5px] border-[var(--foreground)] bg-white px-8 py-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors hover:text-[var(--foreground)]"
          >
            ← Back to library
          </button>
          <h1 className="font-heading text-[22px] font-extrabold">{resume.title}</h1>
          <p className="text-sm font-medium text-[#666]">
            {resume.matchJob} · {resume.templateName} template
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
                  onSave(persistContent());
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
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  void onDownload({
                    document: resumeDocument,
                    getExportElement: () => exportRef.current,
                  })
                }
              >
                Download
              </NeoButton>
              <NeoButton
                variant="mint"
                size="sm"
                onClick={() => onSave(persistContent())}
              >
                Save to Library
              </NeoButton>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-[900px]">
            <div className="mb-6 flex items-start gap-4 rounded-2xl bg-white p-5 neo-border">
              <MatchScore score={resume.matchScore} size="lg" />
              <div className="flex-1">
                <div className="mb-2 font-heading text-base font-extrabold">
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
                className="min-h-[520px] w-full resize-y rounded-xl bg-white p-8 font-sans text-[13px] leading-relaxed outline-none neo-border"
              />
            ) : (
              <div className="overflow-x-auto pb-4">
                <AtsResumeTemplate
                  ref={exportRef}
                  document={resumeDocument}
                  variant="screen"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function buildMockResume(jobTitle: string, company: string): ResumeDocument {
  return buildResumeDocument(jobTitle, company);
}

export function buildMockResumeContent(
  jobTitle: string,
  company: string,
  profile?: ResumeProfileContext,
): string {
  let content = MOCK_RESUME.replace(
    "Frontend Engineer with 4 years",
    `${jobTitle} candidate with 4 years`,
  ).replace("Acme Corp", company);

  const fullName = profile?.fullName?.trim();
  const email = profile?.email?.trim();
  const location = profile?.location?.trim();
  const phone = profile?.phone?.trim();
  const targetRole = profile?.targetRole?.trim();
  const about = profile?.about?.trim();
  const skills = profile?.skills?.filter((skill) => skill.trim()).join(" · ");

  if (fullName) {
    content = replaceLine(content, "ALEX JOHNSON", fullName.toUpperCase());
  }

  const contactParts = [email, phone, location].filter(Boolean);
  if (contactParts.length > 0) {
    content = replaceLine(
      content,
      "alex@example.com · github.com/alexj · linkedin.com/in/alexj · San Francisco, CA",
      contactParts.join(" · "),
    );
  }

  if (targetRole || about) {
    content = replaceSection(
      content,
      "SUMMARY",
      about || `${targetRole ?? jobTitle} candidate with relevant experience.`,
    );
  } else {
    content = replaceSection(
      content,
      "SUMMARY",
      `${jobTitle} candidate with relevant experience.`,
    );
  }

  if (skills) {
    content = replaceSection(content, "SKILLS", skills);
  } else {
    content = replaceSection(content, "SKILLS", DEFAULT_SKILLS);
  }

  return content.replace(DEFAULT_SUMMARY, `${jobTitle} candidate with 4 years of experience.`);
}
