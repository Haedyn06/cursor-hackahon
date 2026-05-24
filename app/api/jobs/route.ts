import { NextResponse } from "next/server";
import type { CreateJobInput } from "@/lib/types/job";
import {
  JobsServiceError,
  createJob,
  listJobs,
} from "@/lib/services/jobs.service";

export async function GET() {
  try {
    const jobs = await listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json(
      { error: "Failed to load jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateJobInput;
    const job = await createJob(body);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/jobs]", error);
    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 },
    );
  }
}
