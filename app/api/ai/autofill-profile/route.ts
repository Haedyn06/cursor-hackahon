import { NextResponse } from "next/server";
import { autofillProfileFromSourceText } from "@/lib/ai/autofill-profile";
import { summarizeAutofillPayload } from "@/lib/ai/profile-autofill-generation";
import { AiProviderError } from "@/lib/ai/errors";
import { isApiProviderId } from "@/lib/ai/types";
import { mapAutofillToOnboardingProfile } from "@/lib/onboarding/autofill-mapper";
import {
  combineAutofillSourceText,
  extractTextFromUploads,
} from "@/lib/resume-file-extract";

export const runtime = "nodejs";

type UploadPayload = {
  name: string;
  type: string;
  data: string;
};

function isUploadPayload(value: unknown): value is UploadPayload {
  if (!value || typeof value !== "object") return false;
  const upload = value as UploadPayload;
  return (
    typeof upload.name === "string" &&
    typeof upload.type === "string" &&
    typeof upload.data === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      providerId?: string;
      apiKey?: string;
      model?: string;
      pastedText?: string;
      uploads?: unknown;
    };

    if (!body.providerId || !isApiProviderId(body.providerId)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }

    const uploads = Array.isArray(body.uploads)
      ? body.uploads.filter(isUploadPayload)
      : [];

    const unsupportedImages = uploads.filter((upload) =>
      upload.type.startsWith("image/"),
    );
    if (unsupportedImages.length > 0 && uploads.length === unsupportedImages.length && !body.pastedText?.trim()) {
      return NextResponse.json(
        {
          error:
            "Image-only uploads are not supported yet. Paste the text or upload a PDF/DOCX/TXT resume.",
        },
        { status: 400 },
      );
    }

    const documentUploads = uploads.filter((upload) => !upload.type.startsWith("image/"));
    const extractedChunks = await extractTextFromUploads(
      documentUploads.map((upload) => ({
        name: upload.name,
        type: upload.type,
        buffer: Buffer.from(upload.data, "base64"),
      })),
    );

    const sourceText = combineAutofillSourceText([
      ...extractedChunks,
      body.pastedText?.trim() ?? "",
    ]);

    const payload = await autofillProfileFromSourceText({
      providerId: body.providerId,
      apiKey: body.apiKey,
      model: body.model,
      sourceText,
    });

    return NextResponse.json({
      profile: mapAutofillToOnboardingProfile(payload),
      summary: summarizeAutofillPayload(payload),
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[POST /api/ai/autofill-profile]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to autofill profile from documents.",
      },
      { status: 500 },
    );
  }
}
