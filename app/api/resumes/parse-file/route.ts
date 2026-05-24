import { NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/resume-file-extract";
import { parseResumeText, type ResumeDocument } from "@/lib/resume-document";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      data?: string;
    };

    if (!body.fileName?.trim() || !body.data?.trim()) {
      return NextResponse.json(
        { error: "fileName and data are required." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(body.data, "base64");
    const text = await extractTextFromBuffer(
      buffer,
      body.fileName.trim(),
      body.mimeType ?? "",
    );

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this file." },
        { status: 422 },
      );
    }

    const document: ResumeDocument = parseResumeText(text);

    return NextResponse.json({ text, document });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/resumes/parse-file]", error);
    return NextResponse.json(
      { error: "Failed to parse resume file." },
      { status: 500 },
    );
  }
}
