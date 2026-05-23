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
import { v4 as uuid } from "uuid";
import type {
  AIProvider,
  AppState,
  ApplicationStatus,
  JobApplication,
  ResumeContent,
  SavedResume,
  UserProfile,
} from "./types";

const STORAGE_KEY = "rezume-app-state";

const defaultProfile: UserProfile = {
  targetRole: "",
  experienceLevel: "new_grad",
  topSkills: "",
  aboutYou: "",
  linkedin: "",
  github: "",
  portfolio: "",
  hasUltimateProfile: false,
};

const defaultState: AppState = {
  onboardingComplete: false,
  apiKey: null,
  profile: defaultProfile,
  baseResumeText: "",
  savedResumes: [],
  applications: [],
};

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(12)}${key.slice(-4)}`;
}

interface RezumeContextValue extends AppState {
  setApiKey: (provider: AIProvider, key: string, verified: boolean) => void;
  clearApiKey: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setBaseResume: (text: string) => void;
  completeOnboarding: () => void;
  addSavedResume: (label: string, text: string) => void;
  removeSavedResume: (id: string) => void;
  addApplication: (
    data: Omit<JobApplication, "id" | "createdAt" | "status">
  ) => string;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;
  getApplication: (id: string) => JobApplication | undefined;
  resetAll: () => void;
}

const RezumeContext = createContext<RezumeContextValue | null>(null);

export function RezumeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const setApiKey = useCallback(
    (provider: AIProvider, key: string, verified: boolean) => {
      setState((s) => ({
        ...s,
        apiKey: { provider, maskedKey: maskKey(key), verified },
      }));
    },
    []
  );

  const clearApiKey = useCallback(() => {
    setState((s) => ({ ...s, apiKey: null }));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((s) => ({
      ...s,
      profile: { ...s.profile, ...patch },
    }));
  }, []);

  const setBaseResume = useCallback((text: string) => {
    setState((s) => ({ ...s, baseResumeText: text }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({
      ...s,
      onboardingComplete: true,
      profile: { ...s.profile, hasUltimateProfile: true },
    }));
  }, []);

  const addSavedResume = useCallback((label: string, text: string) => {
    const resume: SavedResume = {
      id: uuid(),
      label,
      extractedText: text,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      savedResumes: [resume, ...s.savedResumes],
    }));
  }, []);

  const removeSavedResume = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      savedResumes: s.savedResumes.filter((r) => r.id !== id),
    }));
  }, []);

  const addApplication = useCallback(
    (data: Omit<JobApplication, "id" | "createdAt" | "status">) => {
      const id = uuid();
      const app: JobApplication = {
        ...data,
        id,
        status: "apply",
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        applications: [app, ...s.applications],
      }));
      return id;
    },
    []
  );

  const updateApplication = useCallback(
    (id: string, patch: Partial<JobApplication>) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === id ? { ...a, ...patch } : a
        ),
      }));
    },
    []
  );

  const deleteApplication = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      applications: s.applications.filter((a) => a.id !== id),
    }));
  }, []);

  const getApplication = useCallback(
    (id: string) => state.applications.find((a) => a.id === id),
    [state.applications]
  );

  const resetAll = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setApiKey,
      clearApiKey,
      updateProfile,
      setBaseResume,
      completeOnboarding,
      addSavedResume,
      removeSavedResume,
      addApplication,
      updateApplication,
      deleteApplication,
      getApplication,
      resetAll,
    }),
    [
      state,
      setApiKey,
      clearApiKey,
      updateProfile,
      setBaseResume,
      completeOnboarding,
      addSavedResume,
      removeSavedResume,
      addApplication,
      updateApplication,
      deleteApplication,
      getApplication,
      resetAll,
    ]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neo-bg dot-grid">
        <div className="neo-card px-8 py-6 text-lg font-bold">Loading Rezume…</div>
      </div>
    );
  }

  return (
    <RezumeContext.Provider value={value}>{children}</RezumeContext.Provider>
  );
}

export function useRezume() {
  const ctx = useContext(RezumeContext);
  if (!ctx) throw new Error("useRezume must be used within RezumeProvider");
  return ctx;
}

export type { ResumeContent, ApplicationStatus };
