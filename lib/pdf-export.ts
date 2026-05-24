"use client";

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { DownloadFormat } from "@/components/ui/download-format-dialog";
import { AtsResumeTemplate } from "@/components/resume/ats-resume-template";
import {
  type ResumeDocument,
  resumeDocumentToPlainText,
} from "@/lib/resume-document";
import { exportResumeToDocx } from "@/lib/docx-export";

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function downloadBlob(blob: Blob, filename: string, extension: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFilename(filename)}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
) {
  const html2pdf = (await import("html2pdf.js")).default;

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

async function renderTextOffscreen(content: string): Promise<HTMLElement> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);

  const page = document.createElement("div");
  page.style.width = "8.5in";
  page.style.minHeight = "11in";
  page.style.padding = "1in";
  page.style.background = "#ffffff";
  page.style.color = "#111111";
  page.style.fontFamily = "Georgia, 'Times New Roman', serif";
  page.style.fontSize = "12pt";
  page.style.lineHeight = "1.6";
  page.style.whiteSpace = "pre-wrap";
  page.textContent = content;
  host.appendChild(page);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  return page;
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

  const target = await renderTextOffscreen(content);
  try {
    await exportElementToPdf(target, filename);
  } finally {
    cleanupOffscreenHost(target);
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

async function renderResumeOffscreen(resume: ResumeDocument): Promise<HTMLElement> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(createElement(AtsResumeTemplate, { document: resume, variant: "print" }));

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const target = host.firstElementChild;
  if (!(target instanceof HTMLElement)) {
    root.unmount();
    host.remove();
    throw new Error("Failed to render resume for export.");
  }

  return target;
}

function cleanupOffscreenHost(target: HTMLElement) {
  const host = target.parentElement;
  if (host) {
    host.remove();
  }
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

  const target = await renderResumeOffscreen(resume);
  try {
    await exportElementToPdf(target, filename);
  } finally {
    cleanupOffscreenHost(target);
  }
}

export async function exportResume(
  element: HTMLElement | null,
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

  if (element) {
    await exportElementToPdf(element, filename);
    return;
  }

  await exportResumeDocumentStandalone(resume, filename, format);
}
