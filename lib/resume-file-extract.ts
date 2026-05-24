import "server-only";

import mammoth from "mammoth";

function isDocx(fileName: string, mimeType: string) {
  return (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    /\.docx?$/i.test(fileName)
  );
}

function isPdf(fileName: string, mimeType: string) {
  return mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
}

function isPlainText(fileName: string, mimeType: string) {
  return mimeType.startsWith("text/") || /\.txt$/i.test(fileName);
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType = "",
): Promise<string> {
  if (isPlainText(fileName, mimeType)) {
    return buffer.toString("utf-8").trim();
  }

  if (isDocx(fileName, mimeType)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (isPdf(fileName, mimeType)) {
    // Import the parser directly — the package entry runs debug code that
    // tries to open ./test/data/05-versions-space.pdf when bundled by Next.js.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  throw new Error(`Unsupported file type for "${fileName}". Use PDF, DOCX, or TXT.`);
}

export async function extractTextFromUploads(
  uploads: Array<{ name: string; type: string; buffer: Buffer }>,
): Promise<string[]> {
  const chunks: string[] = [];

  for (const upload of uploads) {
    const text = await extractTextFromBuffer(
      upload.buffer,
      upload.name,
      upload.type,
    );
    if (text) {
      chunks.push(`--- ${upload.name} ---\n${text}`);
    }
  }

  return chunks;
}

export function combineAutofillSourceText(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
