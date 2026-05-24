import type { ApiProviderId } from "@/lib/ai/types";

const STORAGE_KEY = "rezume_ai_session";

export type AiSession = {
  providerId: ApiProviderId;
  apiKey: string;
  model: string;
  verifiedAt: string;
};

function readSessionFrom(storage: Storage): AiSession | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiSession;
  } catch {
    return null;
  }
}

export function saveAiSession(session: AiSession): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(session);
  localStorage.setItem(STORAGE_KEY, serialized);
  sessionStorage.setItem(STORAGE_KEY, serialized);
}

export function loadAiSession(): AiSession | null {
  if (typeof window === "undefined") return null;

  const fromLocal = readSessionFrom(localStorage);
  if (fromLocal) return fromLocal;

  const fromSession = readSessionFrom(sessionStorage);
  if (fromSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fromSession));
    return fromSession;
  }

  return null;
}

export function clearAiSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 7)}••••••••••••${trimmed.slice(-4)}`;
}
