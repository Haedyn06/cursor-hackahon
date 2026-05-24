import Image from "next/image";
import { Logo } from "@/components/layout/logo";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoBadge } from "@/components/ui/neo-badge";

const steps = [
  {
    n: "01",
    title: "Build your profile once",
    desc: "Add your experience, projects, and skills in detail. The more you share, the better your resumes get.",
    color: "var(--mint)",
    image: "/images/steps/step-01-profile.png",
    imageAlt: "Build your profile with experience and skills",
  },
  {
    n: "02",
    title: "Paste a job posting",
    desc: "Drop any job description into Rezume. We extract keywords and match them against your profile instantly.",
    color: "var(--lav)",
    image: "/images/steps/step-02-job-posting.png",
    imageAlt: "Analyze a job posting and extract keywords",
  },
  {
    n: "03",
    title: "Get your resume",
    desc: "AI generates a tailored, ATS-optimized resume in seconds. Refine with chat. Done.",
    color: "var(--peach)",
    image: "/images/steps/step-03-resume.png",
    imageAlt: "Generate and edit your tailored resume",
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

const heroStats = [
  { n: "10x", label: "faster resume tailoring" },
  { n: "94%", label: "ATS pass rate" },
  { n: "Free", label: "to start, BYOK" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-10 flex h-15 items-center justify-between border-b-[2.5px] border-[var(--foreground)] bg-white px-10">
        <Logo />
        <div className="flex items-center gap-5">
          <NeoButton href="#how-it-works" variant="secondary" size="sm">
            See how it works
          </NeoButton>
          <NeoButton href="/onboarding" variant="primary" size="sm">
            Sign up free →
          </NeoButton>
        </div>
      </nav>

      <section className="mx-auto max-w-[1100px] px-10 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-15">
          <div className="text-center lg:flex lg:h-full lg:flex-col lg:text-left">
            <div className="mb-5 flex justify-center lg:justify-start">
              <NeoBadge
                color="var(--mint)"
                className="px-4 py-1.5 text-[13px]"
              >
                Built for students &amp; new grads
              </NeoBadge>
            </div>
            <h1 className="mb-5 font-heading text-[45px] leading-[1.15] font-extrabold tracking-[-1.5px] text-[var(--foreground)] lg:text-[55px]">
              Never settle for a generic resume again.
            </h1>
            <p className="mx-auto mb-10 max-w-[540px] text-xl leading-relaxed font-medium text-[#444] lg:mx-0">
              Rezume is your AI-powered job hunt command center. Paste a job.
              Get a tailored resume in seconds. Track every application in one
              place.
            </p>
            <div className="mt-auto flex flex-wrap justify-center gap-5 pt-10 lg:justify-start">
              <NeoButton
                href="#how-it-works"
                variant="secondary"
                size="lg"
                className="px-10 py-3.5 text-base"
              >
                See How It Works
              </NeoButton>
              <NeoButton
                href="/onboarding"
                variant="primary"
                size="lg"
                className="px-10 py-3.5 text-base"
              >
                Get started free →
              </NeoButton>
            </div>
          </div>

          <div className="flex h-full flex-col justify-end">
            <div className="relative mx-auto w-full max-w-[500px] pb-[max(0px,calc(90px-25%))] lg:mx-0 lg:ml-auto lg:max-w-[500px]">
              <div className="relative isolate aspect-square w-full">
                <img
                  src="https://www.iconpacks.net/icons/1/free-document-icon-901-thumb.png"
                  alt="Resume document"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-x-[10%] top-[75%] grid grid-cols-3 border-[10px] border-black bg-white">
                  {heroStats.map((s, i) => (
                    <div
                      key={s.n}
                      className={`flex min-h-[90px] flex-col items-center justify-center px-5 py-5 text-center lg:min-h-[90px] ${i > 0 ? "border-l-[10px] border-black" : ""}`}
                    >
                      <div className="font-heading text-xl font-extrabold leading-none lg:text-[28px]">
                        {s.n}
                      </div>
                      <div className="mt-1.5 px-0.5 text-[10px] leading-tight font-medium text-black lg:text-[10px]">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-white px-10 py-10">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-15 text-center">
            <NeoBadge color="var(--lav)" className="mb-2.5">
              How it works
            </NeoBadge>
            <h2 className="font-heading text-[45px] font-extrabold tracking-[-1.5px]">
              Three steps. Zero fluff.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="aspect-square overflow-hidden rounded-[20px] bg-white transition-all neo-border hover:-translate-y-1"
              >
                <div className="flex h-full flex-col p-5 md:p-5">
                  <h3 className="mb-2.5 font-heading text-[20px] font-extrabold leading-tight whitespace-nowrap xl:text-[20px]">
                    {step.n} - {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed font-medium text-[#555]">
                    {step.desc}
                  </p>
                  <div className="mt-auto flex flex-1 items-end justify-center pt-2.5">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      width={160}
                      height={160}
                      className="h-auto max-h-[140px] w-auto object-contain md:max-h-[160px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 border-t-[2.5px] border-[var(--foreground)] pt-16 text-center">
            <NeoBadge color="var(--yellow)" className="mb-5">
              Bring Your Own Key
            </NeoBadge>
            <h2 className="mb-2.5 font-heading text-4xl font-extrabold tracking-tight">
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
          </div>
        </div>
      </section>

      <section className="border-y-[2.5px] border-[var(--foreground)] bg-[var(--mint)] px-10 py-10 text-center">
        <h2 className="mb-5 font-heading text-5xl font-extrabold tracking-[-1.5px]">
          Ready to land your first job?
        </h2>
        <p className="mb-10 text-lg font-medium text-[#444]">
          Free to start. No credit card. Your AI key, your data.
        </p>
        <NeoButton href="/onboarding" variant="secondary" size="lg" className="text-base">
          Create your profile →
        </NeoButton>
      </section>

      <footer className="border-[var(--foreground)] bg-white px-10 py-10 text-center">
        <Logo size="sm" className="justify-center" />
        <p className="mt-5 text-[15px] text-[var(--muted)]">
          © 2025 Rezume. Built for the next generation of job seekers.
        </p>
      </footer>
    </div>
  );
}
