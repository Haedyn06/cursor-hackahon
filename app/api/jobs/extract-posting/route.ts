import { NextResponse } from "next/server";
import { extractTextFromUploads } from "@/lib/resume-file-extract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      uploads?: Array<{ name: string; type: string; data: string }>;
    };

    if (!body.uploads?.length) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const uploads = body.uploads.map((upload) => ({
      name: upload.name,
      type: upload.type,
      buffer: Buffer.from(upload.data, "base64"),
    }));

    const extractedChunks = await extractTextFromUploads(uploads);
    const text = extractedChunks.join("\n\n").trim();

    if (text.length < 40) {
      return NextResponse.json(
        { error: "Could not extract enough text from that file." },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[POST /api/jobs/extract-posting]", error);
    return NextResponse.json(
      { error: "Failed to extract text from file." },
      { status: 500 },
    );
  }
}
