import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  CLERK_CONVEX_TEMPLATE,
  JobsServiceError,
  deleteJobs,
} from "@/lib/services/jobs.service";

async function getJobsServiceOptions() {
  const { getToken } = await auth();
  return {
    token: await getToken({ template: CLERK_CONVEX_TEMPLATE }),
  };
}

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

    await deleteJobs(ids, await getJobsServiceOptions());
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
