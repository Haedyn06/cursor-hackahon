import { NextResponse } from "next/server";
import type { UpdateJobInput } from "@/lib/types/job";
import {
  JobsServiceError,
  deleteJob,
  getJobById,
  updateJob,
} from "@/lib/services/jobs.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[GET /api/jobs/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load job." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateJobInput;
    const job = await updateJob(id, body);
    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/jobs/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update job." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteJob(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/jobs/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete job." },
      { status: 500 },
    );
  }
}
