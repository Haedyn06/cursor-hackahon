import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoBadge } from "@/components/ui/neo-badge";

const steps = [
  {
    n: "01",
    title: "Build your profile once",
    desc: "Add your experience, projects, and skills in detail. The more you share, the better your resumes get.",
    color: "var(--mint)",
  },
  {
    n: "02",
    title: "Paste a job posting",
    desc: "Drop any job description into Rezume. We extract keywords and match them against your profile instantly.",
    color: "var(--lav)",
  },
  {
    n: "03",
    title: "Get your resume",
    desc: "AI generates a tailored, ATS-optimized resume in seconds. Refine with chat. Done.",
    color: "var(--peach)",
  },
];

const providers = [
  "OpenAI",
  "Anthropic",
  "Groq",
  "Gemini",
  "Mistral",
  "Together AI",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="sticky top-0 z-10 flex h-16 items-center justify-between border-b-[2.5px] border-[var(--foreground)] bg-white px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/onboarding">
            <NeoButton variant="secondary" size="sm">
              See how it works
            </NeoButton>
          </Link>
          <Link href="/onboarding">
            <NeoButton variant="primary" size="sm">
              Sign up free →
            </NeoButton>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-[900px] px-10 py-24 text-center">
        <NeoBadge
          color="var(--mint)"
          className="mb-6 inline-flex px-4 py-1.5 text-[13px]"
        >
          🎓 Built for students &amp; new grads
        </NeoBadge>
        <h1 className="mb-12 font-heading text-[56px] leading-[1.15] font-extrabold tracking-[-1.5px] text-[var(--foreground)]">
          Never settle for a{" "}
          <span className="rounded-xl bg-[var(--mint)] px-3.5 py-0.5">
            generic
          </span>{" "}
          resume again.
        </h1>
        <p className="mx-auto mb-10 max-w-[540px] text-xl leading-relaxed font-medium text-[#444]">
          Rezume is your AI-powered job hunt command center. Paste a job. Get a
          tailored resume in seconds. Track every application in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/onboarding">
            <NeoButton variant="primary" size="lg" className="px-8 py-3.5 text-base">
              Get started free →
            </NeoButton>
          </Link>
          <Link href="/onboarding">
            <NeoButton variant="secondary" size="lg" className="px-8 py-3.5 text-base">
              Watch demo
            </NeoButton>
          </Link>
        </div>

        <div className="mt-16 flex justify-center">
          {[
            { n: "10×", label: "faster resume tailoring" },
            { n: "94%", label: "ATS pass rate" },
            { n: "Free", label: "to start, BYOK" },
          ].map((s, i) => (
            <div
              key={s.n}
              className="border-t border-b border-r-[2.5px] border-[var(--foreground)] bg-white px-10 py-5 text-center first:rounded-l-2xl first:border-l-[2.5px] last:rounded-r-2xl"
            >
              <div className="font-heading text-4xl font-extrabold">{s.n}</div>
              <div className="mt-1 text-[13px] font-medium text-[#666]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-[2.5px] border-[var(--foreground)] bg-white px-10 py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-14 text-center">
            <NeoBadge color="var(--lav)" className="mb-4">
              How it works
            </NeoBadge>
            <h2 className="font-heading text-[44px] font-extrabold tracking-[-1.5px]">
              Three steps. Zero fluff.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="rounded-[20px] bg-white p-8 transition-all neo-border hover:-translate-y-1 hover:bg-[var(--step-color)]"
                style={{ ["--step-color" as string]: step.color }}
              >
                <div className="mb-4 font-heading text-5xl leading-none font-extrabold opacity-15">
                  {step.n}
                </div>
                <h3 className="mb-2.5 font-heading text-[22px] leading-tight font-extrabold">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed font-medium text-[#555]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[960px] px-10 py-[72px] text-center">
        <NeoBadge color="var(--yellow)" className="mb-4">
          Bring Your Own Key
        </NeoBadge>
        <h2 className="mb-3 font-heading text-4xl font-extrabold tracking-tight">
          Works with any AI provider
        </h2>
        <p className="mb-10 text-[15px] font-medium text-[#666]">
          Connect your own API key. You control your data and costs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {providers.map((p) => (
            <NeoBadge
              key={p}
              color="#ffffff"
              className="px-5 py-2.5 text-sm font-bold neo-border"
            >
              {p}
            </NeoBadge>
          ))}
        </div>
      </section>

      <section className="border-y-[2.5px] border-[var(--foreground)] bg-[var(--mint)] px-10 py-20 text-center">
        <h2 className="mb-4 font-heading text-5xl font-extrabold tracking-[-1.5px]">
          Ready to land your first job? 🎯
        </h2>
        <p className="mb-8 text-lg font-medium text-[#444]">
          Free to start. No credit card. Your AI key, your data.
        </p>
        <Link href="/onboarding">
          <NeoButton variant="secondary" size="lg" className="text-base">
            Create your profile →
          </NeoButton>
        </Link>
      </section>

      <footer className="border-t-[2.5px] border-[var(--foreground)] bg-white px-10 py-8 text-center">
        <Logo size="sm" className="justify-center" />
        <p className="mt-3 text-[13px] text-[var(--muted)]">
          © 2025 Rezume. Built for the next generation of job seekers.
        </p>
      </footer>
    </div>
  );
}
