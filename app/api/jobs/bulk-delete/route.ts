import { NextResponse } from "next/server";
import { JobsServiceError, deleteJobs } from "@/lib/services/jobs.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids?.filter(Boolean) ?? [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "At least one job id is required." },
        { status: 400 },
      );
    }

    await deleteJobs(ids);
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/jobs/bulk-delete]", error);
    return NextResponse.json(
      { error: "Failed to delete jobs." },
      { status: 500 },
    );
  }
}
