"use client";

import type { ReactNode } from "react";
import { JobsProvider } from "@/components/providers/jobs-provider";
import { ResumeBuilderLibraryProvider } from "@/components/providers/resume-builder-library-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ResumeBuilderLibraryProvider>
      <JobsProvider>{children}</JobsProvider>
    </ResumeBuilderLibraryProvider>
  );
}
