import type { GeneratedCoverLetter } from "@/components/resume/cover-letter-preview-panel";
import type { GeneratedInterviewPrep } from "@/components/resume/interview-prep-preview-panel";
import type { GeneratedResume } from "@/components/resume/resume-preview-panel";
import type { MockDocument } from "@/lib/mock-data";

const STORAGE_KEY = "rezume_builder_library";

export type BuilderLibraryStore = {
  resumes: MockDocument[];
  coverLetters: MockDocument[];
  interviewPrep: MockDocument[];
  resumeContent: Record<string, GeneratedResume>;
  coverLetterContent: Record<string, GeneratedCoverLetter>;
  interviewPrepContent: Record<string, GeneratedInterviewPrep>;
};

const EMPTY_STORE: BuilderLibraryStore = {
  resumes: [],
  coverLetters: [],
  interviewPrep: [],
  resumeContent: {},
  coverLetterContent: {},
  interviewPrepContent: {},
};

function formatToday() {
  return new Date().toLocaleDateString("en-US");
}

export function jobMatchLabel(position: string, company: string) {
  const role = position.trim() || "Role";
  const org = company.trim() || "Company";
  return `${role} @ ${org}`;
}

export function loadBuilderLibrary(): BuilderLibraryStore {
  if (typeof window === "undefined") {
    return EMPTY_STORE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<BuilderLibraryStore>;
    return {
      resumes: parsed.resumes ?? [],
      coverLetters: parsed.coverLetters ?? [],
      interviewPrep: parsed.interviewPrep ?? [],
      resumeContent: parsed.resumeContent ?? {},
      coverLetterContent: parsed.coverLetterContent ?? {},
      interviewPrepContent: parsed.interviewPrepContent ?? {},
    };
  } catch {
    return EMPTY_STORE;
  }
}

export function persistBuilderLibrary(store: BuilderLibraryStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function upsertGeneratedResume(
  store: BuilderLibraryStore,
  generated: GeneratedResume,
): BuilderLibraryStore {
  const id = generated.id;
  const next: BuilderLibraryStore = {
    ...store,
    resumeContent: { ...store.resumeContent, [String(id)]: generated },
    resumes: [
      {
        id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: formatToday(),
        color: "var(--mint)",
      },
      ...store.resumes.filter((item) => item.id !== id),
    ],
  };
  persistBuilderLibrary(next);
  return next;
}

export function upsertGeneratedCoverLetter(
  store: BuilderLibraryStore,
  generated: GeneratedCoverLetter,
): BuilderLibraryStore {
  const id = generated.id;
  const next: BuilderLibraryStore = {
    ...store,
    coverLetterContent: { ...store.coverLetterContent, [String(id)]: generated },
    coverLetters: [
      {
        id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: formatToday(),
        color: "var(--yellow)",
      },
      ...store.coverLetters.filter((item) => item.id !== id),
    ],
  };
  persistBuilderLibrary(next);
  return next;
}

export function upsertGeneratedInterviewPrep(
  store: BuilderLibraryStore,
  generated: GeneratedInterviewPrep,
): BuilderLibraryStore {
  const id = generated.id;
  const next: BuilderLibraryStore = {
    ...store,
    interviewPrepContent: { ...store.interviewPrepContent, [String(id)]: generated },
    interviewPrep: [
      {
        id,
        title: generated.title,
        matchJob: generated.matchJob,
        edited: formatToday(),
        color: "var(--lav)",
        questionCount: Object.values(generated.questions).reduce(
          (total, items) => total + items.length,
          0,
        ),
      },
      ...store.interviewPrep.filter((item) => item.id !== id),
    ],
  };
  persistBuilderLibrary(next);
  return next;
}
