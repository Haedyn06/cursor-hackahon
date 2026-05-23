"use client";

import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { ErrorBanner } from "@/components/ui/empty-state";
import {
  extractTextFromResumeFile,
  listFilledFields,
  mergeAutofillIntoProfile,
  parseResumeForAutofill,
  type ParsedResumeFields,
} from "@/lib/parse-resume";
import type { ExperienceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, FileUp, Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";

export type ProfileAutofillForm = {
  targetRole: string;
  experienceLevel: ExperienceLevel;
  topSkills: string;
  aboutYou: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export function ResumeUpload({
  baseResumeText,
  form,
  overwrite,
  onResumeText,
  onFormAutofill,
  onAutofillLabels,
}: {
  baseResumeText: string;
  form: ProfileAutofillForm;
  overwrite: boolean;
  onResumeText: (text: string) => void;
  onFormAutofill: (form: ProfileAutofillForm) => void;
  onAutofillLabels?: (labels: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filledLabels, setFilledLabels] = useState<string[]>([]);
  const [lastParsed, setLastParsed] = useState<ParsedResumeFields | null>(null);

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setFilledLabels([]);

    try {
      const text = await extractTextFromResumeFile(file);
      if (!text.trim()) {
        throw new Error("No text found in this file. Try a text-based PDF or paste instead.");
      }

      setFileName(file.name);
      onResumeText(text);

      const parsed = parseResumeForAutofill(text);
      setLastParsed(parsed);

      const merged = mergeAutofillIntoProfile(
        form,
        parsed,
        overwrite ? "overwrite" : "empty"
      );
      onFormAutofill(merged);
      const labels = listFilledFields(parsed);
      setFilledLabels(labels);
      onAutofillLabels?.(labels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read resume file.");
      setFileName(null);
    } finally {
      setParsing(false);
    }
  };

  const reapplyAutofill = () => {
    if (!lastParsed || !baseResumeText) return;
    const merged = mergeAutofillIntoProfile(
      form,
      lastParsed,
      overwrite ? "overwrite" : "empty"
    );
    onFormAutofill(merged);
    const labels = listFilledFields(lastParsed);
    setFilledLabels(labels);
    onAutofillLabels?.(labels);
  };

  return (
    <div className="space-y-4">
      <NeoCard
        className={cn(
          "flex flex-col items-center justify-center border-dashed py-10 transition-colors",
          parsing && "bg-neo-lime/20"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {parsing ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin" />
            <p className="font-bold">Reading resume & auto-filling fields…</p>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10" />
            <p className="font-black">Upload resume</p>
            <p className="mt-2 max-w-sm text-center text-sm font-medium opacity-80">
              PDF, .txt, or .md — we extract text and auto-fill your profile fields
            </p>
            <NeoButton
              type="button"
              variant="primary"
              className="mt-5"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" /> Choose file
            </NeoButton>
          </>
        )}
      </NeoCard>

      {error && <ErrorBanner message={error} onRetry={() => inputRef.current?.click()} />}

      {fileName && !parsing && (
        <div className="neo-card-flat flex items-start gap-3 border-neo-blue bg-neo-blue/10 p-4">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Uploaded: {fileName}</p>
            <p className="mt-1 text-sm font-medium">
              Resume text saved ({baseResumeText.length.toLocaleString()} characters)
            </p>
          </div>
        </div>
      )}

      {filledLabels.length > 0 && (
        <div className="neo-card bg-neo-lime/40 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <p className="font-black">Auto-filled from your resume</p>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {filledLabels.map((label) => (
              <span
                key={label}
                className="rounded-md border-2 border-neo-ink bg-white px-2 py-1 text-xs font-bold"
              >
                {label}
              </span>
            ))}
          </ul>
          {lastParsed && (
            <NeoButton
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={reapplyAutofill}
            >
              Re-apply autofill
            </NeoButton>
          )}
        </div>
      )}

      {baseResumeText && (
        <details className="neo-card-flat group">
          <summary className="cursor-pointer list-none font-bold marker:content-none">
            <span className="group-open:hidden">Preview extracted resume text</span>
            <span className="hidden group-open:inline">Hide extracted text</span>
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border-2 border-neo-ink/20 bg-neo-bg/50 p-3 text-xs font-medium">
            {baseResumeText.slice(0, 2000)}
            {baseResumeText.length > 2000 ? "\n\n…" : ""}
          </pre>
        </details>
      )}
    </div>
  );
}
