import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { PROVIDERS } from "@/lib/constants";
import { ArrowRight, KeyRound, Sparkles, Target } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: KeyRound,
    title: "Bring your AI key",
    desc: "Connect OpenAI, Groq, Gemini, or 4 more — many with free tiers. Your key stays encrypted in your browser.",
    color: "bg-neo-lime",
  },
  {
    icon: Target,
    title: "Build your Ultimate Profile",
    desc: "One rich profile with every project, skill, and win — richer than any one-page resume.",
    color: "bg-neo-blue text-white",
  },
  {
    icon: Sparkles,
    title: "Tailor in one click",
    desc: "Paste a job posting URL — we analyze the description and tailor your resume, cover letter, and interview prep.",
    color: "bg-neo-pink text-white",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neo-bg dot-grid">
      <header className="border-b-[3px] border-neo-ink bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7" strokeWidth={3} />
            <span className="text-2xl font-black">REZUME</span>
          </div>
          <Link href="/onboarding">
            <NeoButton variant="primary">Get started</NeoButton>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="neo-card relative overflow-hidden bg-neo-lime p-8 md:p-14">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[3px] border-neo-ink bg-neo-orange" />
          <div className="absolute bottom-4 right-12 h-16 w-16 rotate-12 border-[3px] border-neo-ink bg-neo-blue" />
          <p className="text-sm font-black uppercase tracking-widest">
            Cursor Calgary Hackathon · SAIT
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Stop copy-pasting your resume into ChatGPT.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-bold md:text-xl">
            Rezume knows everything about you and tailors your application in one
            click — using your own free AI key.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/onboarding">
              <NeoButton variant="primary" size="lg">
                Start free <ArrowRight className="h-5 w-5" />
              </NeoButton>
            </Link>
            <Link href="/onboarding">
              <NeoButton size="lg">Sign in</NeoButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <h2 className="mb-8 text-3xl font-black uppercase">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <NeoCard key={step.title} className="relative">
              <span className="absolute -right-2 -top-3 flex h-10 w-10 items-center justify-center rounded-md border-[3px] border-neo-ink bg-white text-lg font-black">
                {i + 1}
              </span>
              <div
                className={`mb-4 inline-flex rounded-lg border-[3px] border-neo-ink p-3 ${step.color}`}
              >
                <step.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black">{step.title}</h3>
              <p className="mt-2 font-medium">{step.desc}</p>
            </NeoCard>
          ))}
        </div>
      </section>

      <section className="border-y-[3px] border-neo-ink bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="text-center text-sm font-black uppercase tracking-widest">
            Bring your own key — 7 providers supported
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {PROVIDERS.map((p) => (
              <span
                key={p.id}
                className={`rounded-lg border-[3px] border-neo-ink px-4 py-2 font-bold shadow-[3px_3px_0_0_#0a0a0a] ${p.accent}`}
              >
                {p.name}
                {p.freeTier && (
                  <span className="ml-2 rounded bg-neo-ink px-1.5 py-0.5 text-[10px] text-white">
                    FREE
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="neo-ticker overflow-hidden py-3">
        <p className="animate-[marquee_20s_linear_infinite] whitespace-nowrap text-center text-sm md:text-base">
          TAILOR RESUMES · TRACK APPLICATIONS · INTERVIEW PREP · BYOK · NO SUBSCRIPTION ·
          TAILOR RESUMES · TRACK APPLICATIONS · INTERVIEW PREP · BYOK · NO SUBSCRIPTION ·
        </p>
      </div>

      <footer className="py-8 text-center text-sm font-bold opacity-70">
        Built for students & new grads · May 2026
      </footer>
    </div>
  );
}
