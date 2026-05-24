import "server-only";

import {
  buildSourceMaterialContext,
  type SourceMaterialContextItem,
} from "@/lib/ai/source-material-context";
import { extractTextFromBuffer } from "@/lib/resume-file-extract";

export type SourceMaterialRequestItem = {
  label: string;
  fileName: string;
  mimeType?: string;
  sourceKind?: "autofill" | "import";
  inputKind?: "upload" | "paste";
  text?: string;
  data?: string;
};

function isSourceKind(value: unknown): value is SourceMaterialRequestItem["sourceKind"] {
  return value === "autofill" || value === "import";
}

function isInputKind(value: unknown): value is SourceMaterialRequestItem["inputKind"] {
  return value === "upload" || value === "paste";
}

export function parseSourceMaterialRequestItems(
  value: unknown,
): SourceMaterialRequestItem[] {
  if (!Array.isArray(value)) return [];

  const materials: SourceMaterialRequestItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.label !== "string" || typeof record.fileName !== "string") {
      continue;
    }

    materials.push({
      label: record.label,
      fileName: record.fileName,
      mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined,
      sourceKind: isSourceKind(record.sourceKind) ? record.sourceKind : undefined,
      inputKind: isInputKind(record.inputKind) ? record.inputKind : undefined,
      text: typeof record.text === "string" ? record.text : undefined,
      data: typeof record.data === "string" ? record.data : undefined,
    });
  }

  return materials;
}

export async function buildSourceMaterialContextFromRequest(
  materials: SourceMaterialRequestItem[],
): Promise<string> {
  const readable: SourceMaterialContextItem[] = [];

  for (const material of materials) {
    let text = material.text?.trim() ?? "";

    if (!text && material.data && !material.mimeType?.startsWith("image/")) {
      try {
        text = await extractTextFromBuffer(
          Buffer.from(material.data, "base64"),
          material.fileName,
          material.mimeType,
        );
      } catch {
        text = "";
      }
    }

    if (!text) continue;

    readable.push({
      label: material.label,
      fileName: material.fileName,
      mimeType: material.mimeType,
      sourceKind: material.sourceKind,
      inputKind: material.inputKind,
      text,
    });
  }

  return buildSourceMaterialContext(readable);
}
