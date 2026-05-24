"use client";

import type { DownloadFormat } from "@/components/ui/download-format-dialog";
import { exportElementToPdf, exportPlainText } from "@/lib/pdf-export";
import { exportProfileToDocx } from "@/lib/profile-docx-export";
import {
  profileExportToPlainText,
  type ProfileExportDocument,
} from "@/lib/profile-export-document";

export type {
  ProfileExportDocument,
  ProfileLanguage,
  ProfileLibraryEntry,
  ProfileLink,
} from "@/lib/profile-export-document";
export {
  buildProfileExportDocument,
  profileExportToPlainText,
  profileExportToResumeDocument,
} from "@/lib/profile-export-document";

async function renderProfileExportOffscreen(
  document: ProfileExportDocument,
): Promise<HTMLElement> {
  const { createElement } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { ProfileExportTemplate } = await import(
    "@/components/profile/profile-export-template"
  );

  const host = window.document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  window.document.body.appendChild(host);

  const root = createRoot(host);
  root.render(createElement(ProfileExportTemplate, { document, variant: "print" }));

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const target = host.firstElementChild;
  if (!(target instanceof HTMLElement)) {
    root.unmount();
    host.remove();
    throw new Error("Failed to render profile for export.");
  }

  return target;
}

function cleanupOffscreenHost(target: HTMLElement) {
  target.parentElement?.remove();
}

export async function exportProfileDocument(
  document: ProfileExportDocument,
  filename: string,
  format: DownloadFormat,
) {
  if (format === "txt") {
    exportPlainText(profileExportToPlainText(document), filename);
    return;
  }

  if (format === "docx") {
    const blob = await exportProfileToDocx(document);
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80)}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const target = await renderProfileExportOffscreen(document);
  try {
    await exportElementToPdf(target, filename);
  } finally {
    cleanupOffscreenHost(target);
  }
}
