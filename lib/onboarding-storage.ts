import {
  MOCK_PROFILE,
  MOCK_RESUMES,
  type MockDocument,
  type OnboardingResume,
} from "@/lib/mock-data";

const PROFILE_KEY = "rezume_user_profile";
const RESUME_LIBRARY_KEY = "rezume_resume_library";

export type ProfileResumeLibraryItem = {
  id: number;
  label: string;
  job: string;
  date: string;
};

export type StoredProfile = typeof MOCK_PROFILE;

export type OnboardingProfileState = {
  name: string;
  location: string;
  email: string;
  phone: string;
  links: { id: number; name: string; url: string }[];
  targetRole: string;
  experience: string;
  about: string;
  skills: string[];
  languages: { id: number; name: string; level: string }[];
  certifications: { id: number; name: string; issuer: string; date: string }[];
  experience_entries: {
    id: number;
    title: string;
    company: string;
    dates: string;
    bullets: string;
  }[];
};

const RESUME_COLORS = [
  "var(--mint)",
  "var(--lav)",
  "var(--peach)",
  "var(--yellow)",
];

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatProfileDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mockAiResumeName(fileName: string): string {
  const base = fileName
    .replace(/\.(pdf|docx?)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (/^pasted resume$/i.test(base)) {
    return "Imported Resume — Pasted Text";
  }

  const titled = base
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (/resume|cv/i.test(titled)) return titled;
  return `${titled} Resume`;
}

function nextIdFrom(existing: { id: number }[]) {
  return existing.length > 0 ? Math.max(...existing.map((item) => item.id)) + 1 : 1;
}

export function mergeProfileFromOnboarding(
  state: OnboardingProfileState,
  existing?: StoredProfile,
): StoredProfile {
  const base = existing ?? structuredClone(MOCK_PROFILE);

  return {
    ...base,
    name: state.name || base.name,
    location: state.location || base.location,
    email: state.email || base.email,
    phone: state.phone || base.phone,
    targetRole: state.targetRole || base.targetRole,
    experience: state.experience || base.experience,
    about: state.about || base.about,
    skills: state.skills.length > 0 ? state.skills : base.skills,
    links:
      state.links.filter((link) => link.name.trim() || link.url.trim()).length > 0
        ? state.links.filter((link) => link.name.trim() || link.url.trim())
        : base.links,
    languages:
      state.languages.filter((lang) => lang.name.trim()).length > 0
        ? state.languages.filter((lang) => lang.name.trim())
        : base.languages,
    certifications:
      state.certifications.filter((cert) => cert.name.trim()).length > 0
        ? state.certifications.filter((cert) => cert.name.trim())
        : base.certifications,
    experience_entries: state.experience_entries
      .filter((entry) => entry.title.trim() || entry.company.trim())
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        company: entry.company,
        dates: entry.dates,
        bullets: entry.bullets
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((text, index) => ({
            id: index + 1,
            text: text.replace(/^[-•*]\s*/, ""),
            active: true,
          })),
      })),
  };
}

export function toLibraryDocuments(
  imported: OnboardingResume[],
  existing: MockDocument[] = [],
): MockDocument[] {
  let nextId = nextIdFrom(existing);

  const created = imported
    .filter((item) => item.aiName.trim())
    .map((item, index) => {
      const doc: MockDocument = {
        id: nextId++,
        title: item.aiName.trim(),
        matchJob: null,
        edited: formatToday(),
        color: RESUME_COLORS[(existing.length + index) % RESUME_COLORS.length],
      };
      return doc;
    });

  return [...existing, ...created];
}

export function toProfileLibraryItems(
  imported: OnboardingResume[],
  existing: ProfileResumeLibraryItem[] = [],
): ProfileResumeLibraryItem[] {
  let nextId = nextIdFrom(existing);
  const date = formatProfileDate();

  const created = imported
    .filter((item) => item.aiName.trim())
    .map((item) => ({
      id: nextId++,
      label: item.aiName.trim(),
      job: item.file,
      date,
    }));

  return [...existing, ...created];
}

export function loadResumeLibrary(): MockDocument[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESUME_LIBRARY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockDocument[];
  } catch {
    return null;
  }
}

export function loadStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function persistOnboardingCompletion(
  profileState: OnboardingProfileState,
  importedResumes: OnboardingResume[],
) {
  if (typeof window === "undefined") return;

  const existingProfile = loadStoredProfile();
  const mergedProfile = mergeProfileFromOnboarding(profileState, existingProfile ?? undefined);
  const existingLibrary = loadResumeLibrary() ?? [...MOCK_RESUMES];

  const readyImports = importedResumes.filter(
    (item) => !item.naming && item.aiName.trim(),
  );

  const mergedLibrary = toLibraryDocuments(readyImports, existingLibrary);
  const mergedProfileLibrary = toProfileLibraryItems(
    readyImports,
    mergedProfile.resumeLibrary ?? [],
  );

  const storedProfile: StoredProfile = {
    ...mergedProfile,
    resumeLibrary: mergedProfileLibrary,
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(storedProfile));
  localStorage.setItem(RESUME_LIBRARY_KEY, JSON.stringify(mergedLibrary));
}

export function getInitialResumeLibrary(): MockDocument[] {
  return loadResumeLibrary() ?? structuredClone(MOCK_RESUMES);
}

export function getInitialProfile(): StoredProfile {
  return loadStoredProfile() ?? structuredClone(MOCK_PROFILE);
}
