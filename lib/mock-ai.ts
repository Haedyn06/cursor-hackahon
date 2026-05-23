import type {
  InterviewPrep,
  JobMetadata,
  ResumeContent,
  UserProfile,
} from "./types";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function verifyApiKey(_key: string): Promise<boolean> {
  await delay(800);
  return _key.length >= 8;
}

export async function generateTailoredResume(
  profile: UserProfile,
  baseResume: string,
  jdText: string,
  jobTitle: string,
  company: string,
  metadata?: JobMetadata
): Promise<ResumeContent> {
  await delay(1800);
  const profileSkills = profile.topSkills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const jdSkills = metadata?.identifiedSkills ?? [];
  const skills = [...new Set([...jdSkills, ...profileSkills])].slice(0, 10);

  const location =
    metadata?.location?.split(",")[0]?.trim() || "Calgary, AB";
  const workHint = metadata?.typeOfWork
    ? ` Open to ${metadata.typeOfWork.toLowerCase()} arrangements.`
    : "";

  return {
    name: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "(403) 555-0142",
    location,
    summary: `Motivated ${profile.targetRole || "professional"} targeting ${jobTitle} at ${company}.${workHint} ${metadata?.aiInsights?.slice(0, 140) ?? profile.aboutYou.slice(0, 120)}…`,
    experience: [
      {
        title: profile.targetRole || jobTitle || "Software Developer",
        company: "Hackathon Labs",
        dates: "May 2025 – Present",
        bullets: [
          `Tailored to posting priorities: ${jdText.slice(0, 55).replace(/\n/g, " ")}…`,
          jdSkills.length
            ? `Applied ${jdSkills.slice(0, 4).join(", ")} in production features`
            : "Built full-stack features with Next.js, TypeScript, and Convex in a 24h sprint",
          metadata?.typeOfSalary && metadata.typeOfSalary !== "Not listed on posting"
            ? `Target compensation context: ${metadata.typeOfSalary}`
            : "Collaborated in a 2-person team; owned UI/UX and PDF export pipeline",
        ],
      },
      {
        title: "Teaching Assistant — Intro to Programming",
        company: "SAIT",
        dates: "Jan 2025 – Apr 2025",
        bullets: [
          "Mentored 40+ students on debugging, Git workflows, and clean code practices",
          "Reduced lab question backlog by facilitating peer review sessions",
        ],
      },
    ],
    education: [
      {
        degree: "Diploma, Software Development",
        school: "SAIT",
        dates: "Expected 2026",
      },
    ],
    skills: skills.length ? skills : ["TypeScript", "React", "Next.js", "Git"],
    projects: baseResume.includes("project")
      ? undefined
      : [
          {
            name: "Rezume — AI Resume Builder",
            bullets: [
              "BYOK architecture: 7 AI providers, client-side AES-GCM key encryption",
              "Ultimate Profile drives tailored resumes, cover letters, and interview prep",
            ],
          },
        ],
  };
}

export async function refineResumeWithChat(
  resume: ResumeContent,
  instruction: string
): Promise<ResumeContent> {
  await delay(1200);
  const lower = instruction.toLowerCase();
  const copy = structuredClone(resume);
  if (lower.includes("concise") || lower.includes("shorter")) {
    copy.summary = copy.summary.split(".").slice(0, 2).join(".") + ".";
  }
  if (lower.includes("hackathon") || lower.includes("project")) {
    copy.projects = [
      ...(copy.projects ?? []),
      {
        name: "Cursor Calgary Hackathon",
        bullets: [
          "Shipped production-grade demo in 24 hours with neo-brutalist UI system",
          "Integrated job board, resume tailoring, and interview prep flows",
        ],
      },
    ];
  }
  if (lower.includes("metric") || lower.includes("number")) {
    copy.experience[0].bullets[0] =
      "Increased application completion rate by 35% through streamlined onboarding";
  }
  return copy;
}

export async function generateCoverLetter(
  profile: UserProfile,
  jobTitle: string,
  company: string,
  jdText: string
): Promise<string> {
  await delay(1500);
  return `Dear Hiring Manager,

I am excited to apply for the ${jobTitle} role at ${company}. As a ${profile.experienceLevel.replace("_", " ")} focused on ${profile.targetRole}, I bring hands-on experience and a genuine interest in the problems your team solves.

${profile.aboutYou.slice(0, 200)}${profile.aboutYou.length > 200 ? "…" : ""}

Your posting emphasizes skills I have been building deliberately — including ${profile.topSkills.split(",").slice(0, 3).join(", ")}. In my recent work, I have shipped projects under tight deadlines while maintaining clear communication, which maps directly to what I read in your job description: "${jdText.slice(0, 80).replace(/\n/g, " ")}…"

I would welcome the chance to discuss how I can contribute to ${company}. Thank you for your time and consideration.

Sincerely,
Alex Chen`;
}

export async function generateInterviewPrep(
  jobTitle: string,
  company: string,
  jdText: string
): Promise<InterviewPrep> {
  await delay(2000);
  const mk = (q: string, f: string, i: number) => ({
    id: `${i}`,
    question: q,
    framework: f,
  });

  return {
    technical: [
      mk(
        `How would you design a system to tailor resumes against a job description like this ${jobTitle} role?`,
        "Clarify requirements → data model (profile + JD) → prompt pipeline → evaluation → caching. Mention tradeoffs (latency vs quality).",
        0
      ),
      mk(
        "Walk me through how you would implement client-side API key encryption.",
        "Web Crypto AES-GCM, key derivation from session, never persist plaintext, decrypt only in browser for requests.",
        1
      ),
      mk(
        "What testing strategy would you use for AI-generated documents?",
        "Golden prompts, snapshot tests on structure, human review rubric, regression on provider failures.",
        2
      ),
    ],
    behavioral: [
      mk(
        "Tell me about a time you shipped under a tight deadline.",
        "STAR: Situation (hackathon), Task (demo-ready app), Action (scoped MVP, pair programming), Result (working E2E flow).",
        0
      ),
      mk(
        "Describe a situation where you received critical feedback.",
        "STAR: focus on listening, iteration, and measurable improvement.",
        1
      ),
    ],
    culture: [
      mk(
        `Why ${company}, and why this ${jobTitle} role specifically?`,
        "Connect company mission to your values; cite 1–2 specifics from JD; show long-term growth interest.",
        0
      ),
      mk(
        "How do you prefer to collaborate on a small team?",
        "Async updates, clear ownership, demo-driven checkpoints, psychological safety.",
        1
      ),
    ],
    competitors: [
      mk(
        `Who do you see as ${company}'s main competitors, and how would you differentiate?`,
        "Name 2–3 competitors respectfully; differentiate on product, GTM, or customer segment without being dismissive.",
        0
      ),
    ],
    products: [
      mk(
        `If you joined as ${jobTitle}, what would you improve about our product in the first 90 days?`,
        "Research → talk to users → pick one high-impact, low-risk improvement → define success metrics.",
        0
      ),
      mk(
        "How does this role's JD inform what you think our customers care about?",
        `Tie themes from JD ("${jdText.slice(0, 50)}…") to user outcomes.`,
        1
      ),
    ],
    generatedAt: new Date().toISOString(),
  };
}

export async function* streamText(
  text: string,
  chunkSize = 12
): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    await delay(30);
    yield text.slice(0, i + chunkSize);
  }
}
