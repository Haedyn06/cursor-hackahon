export const COLORS = {
  mint: "#b5ead7",
  mintL: "#d9f5ec",
  lav: "#c7b8ea",
  lavL: "#e4ddf7",
  peach: "#ffd6b3",
  peachL: "#ffe9d5",
  yellow: "#fff3b0",
  yellowL: "#fffae0",
  red: "#ffb3b3",
  redL: "#ffe0e0",
  white: "#ffffff",
  bg: "#faf9f7",
  ink: "#1a1a1a",
  muted: "#888888",
} as const;

export const STATUS_STAGES = [
  "Saved",
  "Applying",
  "Applied",
  "Interview",
  "Offer",
  "Accepted",
] as const;

export type JobStatus = (typeof STATUS_STAGES)[number] | "Rejected";

export const STATUS_COLORS: Record<string, string> = {
  Saved: COLORS.yellow,
  Applying: COLORS.peach,
  Applied: COLORS.mint,
  Interview: COLORS.lav,
  Offer: COLORS.mintL,
  Accepted: COLORS.mint,
  Rejected: COLORS.red,
};

export const STATUS_SORT_ORDER: Record<JobStatus, number> = {
  Saved: 0,
  Applying: 1,
  Applied: 2,
  Interview: 3,
  Offer: 4,
  Rejected: 5,
  Accepted: 6,
};

export const ALL_JOB_STATUSES: JobStatus[] = [...STATUS_STAGES, "Rejected"];

export const TRACKER_STAGES = [
  { key: "Saved", label: "SAVED" },
  { key: "Applying", label: "APPLYING" },
  { key: "Applied", label: "APPLIED" },
  { key: "Interview", label: "INTERVIEWING" },
  { key: "Offer", label: "NEGOTIATING" },
  { key: "Accepted", label: "ACCEPTED" },
] as const;

export const API_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o, o1, o3",
    badge: "API Key",
    color: COLORS.mint,
    icon: "hexagon",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    desc: "Claude 3.5 Sonnet/Haiku",
    badge: "API Key",
    color: COLORS.lav,
    icon: "layers",
  },
  {
    id: "groq",
    name: "Groq",
    desc: "Llama 3.3 — ultra fast",
    badge: "Free tier",
    color: COLORS.peach,
    icon: "triangle",
  },
  {
    id: "gemini",
    name: "Gemini",
    desc: "Gemini 1.5 / 2.0 Flash",
    badge: "Free tier",
    color: COLORS.yellow,
    icon: "diamond",
  },
  {
    id: "mistral",
    name: "Mistral",
    desc: "Mistral Large 2",
    badge: "Free tier",
    color: COLORS.mintL,
    icon: "diamond-outline",
  },
  {
    id: "together",
    name: "Together AI",
    desc: "70+ open-source models",
    badge: "Free tier",
    color: COLORS.lavL,
    icon: "nodes",
  },
] as const;

export const OAUTH_PROVIDERS = [
  {
    id: "copilot",
    name: "GitHub Copilot",
    desc: "GPT-4o via GitHub — use existing subscription",
    badge: "OAuth",
    color: COLORS.mint,
    icon: "hexagon",
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    desc: "Code-optimized models via OpenAI platform",
    badge: "OAuth",
    color: COLORS.lav,
    icon: "brackets",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    desc: "Next-gen reasoning & code models",
    badge: "OAuth · New",
    color: COLORS.peach,
    icon: "infinity",
  },
  {
    id: "cursor",
    name: "Cursor",
    desc: "AI models from the Cursor IDE platform",
    badge: "OAuth",
    color: COLORS.yellow,
    icon: "arrow-up-right",
  },
  {
    id: "codeium",
    name: "Windsurf / Codeium",
    desc: "Codeium AI models — generous free tier",
    badge: "OAuth · Free",
    color: COLORS.mintL,
    icon: "waves",
  },
  {
    id: "amazonq",
    name: "Amazon Q",
    desc: "AWS-native AI — great for AWS workloads",
    badge: "OAuth",
    color: COLORS.lavL,
    icon: "chevron-right",
  },
] as const;

