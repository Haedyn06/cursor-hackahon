"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoTabs } from "@/components/ui/neo-tabs";
import { useToast } from "@/components/providers";
import {
  toResumeDisplayName,
  uploadResumeFile,
} from "@/lib/resumes/import-resume-client";

type ImportResumePanelProps = {
  compact?: boolean;
  onImported?: () => void;
};

const IMPORT_TABS = [
  { id: "upload", label: "Upload file", icon: "📤" },
  { id: "paste", label: "Paste text", icon: "📋" },
] as const;

type ImportTab = (typeof IMPORT_TABS)[number]["id"];

export function ImportResumePanel({
  compact = false,
  onImported,
}: ImportResumePanelProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateResumeUploadUrl = useMutation(api.onboarding.generateResumeUploadUrl);
  const saveUploadedResume = useMutation(api.onboarding.saveUploadedResume);
  const savePastedResume = useMutation(api.onboarding.savePastedResume);
  const saveProfileSourceMaterial = useMutation(api.onboarding.saveProfileSourceMaterial);
  const [activeTab, setActiveTab] = useState<ImportTab>("upload");
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  const importFile = async (file: File) => {
    const uploadUrl = await generateResumeUploadUrl({});
    const storageId = await uploadResumeFile(uploadUrl, file);
    const displayName = toResumeDisplayName(file.name);

    await saveProfileSourceMaterial({
      material: {
        storageId: storageId as never,
        label: displayName,
        fileName: file.name,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
        sourceKind: "import",
        inputKind: "upload",
      },
    });

    await saveUploadedResume({
      storageId: storageId as never,
      fileName: file.name,
      displayName,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    try {
      for (const file of Array.from(files)) {
        await importFile(file);
      }
      toast(
        files.length === 1
          ? "Resume added to your library."
          : `${files.length} resumes added to your library.`,
      );
      onImported?.();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not import resume.",
        "error",
      );
    } finally {
      setImporting(false);
    }
  };

  const handlePasteImport = async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length < 20) {
      toast("Paste at least a few lines of resume text.", "warn");
      return;
    }

    setImporting(true);
    try {
      const displayName = `Pasted resume ${new Date().toLocaleDateString("en-US")}`;
      const fileName = `${displayName}.txt`;
      const textFile = new File([trimmed], fileName, { type: "text/plain" });
      const uploadUrl = await generateResumeUploadUrl({});
      const storageId = await uploadResumeFile(uploadUrl, textFile);

      await saveProfileSourceMaterial({
        material: {
          storageId: storageId as never,
          label: displayName,
          fileName,
          mimeType: textFile.type,
          sizeBytes: textFile.size,
          sourceKind: "import",
          inputKind: "paste",
        },
      });

      await savePastedResume({
        storageId: storageId as never,
        fileName,
        displayName,
        mimeType: textFile.type,
        sizeBytes: textFile.size,
      });

      setPasteText("");
      toast("Resume added to your library.");
      onImported?.();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not import pasted resume.",
        "error",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-2xl bg-white p-4 neo-border"}>
      {!compact ? (
        <div>
          <div className="font-heading text-base font-extrabold">Import your resume</div>
          <p className="mt-1 text-xs font-medium text-[#777]">
            Add resumes to your library for match scoring and job tailoring.
          </p>
        </div>
      ) : null}

      <NeoTabs
        tabs={[...IMPORT_TABS]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ImportTab)}
      />

      {activeTab === "upload" ? (
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-[#777]">
            Upload PDF, DOCX, or TXT to add it to your resume library.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <NeoButton
              variant="mint"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? "Importing…" : "Choose file"}
            </NeoButton>
            <span className="text-[11px] font-medium text-[#888]">PDF · DOCX · TXT</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-[#777]">
            Paste plain-text resume content if you do not have a file handy.
          </p>
          <textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder="Paste your resume content here…"
            rows={compact ? 4 : 6}
            className="w-full resize-y rounded-xl bg-[var(--background)] p-3 font-sans text-sm leading-relaxed outline-none neo-border-sm"
          />
          <NeoButton
            variant="secondary"
            size="sm"
            disabled={importing || pasteText.trim().length < 20}
            onClick={() => void handlePasteImport()}
          >
            Import pasted text
          </NeoButton>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
