import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { completeChat } from "@/lib/ai/server";
import { isApiProviderId, type ChatMessage } from "@/lib/ai/types";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as ChatMessage;
  return (
    (message.role === "system" ||
      message.role === "user" ||
      message.role === "assistant") &&
    typeof message.content === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      messages?: unknown;
      maxTokens?: number;
      model?: string;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    if (!Array.isArray(body.messages) || !body.messages.every(isChatMessage)) {
      return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
    }

    const result = await completeChat({
      providerId: body.providerId,
      apiKey: body.apiKey,
      messages: body.messages,
      maxTokens: body.maxTokens,
      model: body.model,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[POST /api/ai/complete]", error);
    return NextResponse.json(
      { error: "Failed to complete chat request." },
      { status: 500 },
    );
  }
}
