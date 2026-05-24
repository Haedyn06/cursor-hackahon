import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { CreateJobInput } from "@/lib/types/job";
import {
  CLERK_CONVEX_TEMPLATE,
  JobsServiceError,
  createJob,
  listJobs,
} from "@/lib/services/jobs.service";

async function getJobsServiceOptions() {
  const { getToken } = await auth();
  return {
    token: await getToken({ template: CLERK_CONVEX_TEMPLATE }),
  };
}

export async function GET() {
  try {
    const jobs = await listJobs(await getJobsServiceOptions());
    return NextResponse.json({ jobs });
  } catch (error) {
    if (error instanceof JobsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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
    const job = await createJob(body, await getJobsServiceOptions());
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
