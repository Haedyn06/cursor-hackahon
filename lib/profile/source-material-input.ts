import type { Id } from "@/convex/_generated/dataModel";

export type SourceMaterialRequestInput = {
  label: string;
  fileName: string;
  mimeType?: string;
  sourceKind?: "autofill" | "import";
  inputKind?: "upload" | "paste";
  text?: string;
  data?: string;
};

type ProfileSourceMaterialForAi = {
  _id: Id<"profileSourceMaterials">;
  storageId?: Id<"_storage">;
  label: string;
  fileName: string;
  mimeType?: string;
  sourceKind: "autofill" | "import";
  inputKind: "upload" | "paste";
};

type PrepareSourceMaterialInputsOptions = {
  maxMaterials?: number;
  maxBytesPerMaterial?: number;
};

const DEFAULT_MAX_MATERIALS = 8;
const DEFAULT_MAX_BYTES_PER_MATERIAL = 800_000;

function isReadableSourceMaterial(material: ProfileSourceMaterialForAi): boolean {
  const mimeType = material.mimeType ?? "";
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    /\.(txt|pdf|docx?)$/i.test(material.fileName)
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(blob);
  });
}

export async function prepareSourceMaterialInputs(
  materials: ProfileSourceMaterialForAi[],
  getDownloadUrl: (sourceMaterialId: Id<"profileSourceMaterials">) => Promise<string | null>,
  options: PrepareSourceMaterialInputsOptions = {},
): Promise<SourceMaterialRequestInput[]> {
  const maxMaterials = options.maxMaterials ?? DEFAULT_MAX_MATERIALS;
  const maxBytesPerMaterial =
    options.maxBytesPerMaterial ?? DEFAULT_MAX_BYTES_PER_MATERIAL;
  const inputs: SourceMaterialRequestInput[] = [];

  for (const material of materials) {
    if (inputs.length >= maxMaterials) break;
    if (!material.storageId || !isReadableSourceMaterial(material)) continue;

    const url = await getDownloadUrl(material._id);
    if (!url) continue;

    const response = await fetch(url);
    if (!response.ok) continue;

    const blob = await response.blob();
    if (blob.size > maxBytesPerMaterial) continue;

    inputs.push({
      label: material.label,
      fileName: material.fileName,
      mimeType: material.mimeType || blob.type || undefined,
      sourceKind: material.sourceKind,
      inputKind: material.inputKind,
      data: await blobToBase64(blob),
    });
  }

  return inputs;
}
