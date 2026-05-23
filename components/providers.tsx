"use client";

import { RezumeProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <RezumeProvider>{children}</RezumeProvider>;
}
