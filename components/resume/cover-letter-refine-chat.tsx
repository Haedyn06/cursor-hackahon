"use client";

import { useState } from "react";
import { NeoBadge } from "@/components/ui/neo-badge";
import { refineTailoredCoverLetter } from "@/lib/ai/client";
import { loadAiSession } from "@/lib/ai/session";
import { normalizeResumeRefineContext } from "@/lib/jobs/normalize-job";
import type { ResumeRefineJobContext } from "@/components/resume/resume-refine-chat";

type CoverLetterRefineChatProps = {
  content: string;
  job: ResumeRefineJobContext;
  onCoverLetterUpdated: (payload: { content: string; reply: string }) => void;
  accentColor?: string;
};

export function CoverLetterRefineChat({
  content,
  job: rawJob,
  onCoverLetterUpdated,
  accentColor = "var(--yellow)",
}: CoverLetterRefineChatProps) {
  const job = normalizeResumeRefineContext(rawJob);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: "Ask me to adjust tone, shorten paragraphs, or emphasize specific experience.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);

  const sendMessage = async () => {
    if (!chatInput.trim() || streaming) return;

    const session = loadAiSession();
    if (!session) return;

    const instruction = chatInput.trim();
    setChatInput("");
    setMessages((current) => [...current, { role: "user", text: instruction }]);
    setStreaming(true);

    try {
      const result = await refineTailoredCoverLetter({
        providerId: session.providerId,
        apiKey: session.apiKey,
        model: session.model,
        content,
        instruction,
        job,
      });

      onCoverLetterUpdated({
        content: result.content,
        reply: result.reply,
      });

      setMessages((current) => [...current, { role: "ai", text: result.reply }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text:
            error instanceof Error
              ? `Couldn't apply that edit: ${error.message}`
              : "Couldn't apply that edit. Try rephrasing your request.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l-2 border-[var(--foreground)] bg-white">
      <div className="border-b-2 border-[var(--foreground)] px-4 py-3">
        <NeoBadge color={accentColor} className="text-[11px]">
          ✦ AI Refine
        </NeoBadge>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed neo-border-sm ${
                message.role === "user"
                  ? "ml-4 bg-[var(--yellow-l)]"
                  : "mr-4 bg-[var(--background)]"
              }`}
            >
              {message.text}
            </div>
          ))}
          {streaming ? (
            <div className="rounded-xl bg-[var(--background)] px-3 py-2.5 text-xs neo-border-sm">
              <span className="animate-pulse-soft">✦ Updating cover letter...</span>
            </div>
          ) : null}
        </div>
        <div className="flex gap-1.5 border-t-2 border-[var(--foreground)] p-2.5">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void sendMessage()}
            placeholder="Refine this cover letter..."
            className="flex-1 rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-2 font-sans text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={streaming || !chatInput.trim()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm font-bold neo-border-sm disabled:opacity-50"
            style={{ background: accentColor }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
