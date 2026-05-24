"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { NeoBadge } from "@/components/ui/neo-badge";
import { NeoButton } from "@/components/ui/neo-button";
import { cn } from "@/lib/utils";

export type ProfileSourceMaterial = {
  _id: Id<"profileSourceMaterials">;
  storageId?: Id<"_storage">;
  label: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceKind: "autofill" | "import";
  inputKind: "upload" | "paste";
  createdAt: number;
};

type ProfileSourcePanelProps = {
  materials: ProfileSourceMaterial[];
  onAddMaterials?: () => void;
  onRefillWithAi?: () => void;
  addingMaterials?: boolean;
  refillingWithAi?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function formatBytes(sizeBytes?: number) {
  if (!sizeBytes) return "";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fileIcon(material: ProfileSourceMaterial) {
  const mimeType = material.mimeType ?? "";
  const fileName = material.fileName.toLowerCase();
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) return "PDF";
  if (mimeType.includes("text") || fileName.endsWith(".txt")) return "TXT";
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "DOC";
  return "FILE";
}

function sourceLabel(material: ProfileSourceMaterial) {
  return material.sourceKind === "autofill" ? "Autofill" : "Import";
}

function Preview({
  material,
  url,
  textPreview,
  loading,
}: {
  material?: ProfileSourceMaterial;
  url: string | null;
  textPreview: string;
  loading: boolean;
}) {
  if (!material) {
    return (
      <div className="rounded-xl bg-[var(--background)] p-4 text-sm font-bold text-[#888] neo-border-sm">
        Select a source to preview it.
      </div>
    );
  }

  if (!material.storageId) {
    return (
      <div className="rounded-xl bg-[var(--peach-l)] p-4 text-sm font-bold text-[#77512e] neo-border-sm">
        Content unavailable. Re-upload or re-paste this material during
        onboarding to restore the preview.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--background)] p-4 text-sm font-bold text-[#888] neo-border-sm">
        Loading preview...
      </div>
    );
  }

  if (!url) {
    return (
      <div className="rounded-xl bg-[var(--red-l)] p-4 text-sm font-bold text-[#800] neo-border-sm">
        Could not load this source material.
      </div>
    );
  }

  const mimeType = material.mimeType ?? "";
  const fileName = material.fileName.toLowerCase();

  if (mimeType.startsWith("image/")) {
    return (
      <img
        src={url}
        alt={material.label}
        className="max-h-[340px] w-full rounded-xl object-contain bg-white neo-border-sm"
      />
    );
  }

  if (mimeType.includes("text") || fileName.endsWith(".txt")) {
    return (
      <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--background)] p-3 text-xs leading-relaxed font-medium neo-border-sm">
        {textPreview || "No text preview available."}
      </pre>
    );
  }

  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
    return (
      <div className="flex flex-col gap-2">
        <iframe
          src={url}
          title={material.label}
          className="h-[340px] w-full rounded-xl bg-white neo-border-sm"
        />
        <NeoButton
          variant="secondary"
          size="sm"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          Open PDF
        </NeoButton>
      </div>
    );
  }

  return (
    <NeoButton
      variant="secondary"
      size="sm"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      Download source
    </NeoButton>
  );
}

