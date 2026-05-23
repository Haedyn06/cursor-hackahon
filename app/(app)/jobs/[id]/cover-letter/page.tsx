"use client";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingAI, ErrorBanner } from "@/components/ui/empty-state";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { NeoTextarea } from "@/components/ui/neo-input";
import { generateCoverLetter, streamText } from "@/lib/mock-ai";
import { exportElementToPdf } from "@/lib/pdf-export";
import { useRezume } from "@/lib/store";
import { ArrowLeft, Copy, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CoverLetterPage() {
  const params = useParams();
  const id = params.id as string;
  const { getApplication, updateApplication, profile, apiKey } = useRezume();
  const app = getApplication(id);

  const [body, setBody] = useState(app?.coverLetter?.body ?? "");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (app?.coverLetter?.body && !body) {
      setBody(app.coverLetter.body);
    }
  }, [app, body]);

  const generate = async () => {
    if (!app) return;
    if (!apiKey?.verified) {
      setError("Invalid API key. Check Settings.");
      return;
    }
    setLoading(true);
    setStreaming(true);
    setError(null);
    try {
      const full = await generateCoverLetter(
        profile,
        app.jobTitle,
        app.company,
        app.jdText
      );
      let displayed = "";
      for await (const chunk of streamText(full)) {
        displayed = chunk;
        setBody(displayed);
      }
      updateApplication(id, {
        coverLetter: { body: full, generatedAt: new Date().toISOString() },
      });
    } catch {
      setError("Generation failed.");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!app) {
    return (
      <AppShell title="Not found">
        <p className="font-bold">Job not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Cover letter">
      <Link
        href={`/jobs/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> {app.jobTitle}
      </Link>

      {error && <ErrorBanner message={error} onRetry={generate} />}

      <div className="mb-4 flex flex-wrap gap-3">
        <NeoButton variant="primary" onClick={generate} disabled={loading}>
          {body ? "Regenerate" : "Generate cover letter"}
        </NeoButton>
        <NeoButton disabled={!body} onClick={copy}>
          <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy"}
        </NeoButton>
        <NeoButton
          variant="lime"
          disabled={!body}
          onClick={() =>
            exportElementToPdf("cover-letter-export", `${app.company}-cover-letter.pdf`)
          }
        >
          <Download className="h-4 w-4" /> Download PDF
        </NeoButton>
      </div>

      {(loading || streaming) && <LoadingAI label="Drafting your cover letter…" />}

      <NeoCard>
        <div id="cover-letter-export" className="bg-white p-6">
          {body ? (
            <NeoTextarea
              className="min-h-[400px] border-0 shadow-none focus:shadow-none"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                updateApplication(id, {
                  coverLetter: {
                    body: e.target.value,
                    generatedAt: new Date().toISOString(),
                  },
                });
              }}
            />
          ) : (
            <p className="font-medium opacity-70">
              Click generate to create a cover letter from your Ultimate Profile — not
              just your resume.
            </p>
          )}
        </div>
      </NeoCard>
    </AppShell>
  );
}
