export function toResumeDisplayName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export async function uploadResumeFile(uploadUrl: string, file: File) {
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!result.ok) {
    throw new Error("Upload failed");
  }

  const { storageId } = (await result.json()) as { storageId: string };
  return storageId;
}

export async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
