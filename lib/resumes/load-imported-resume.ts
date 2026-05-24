import { fileToBase64 } from "@/lib/resumes/import-resume-client";
import type { ResumeDocument } from "@/lib/resume-document";

export type ParsedResumeFile = {
  text: string;
  document: ResumeDocument;
};

export async function parseResumeFile(params: {
  fileName: string;
  mimeType?: string;
  data: string;
}): Promise<ParsedResumeFile> {
  const response = await fetch("/api/resumes/parse-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const raw = await response.text();
  let data: (ParsedResumeFile & { error?: string }) | null = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as ParsedResumeFile & { error?: string };
    } catch {
      if (!response.ok) {
        throw new Error(`Parse failed (${response.status})`);
      }
      throw new Error("Server returned an invalid response.");
    }
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Parse failed (${response.status})`);
  }

  if (!data?.document) {
    throw new Error("Server returned an empty parse result.");
  }

  return data;
}

export async function loadImportedResumeDocument(params: {
  downloadUrl: string;
  fileName: string;
  mimeType?: string;
}): Promise<ParsedResumeFile> {
  const response = await fetch(params.downloadUrl);
  if (!response.ok) {
    throw new Error("Could not download resume file.");
  }

  const blob = await response.blob();
  const data = await fileToBase64(blob);

  return parseResumeFile({
    fileName: params.fileName,
    mimeType: params.mimeType ?? blob.type,
    data,
  });
}
