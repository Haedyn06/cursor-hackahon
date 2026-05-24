"use client";

import { useState } from "react";
import { NeoButton } from "@/components/ui/neo-button";

export type GeneratedCoverLetter = {
  id: number;
  title: string;
  matchJob: string;
  content: string;
};

type CoverLetterPreviewPanelProps = {
  coverLetter: GeneratedCoverLetter;
  onBack: () => void;
  onSave: (coverLetter: GeneratedCoverLetter) => void;
  onDownload: () => void;
};

export function CoverLetterPreviewPanel({
  coverLetter,
  onBack,
  onSave,
  onDownload,
}: CoverLetterPreviewPanelProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(coverLetter.content);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--background)]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b-[2.5px] border-[var(--foreground)] bg-white px-10 py-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1.5 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#888] underline transition-colors hover:text-[var(--foreground)]"
          >
            ← Back to library
          </button>
          <h1 className="font-heading text-[22px] font-extrabold">
            {coverLetter.title}
          </h1>
          <p className="text-sm font-medium text-gray-500">{coverLetter.matchJob}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {editing ? (
            <>
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setContent(coverLetter.content);
                  setEditing(false);
                }}
              >
                Cancel
              </NeoButton>
              <NeoButton
                variant="yellow"
                size="sm"
                onClick={() => {
                  onSave({ ...coverLetter, content });
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
                variant="yellow"
                size="sm"
                onClick={() => onSave({ ...coverLetter, content })}
              >
                Save to Library
              </NeoButton>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-y-auto p-10">
        <div className="mx-auto w-full max-w-[720px]">
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
  );
}

export function buildMockCoverLetterContent(
  jobTitle: string,
  company: string,
): string {
  return `Alex Johnson
alex@example.com · San Francisco, CA

${new Date().toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})}

Hiring Team
${company}

Dear Hiring Team,

I'm writing to express my strong interest in the ${jobTitle} role at ${company}. With four years of experience building polished, high-performance web applications in React and TypeScript, I'm excited by the opportunity to contribute to your team.

In my current role, I've shipped features used by thousands of users daily, partnered closely with design and product, and improved core flows through thoughtful frontend architecture. What draws me to ${company} is the chance to work on products with real impact while continuing to grow as an engineer in a collaborative environment.

I'd welcome the opportunity to discuss how my background in modern frontend development, attention to detail, and passion for great user experiences can support ${company}'s goals. Thank you for your time and consideration.

Best regards,
Alex Johnson`;
}
