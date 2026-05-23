"use client";

import { ApiKeyBanner } from "@/components/layout/api-key-banner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NeoButton } from "@/components/ui/neo-button";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neo-bg dot-grid">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-neo-ink/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col md:ml-0">
        <ApiKeyBanner />
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b-[3px] border-neo-ink bg-white px-4 py-3 md:px-8">
          <NeoButton
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </NeoButton>
          {title && (
            <h1 className="text-xl font-black uppercase tracking-tight md:text-2xl">
              {title}
            </h1>
          )}
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
