export type SourceMaterialContextItem = {
  label: string;
  fileName: string;
  mimeType?: string;
  sourceKind?: "autofill" | "import";
  inputKind?: "upload" | "paste";
  text: string;
};

type BuildSourceMaterialContextOptions = {
  maxMaterials?: number;
  maxCharsPerMaterial?: number;
  maxTotalChars?: number;
};

const DEFAULT_MAX_MATERIALS = 8;
const DEFAULT_MAX_CHARS_PER_MATERIAL = 5000;
const DEFAULT_MAX_TOTAL_CHARS = 18000;

function cleanText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 24)).trimEnd()}\n[truncated]`;
}

export function buildSourceMaterialContext(
  materials: SourceMaterialContextItem[],
  options: BuildSourceMaterialContextOptions = {},
): string {
  const maxMaterials = options.maxMaterials ?? DEFAULT_MAX_MATERIALS;
  const maxCharsPerMaterial =
    options.maxCharsPerMaterial ?? DEFAULT_MAX_CHARS_PER_MATERIAL;
  const maxTotalChars = options.maxTotalChars ?? DEFAULT_MAX_TOTAL_CHARS;

  const sections: string[] = [];
  let remainingChars = maxTotalChars;

  for (const material of materials.slice(0, maxMaterials)) {
    if (remainingChars <= 0) break;

    const text = cleanText(material.text);
    if (!text) continue;

    const sourceLabel = [material.sourceKind, material.inputKind]
      .filter(Boolean)
      .join(" / ");
    const header = [
      `Material: ${material.label || material.fileName}`,
      `File: ${material.fileName}`,
      sourceLabel ? `Source: ${sourceLabel}` : "",
      material.mimeType ? `Type: ${material.mimeType}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const body = truncate(text, Math.min(maxCharsPerMaterial, remainingChars));
    const section = `${header}\nText:\n${body}`;
    sections.push(section);
    remainingChars -= section.length;
  }

  if (sections.length === 0) return "";

  return `SOURCE MATERIALS (supplemental supporting evidence)
Use these materials to enrich wording, recover missing detail, and find profile-backed evidence. The structured candidate profile remains the canonical source of truth. If source materials conflict with the profile, prefer the profile and do not invent facts.

${sections.join("\n\n---\n\n")}`;
}
