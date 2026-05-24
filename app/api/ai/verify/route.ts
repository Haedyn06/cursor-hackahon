import { NextResponse } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { verifyProviderKey } from "@/lib/ai/server";
import { isApiProviderId } from "@/lib/ai/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    const result = await verifyProviderKey(body.providerId, body.apiKey);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[POST /api/ai/verify]", error);
    return NextResponse.json(
      { error: "Failed to verify API key." },
      { status: 500 },
    );
  }
}
