"use client";

import type { ReactNode } from "react";
import { JobsProvider } from "@/components/providers/jobs-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <JobsProvider>{children}</JobsProvider>;
}
