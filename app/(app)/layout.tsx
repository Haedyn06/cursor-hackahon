import { OnboardingGuard } from "@/components/guards/route-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}
