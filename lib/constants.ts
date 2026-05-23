import type { AIProvider } from "./types";

export const PROVIDERS: {
  id: AIProvider;
  name: string;
  freeTier: boolean;
  keyUrl: string;
  accent: string;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    freeTier: false,
    keyUrl: "https://platform.openai.com/api-keys",
    accent: "bg-neo-lime",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    freeTier: false,
    keyUrl: "https://console.anthropic.com/settings/keys",
    accent: "bg-neo-orange",
  },
  {
    id: "groq",
    name: "Groq",
    freeTier: true,
    keyUrl: "https://console.groq.com/keys",
    accent: "bg-neo-blue",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    freeTier: false,
    keyUrl: "https://platform.deepseek.com/api_keys",
    accent: "bg-neo-purple",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    freeTier: true,
    keyUrl: "https://build.nvidia.com/",
    accent: "bg-neo-lime",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    freeTier: false,
    keyUrl: "https://openrouter.ai/keys",
    accent: "bg-neo-pink",
  },
  {
    id: "gemini",
    name: "Gemini",
    freeTier: true,
    keyUrl: "https://aistudio.google.com/apikey",
    accent: "bg-neo-blue",
  },
];

export const STATUS_LABELS: Record<
  import("./types").ApplicationStatus,
  { label: string; color: string }
> = {
  apply: { label: "Apply", color: "bg-zinc-200" },
  applied: { label: "Applied", color: "bg-neo-blue text-white" },
  interview: { label: "Interview", color: "bg-neo-purple text-white" },
  offer: { label: "Offer", color: "bg-neo-lime" },
  rejected: { label: "Rejected", color: "bg-neo-pink text-white" },
};

export const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student" },
  { value: "new_grad", label: "New Graduate" },
  { value: "early_career", label: "Early Career (1–3 yrs)" },
  { value: "career_changer", label: "Career Changer" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/jobs", label: "Job Board", icon: "Briefcase" },
  { href: "/resumes", label: "Resumes", icon: "FileText" },
  { href: "/profile", label: "Profile", icon: "User" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
