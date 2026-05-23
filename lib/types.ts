export type AIProvider =
  | "openai"
  | "anthropic"
  | "groq"
  | "deepseek"
  | "nvidia"
  | "openrouter"
  | "gemini";

export type ApplicationStatus =
  | "apply"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type ExperienceLevel =
  | "student"
  | "new_grad"
  | "early_career"
  | "career_changer";

export interface UserProfile {
  targetRole: string;
  experienceLevel: ExperienceLevel;
  topSkills: string;
  aboutYou: string;
  linkedin: string;
  github: string;
  portfolio: string;
  hasUltimateProfile: boolean;
}

export interface ApiKeyConfig {
  provider: AIProvider;
  maskedKey: string;
  verified: boolean;
}

export interface SavedResume {
  id: string;
  label: string;
  extractedText: string;
  createdAt: string;
}

export interface ResumeContent {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    dates: string;
  }[];
  skills: string[];
  projects?: {
    name: string;
    bullets: string[];
  }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CoverLetter {
  body: string;
  generatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  framework: string;
}

export interface InterviewPrep {
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  culture: InterviewQuestion[];
  competitors: InterviewQuestion[];
  products: InterviewQuestion[];
  generatedAt?: string;
}

export interface JobMetadata {
  typeOfWork: string;
  typeOfSalary: string;
  location: string;
  applicationDate: string | null;
  jobKey: string;
  identifiedSkills: string[];
  aiInsights: string;
  scrapedAt: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  jdText: string;
  url?: string;
  source?: string;
  metadata?: JobMetadata;
  status: ApplicationStatus;
  createdAt: string;
  tailoredResume?: ResumeContent;
  resumeChat?: ChatMessage[];
  coverLetter?: CoverLetter;
  interviewPrep?: InterviewPrep;
}

export interface AppState {
  onboardingComplete: boolean;
  apiKey: ApiKeyConfig | null;
  profile: UserProfile;
  baseResumeText: string;
  savedResumes: SavedResume[];
  applications: JobApplication[];
}
