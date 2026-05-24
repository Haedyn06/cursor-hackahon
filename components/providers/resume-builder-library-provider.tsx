"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GeneratedCoverLetter } from "@/components/resume/cover-letter-preview-panel";
import type { GeneratedInterviewPrep } from "@/components/resume/interview-prep-preview-panel";
import type { GeneratedResume } from "@/components/resume/resume-preview-panel";
import type { MockDocument } from "@/lib/mock-data";
import {
  loadBuilderLibrary,
  persistBuilderLibrary,
  clearBuilderLibrary,
  upsertGeneratedCoverLetter,
  upsertGeneratedInterviewPrep,
  upsertGeneratedResume,
  type BuilderLibraryStore,
} from "@/lib/resume-builder-library-storage";

type ResumeBuilderLibraryContextValue = {
  hydrated: boolean;
  resumes: MockDocument[];
  coverLetters: MockDocument[];
  interviewPrep: MockDocument[];
  resumeContent: Record<string, GeneratedResume>;
  coverLetterContent: Record<string, GeneratedCoverLetter>;
  interviewPrepContent: Record<string, GeneratedInterviewPrep>;
  saveGeneratedResume: (generated: GeneratedResume) => void;
  saveGeneratedCoverLetter: (generated: GeneratedCoverLetter) => void;
  saveGeneratedInterviewPrep: (generated: GeneratedInterviewPrep) => void;
  setResumes: (updater: (items: MockDocument[]) => MockDocument[]) => void;
  setCoverLetters: (updater: (items: MockDocument[]) => MockDocument[]) => void;
  setInterviewPrep: (updater: (items: MockDocument[]) => MockDocument[]) => void;
  clearLibrary: () => void;
};

const ResumeBuilderLibraryContext =
  createContext<ResumeBuilderLibraryContextValue | null>(null);

export function ResumeBuilderLibraryProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<BuilderLibraryStore>(() => loadBuilderLibrary());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadBuilderLibrary());
    setHydrated(true);
  }, []);

  const commit = useCallback((next: BuilderLibraryStore) => {
    persistBuilderLibrary(next);
    setStore(next);
  }, []);

  const saveGeneratedResume = useCallback(
    (generated: GeneratedResume) => {
      setStore((current) => upsertGeneratedResume(current, generated));
    },
    [],
  );

  const saveGeneratedCoverLetter = useCallback(
    (generated: GeneratedCoverLetter) => {
      setStore((current) => upsertGeneratedCoverLetter(current, generated));
    },
    [],
  );

  const saveGeneratedInterviewPrep = useCallback(
    (generated: GeneratedInterviewPrep) => {
      setStore((current) => upsertGeneratedInterviewPrep(current, generated));
    },
    [],
  );

  const setResumes = useCallback(
    (updater: (items: MockDocument[]) => MockDocument[]) => {
      setStore((current) => {
        const next = { ...current, resumes: updater(current.resumes) };
        persistBuilderLibrary(next);
        return next;
      });
    },
    [],
  );

  const setCoverLetters = useCallback(
    (updater: (items: MockDocument[]) => MockDocument[]) => {
      setStore((current) => {
        const next = { ...current, coverLetters: updater(current.coverLetters) };
        persistBuilderLibrary(next);
        return next;
      });
    },
    [],
  );

  const setInterviewPrep = useCallback(
    (updater: (items: MockDocument[]) => MockDocument[]) => {
      setStore((current) => {
        const next = { ...current, interviewPrep: updater(current.interviewPrep) };
        persistBuilderLibrary(next);
        return next;
      });
    },
    [],
  );

  const clearLibrary = useCallback(() => {
    setStore(clearBuilderLibrary());
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      resumes: store.resumes,
      coverLetters: store.coverLetters,
      interviewPrep: store.interviewPrep,
      resumeContent: store.resumeContent,
      coverLetterContent: store.coverLetterContent,
      interviewPrepContent: store.interviewPrepContent,
      saveGeneratedResume,
      saveGeneratedCoverLetter,
      saveGeneratedInterviewPrep,
      setResumes,
      setCoverLetters,
      setInterviewPrep,
      clearLibrary,
    }),
    [
      hydrated,
      store,
      saveGeneratedResume,
      saveGeneratedCoverLetter,
      saveGeneratedInterviewPrep,
      setResumes,
      setCoverLetters,
      setInterviewPrep,
      clearLibrary,
    ],
  );

  return (
    <ResumeBuilderLibraryContext.Provider value={value}>
      {children}
    </ResumeBuilderLibraryContext.Provider>
  );
}

export function useResumeBuilderLibrary() {
  const ctx = useContext(ResumeBuilderLibraryContext);
  if (!ctx) {
    throw new Error(
      "useResumeBuilderLibrary must be used within ResumeBuilderLibraryProvider",
    );
  }
  return ctx;
}
