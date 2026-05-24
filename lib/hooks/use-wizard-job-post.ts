"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useJobs } from "@/components/providers/jobs-provider";
import { useToast } from "@/components/providers";
import { loadAiSession } from "@/lib/ai/session";
import * as jobsClient from "@/lib/client/jobs-client";
import {
  canContinueWizardJobStep,
  EMPTY_WIZARD_JOB_FORM,
  resolveWizardJobContext,
  type WizardJobForm,
  type WizardJobSource,
  type WizardNewJobMode,
} from "@/lib/jobs/wizard-job-post";
import { isIndeedJobUrl } from "@/lib/scrape/indeed";

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function useWizardJobPost(open: boolean) {
  const toast = useToast();
  const { jobs } = useJobs();
  const [jobSource, setJobSource] = useState<WizardJobSource>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [newJobMode, setNewJobMode] = useState<WizardNewJobMode>("manual");
  const [form, setForm] = useState<WizardJobForm>(EMPTY_WIZARD_JOB_FORM);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setJobSource(null);
        setSelectedJobId(null);
        setNewJobMode("manual");
        setForm(EMPTY_WIZARD_JOB_FORM);
        setImporting(false);
        setImportError(null);
      });
    }
  }, [open]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  const jobContext = useMemo(
    () =>
      resolveWizardJobContext({
        jobSource,
        selectedJob,
        newJobMode,
        form,
      }),
    [jobSource, selectedJob, newJobMode, form],
  );

  const canContinue = canContinueWizardJobStep({
    jobSource,
    selectedJobId,
    newJobMode,
    form,
  });

  const applyExtractedFields = useCallback(
    (extracted: {
      title: string;
      company: string;
      jd: string;
      url?: string;
    }) => {
      setForm((current) => ({
        ...current,
        title: extracted.title || current.title,
        company: extracted.company || current.company,
        jd: extracted.jd || current.jd,
        url: extracted.url || current.url,
      }));
    },
    [],
  );

  const importFromLink = useCallback(async () => {
    const url = form.url.trim();
    if (!url) {
      setImportError("Paste a job posting URL first.");
      return;
    }

    const session = loadAiSession();
    const indeed = isIndeedJobUrl(url);

    if (!indeed && !session) {
      const message = "Connect an AI provider in Settings to import non-Indeed links.";
      setImportError(message);
      toast(message, "error");
      return;
    }

    setImportError(null);
    setImporting(true);

    try {
      const result = await jobsClient.importJobFromUrl({
        url,
        create: false,
        ...(session
          ? {
              providerId: session.providerId,
              apiKey: session.apiKey,
              model: session.model,
            }
          : {}),
      });

      applyExtractedFields({
        title: result.extracted.title,
        company: result.extracted.company,
        jd: result.extracted.jd,
        url: result.scraped.finalUrl || url,
      });
      toast("Job posting imported!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import job posting.";
      setImportError(message);
      toast(message, "error");
    } finally {
      setImporting(false);
    }
  }, [applyExtractedFields, form.url, toast]);

  const importFromPaste = useCallback(async () => {
    const pageText = form.pastedText.trim();
    if (pageText.length < 80) {
      setImportError("Paste at least a few paragraphs of the job posting.");
      return;
    }

    const session = loadAiSession();
    if (!session) {
      const message = "Connect an AI provider in Settings to extract pasted postings.";
      setImportError(message);
      toast(message, "error");
      return;
    }

    setImportError(null);
    setImporting(true);

    try {
      const result = await jobsClient.importJobFromPaste({
        url: form.url.trim() || undefined,
        pageText,
        create: false,
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
      });

      applyExtractedFields({
        title: result.extracted.title,
        company: result.extracted.company,
        jd: result.extracted.jd,
        url: form.url.trim() || undefined,
      });
      toast("Job posting extracted!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to extract pasted posting.";
      setImportError(message);
      toast(message, "error");
    } finally {
      setImporting(false);
    }
  }, [applyExtractedFields, form.pastedText, form.url, toast]);

  const importFromFile = useCallback(
    async (file: File) => {
      setImportError(null);
      setImporting(true);

      try {
        const response = await fetch("/api/jobs/extract-posting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploads: [
              {
                name: file.name,
                type: file.type || "application/octet-stream",
                data: await fileToBase64(file),
              },
            ],
          }),
        });

        const body = (await response.json().catch(() => ({}))) as {
          text?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? "Failed to read file.");
        }

        const text = body.text?.trim() ?? "";
        setForm((current) => ({ ...current, jd: text }));

        const session = loadAiSession();
        if (session && text.length >= 80) {
          const result = await jobsClient.importJobFromPaste({
            pageText: text,
            create: false,
            providerId: session.providerId,
            apiKey: session.apiKey,
            model: session.model,
          });

          applyExtractedFields({
            title: result.extracted.title,
            company: result.extracted.company,
            jd: result.extracted.jd,
          });
        }

        toast("Job description loaded from file.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to read job posting file.";
        setImportError(message);
        toast(message, "error");
      } finally {
        setImporting(false);
      }
    },
    [applyExtractedFields, toast],
  );

  return {
    jobs,
    jobSource,
    setJobSource,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    newJobMode,
    setNewJobMode,
    form,
    setForm,
    importing,
    importError,
    jobContext,
    canContinue,
    importFromLink,
    importFromPaste,
    importFromFile,
  };
}

export type WizardJobPostState = ReturnType<typeof useWizardJobPost>;