function PanelBody({
  materials,
  onAddMaterials,
  onRefillWithAi,
  addingMaterials = false,
  refillingWithAi = false,
  onMobileClose,
}: {
  materials: ProfileSourceMaterial[];
  onAddMaterials?: () => void;
  onRefillWithAi?: () => void;
  addingMaterials?: boolean;
  refillingWithAi?: boolean;
  onMobileClose?: () => void;
}) {
  const getDownloadUrl = useMutation(api.onboarding.getProfileSourceDownloadUrl);
  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => b.createdAt - a.createdAt),
    [materials],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const selected =
    (selectedId
      ? sortedMaterials.find((material) => material._id === selectedId)
      : undefined) ?? sortedMaterials[0];

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setUrl(null);
      setTextPreview("");
      if (!selected?.storageId) return;

      setLoading(true);
      try {
        const nextUrl = await getDownloadUrl({
          sourceMaterialId: selected._id,
        });
        if (cancelled) return;
        setUrl(nextUrl);

        const mimeType = selected.mimeType ?? "";
        if (
          nextUrl &&
          (mimeType.includes("text") || selected.fileName.endsWith(".txt"))
        ) {
          const response = await fetch(nextUrl);
          if (!cancelled && response.ok) {
            setTextPreview(await response.text());
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [getDownloadUrl, selected]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b-[2.5px] border-[var(--foreground)] px-4 py-4">
        <div>
          <div className="font-heading text-lg font-extrabold">
            Source Materials
          </div>
          <p className="mt-0.5 text-xs font-medium text-[#666]">
            Files and text used to build and refill your profile.
          </p>
        </div>
        {onMobileClose ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="cursor-pointer rounded-full bg-white px-2 py-1 text-xs font-extrabold neo-border-sm xl:hidden"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-b-[2.5px] border-[var(--foreground)] px-4 py-3">
        <NeoButton
          variant="secondary"
          size="sm"
          onClick={onAddMaterials}
          disabled={addingMaterials}
        >
          {addingMaterials ? "Uploading..." : "+ Add materials"}
        </NeoButton>
        <NeoButton
          variant="mint"
          size="sm"
          onClick={onRefillWithAi}
          disabled={refillingWithAi || sortedMaterials.length === 0}
        >
          {refillingWithAi ? "Refilling..." : "Refill with AI"}
        </NeoButton>
      </div>

      {sortedMaterials.length === 0 ? (
        <div className="p-4">
          <div className="rounded-xl bg-[var(--background)] p-4 text-sm font-bold text-[#777] neo-border-sm">
            No source materials yet. Upload or paste files during onboarding to
            populate this panel.
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="max-h-[260px] shrink-0 overflow-y-auto border-b-[2.5px] border-[var(--foreground)] p-3">
            <div className="flex flex-col gap-2">
              {sortedMaterials.map((material) => {
                const active = material._id === selected?._id;
                return (
                  <button
                    key={material._id}
                    type="button"
                    onClick={() => setSelectedId(material._id)}
                    className={cn(
                      "cursor-pointer rounded-xl p-3 text-left transition-colors",
                      active
                        ? "bg-[var(--mint)] neo-border-sm"
                        : "bg-white hover:bg-[var(--mint-l)] neo-border-sm",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--lav-l)] text-[10px] font-extrabold neo-border-sm">
                        {fileIcon(material)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold">
                          {material.label || material.fileName}
                        </div>
                        <div className="truncate text-[11px] font-medium text-[#666]">
                          {material.fileName}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <NeoBadge
                        color={
                          material.sourceKind === "autofill"
                            ? "var(--lav)"
                            : "var(--mint)"
                        }
                        className="text-[10px]"
                      >
                        {sourceLabel(material)}
                      </NeoBadge>
                      <NeoBadge color="var(--yellow-l)" className="text-[10px]">
                        {material.inputKind === "paste" ? "Paste" : "Upload"}
                      </NeoBadge>
                      <span className="text-[10px] font-bold text-[#888]">
                        {[formatBytes(material.sizeBytes), formatDate(material.createdAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <Preview
              material={selected}
              url={url}
              textPreview={textPreview}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileSourcePanel({
  materials,
  onAddMaterials,
  onRefillWithAi,
  addingMaterials = false,
  refillingWithAi = false,
  mobileOpen = false,
  onMobileClose,
}: ProfileSourcePanelProps) {
  return (
    <>
      <aside className="hidden w-[320px] shrink-0 border-l-[2.5px] border-[var(--foreground)] xl:block">
        <PanelBody
          materials={materials}
          onAddMaterials={onAddMaterials}
          onRefillWithAi={onRefillWithAi}
          addingMaterials={addingMaterials}
          refillingWithAi={refillingWithAi}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[300] bg-black/30 xl:hidden">
          <div className="ml-auto h-full w-[min(380px,calc(100vw-24px))] border-l-[2.5px] border-[var(--foreground)]">
            <PanelBody
              materials={materials}
              onAddMaterials={onAddMaterials}
              onRefillWithAi={onRefillWithAi}
              addingMaterials={addingMaterials}
              refillingWithAi={refillingWithAi}
              onMobileClose={onMobileClose}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
