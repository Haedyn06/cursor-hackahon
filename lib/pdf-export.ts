"use client";

import type { DownloadFormat } from "@/components/ui/download-format-dialog";
import {
  type ResumeDocument,
  resumeDocumentToPlainText,
} from "@/lib/resume-document";
import { exportResumeToDocx } from "@/lib/docx-export";
import { resumeDocumentToExportElement } from "@/lib/resume-html-export";

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function downloadBlob(blob: Blob, filename: string, extension: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFilename(filename)}.${extension}`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function loadHtml2Pdf() {
  const module = await import("html2pdf.js");
  return module.default ?? module;
}

async function waitForPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function stripUnsupportedStyles(clonedDoc: Document) {
  clonedDoc
    .querySelectorAll("link[rel='stylesheet'], style")
    .forEach((node) => node.remove());

  clonedDoc.documentElement.style.background = "#ffffff";
  clonedDoc.documentElement.style.color = "#111111";
  clonedDoc.body.style.background = "#ffffff";
  clonedDoc.body.style.color = "#111111";
}

function mountExportElement(element: HTMLElement): {
  element: HTMLElement;
  cleanup: () => void;
} {
  const host = document.createElement("div");
  host.setAttribute("data-export-host", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;background:#ffffff;color:#111111;";
  host.appendChild(element);
  document.body.appendChild(host);

  return {
    element,
    cleanup: () => {
      host.remove();
    },
  };
}

function mountExportText(content: string): { element: HTMLElement; cleanup: () => void } {
  const page = document.createElement("div");
  applyExportPageStyles(page);
  page.textContent = content;
  return mountExportElement(page);
}

function applyExportPageStyles(page: HTMLElement) {
  Object.assign(page.style, {
    width: "8.5in",
    minHeight: "11in",
    padding: "1in",
    background: "#ffffff",
    color: "#111111",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "12pt",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  });
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
) {
  const html2pdf = await loadHtml2Pdf();

  await html2pdf()
    .set({
      margin: 0,
      filename: `${sanitizeFilename(filename)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        foreignObjectRendering: false,
        onclone: (clonedDoc: Document) => {
          stripUnsupportedStyles(clonedDoc);
        },
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    })
    .from(element)
    .save();
}

export function exportPlainText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename, "txt");
}

async function renderTextOffscreen(
  content: string,
): Promise<{ element: HTMLElement; cleanup: () => void }> {
  const mounted = mountExportText(content);
  await waitForPaint();
  return mounted;
}

async function renderResumeOffscreen(
  resume: ResumeDocument,
): Promise<{ element: HTMLElement; cleanup: () => void }> {
  const mounted = mountExportElement(resumeDocumentToExportElement(resume));
  await waitForPaint();
  return mounted;
}

export async function exportTextDocument(
  content: string,
  filename: string,
  format: DownloadFormat,
) {
  if (format === "txt") {
    exportPlainText(content, filename);
    return;
  }

  if (format === "docx") {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const paragraphs = content.split(/\n{2,}/).map((block) =>
      new Paragraph({
        children: block.split("\n").flatMap((line, index, lines) => {
          const runs = [new TextRun({ text: line, font: "Georgia", size: 24 })];
          return index < lines.length - 1 ? [...runs, new TextRun({ break: 1 })] : runs;
        }),
        spacing: { after: 200 },
      }),
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, filename, "docx");
    return;
  }

  const { element, cleanup } = await renderTextOffscreen(content);
  try {
    await exportElementToPdf(element, filename);
  } finally {
    cleanup();
  }
}

export async function exportResumeToDocxFile(
  resume: ResumeDocument,
  filename: string,
) {
  const blob = await exportResumeToDocx(resume);
  downloadBlob(
    blob,
    filename,
    "docx",
  );
}

export async function exportResumeDocumentStandalone(
  resume: ResumeDocument,
  filename: string,
  format: DownloadFormat,
) {
  if (format === "txt") {
    exportPlainText(resumeDocumentToPlainText(resume), filename);
    return;
  }

  if (format === "docx") {
    await exportResumeToDocxFile(resume, filename);
    return;
  }

  const { element, cleanup } = await renderResumeOffscreen(resume);
  try {
    await exportElementToPdf(element, filename);
  } finally {
    cleanup();
  }
}

export async function exportResume(
  _element: HTMLElement | null,
  resume: ResumeDocument,
  filename: string,
  format: DownloadFormat,
) {
  if (format === "txt") {
    exportPlainText(resumeDocumentToPlainText(resume), filename);
    return;
  }

  if (format === "docx") {
    await exportResumeToDocxFile(resume, filename);
    return;
  }

  await exportResumeDocumentStandalone(resume, filename, "pdf");
}
