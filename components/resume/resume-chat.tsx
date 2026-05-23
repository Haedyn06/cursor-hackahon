"use client";

import { NeoButton } from "@/components/ui/neo-button";
import { NeoInput } from "@/components/ui/neo-input";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Make the summary more concise",
  "Add my hackathon project",
  "Add more metrics to bullets",
];

export function ResumeChat({
  messages,
  onSend,
  loading,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  loading?: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setInput("");
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col border-[3px] border-neo-ink bg-white">
      <div className="border-b-[3px] border-neo-ink bg-neo-purple px-4 py-2 text-sm font-black uppercase text-white">
        Fine-tune
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm font-medium opacity-70">
            Ask for tweaks — e.g. shorter summary, add a project, emphasize leadership.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[95%] rounded-lg border-2 border-neo-ink px-3 py-2 text-sm font-medium",
              m.role === "user"
                ? "ml-auto bg-neo-lime"
                : "bg-neo-bg"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[95%] rounded-lg border-2 border-dashed border-neo-ink px-3 py-2 text-sm font-bold opacity-60">
            Updating resume…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-1 border-t-[3px] border-neo-ink p-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            disabled={loading}
            className="rounded-md border-2 border-neo-ink bg-white px-2 py-1 text-xs font-bold hover:bg-neo-lime disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t-[3px] border-neo-ink p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <NeoInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. add my React project"
          disabled={loading}
          className="flex-1"
        />
        <NeoButton type="submit" variant="lime" size="sm" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </NeoButton>
      </form>
    </div>
  );
}
