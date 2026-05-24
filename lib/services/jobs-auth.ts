import "server-only";

import { auth } from "@clerk/nextjs/server";
import {
  CLERK_CONVEX_TEMPLATE,
  type JobsServiceOptions,
} from "@/lib/services/jobs.service";

export async function getJobsServiceOptions(): Promise<JobsServiceOptions> {
  const { getToken } = await auth();
  return {
    token: await getToken({ template: CLERK_CONVEX_TEMPLATE }),
  };
}
