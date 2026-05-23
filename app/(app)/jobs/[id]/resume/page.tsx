"use client";

import { ResumeChat } from "@/components/resume/resume-chat";
import { ResumePreview } from "@/components/resume/resume-preview";
import { ErrorBanner, LoadingAI } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import {
  generateTailoredResume,
  refineResumeWithChat,
} from "@/lib/mock-ai";
import { exportElementToPdf } from "@/lib/pdf-export";
import { useRezume } from "@/lib/store";
import type { ChatMessage, ResumeContent } from "@/lib/types";
import { ArrowLeft, Download, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export default function ResumeBuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    getApplication,
    updateApplication,
    profile,
    baseResumeText,
    apiKey,
    addSavedResume,
  } = useRezume();
  const app = getApplication(id);

  const [resume, setResume] = useState<ResumeContent | null>(
    app?.tailoredResume ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>(app?.resumeChat ?? []);
  const [generating, setGenerating] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const runGenerate = useCallback(async () => {
    if (!app) return;
    if (!apiKey?.verified) {
      setError("Invalid or missing API key. Update in Settings.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await generateTailoredResume(
        profile,
        baseResumeText,
        app.jdText,
        app.jobTitle,
        app.company,
        app.metadata
      );
      setResume(result);
      updateApplication(id, { tailoredResume: result });
    } catch {
      setError("Resume generation failed. Check your API key and retry.");
    } finally {
      setGenerating(false);
    }
  }, [app, apiKey, profile, baseResumeText, id, updateApplication]);

  useEffect(() => {
    if (app && !resume && !generating) {
      runGenerate();
    }
  }, [app, resume, generating, runGenerate]);

  const handleChat = async (text: string) => {
    if (!resume) return;
    const userMsg: ChatMessage = {
      id: uuid(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setChatLoading(true);
    try {
      const updated = await refineResumeWithChat(resume, text);
      setResume(updated);
      const assistantMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        content: "Updated your resume based on your request.",
        timestamp: new Date().toISOString(),
      };
      const all = [...nextMessages, assistantMsg];
      setMessages(all);
      updateApplication(id, { tailoredResume: updated, resumeChat: all });
    } catch {
      setError("Could not apply changes. Try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      await exportElementToPdf(
        "resume-export",
        `${app?.company}-${app?.jobTitle}-resume.pdf`.replace(/\s+/g, "-")
      );
    } catch {
      setError("PDF export failed.");
    } finally {
      setExporting(false);
    }
  };

  if (!app) {
    return (
      <div className="p-8 font-bold">Job not found.</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neo-bg dot-grid">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-neo-ink bg-white px-4 py-3 md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/jobs/${id}`}
            className="flex items-center gap-1 text-sm font-bold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <p className="text-xs font-bold uppercase opacity-70">Resume builder</p>
            <p className="font-black">
              {app.jobTitle} @ {app.company}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <NeoButton
            variant="outline"
            size="sm"
            disabled={!resume}
            onClick={() => {
              if (resume) {
                addSavedResume(
                  `${app.company} — ${app.jobTitle}`,
                  JSON.stringify(resume)
                );
              }
            }}
          >
            <Save className="h-4 w-4" /> Save to library
          </NeoButton>
          <NeoButton
            variant="lime"
            size="sm"
            disabled={!resume || exporting}
            onClick={downloadPdf}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Download PDF"}
          </NeoButton>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row md:p-6">
        {error && (
          <div className="lg:col-span-2">
            <ErrorBanner message={error} onRetry={runGenerate} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col lg:max-w-[55%]">
          {generating && !resume && (
            <LoadingAI label="AI is tailoring your resume against the JD…" />
          )}
          {resume && (
            <div className="neo-card flex-1 overflow-auto p-2">
              <div id="resume-export">
                <ResumePreview resume={resume} />
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col lg:w-[42%] lg:min-w-[320px]">
          <ResumeChat
            messages={messages}
            onSend={handleChat}
            loading={chatLoading}
          />
        </div>
      </div>
    </div>
  );
}
