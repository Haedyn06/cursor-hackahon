import type { ApiProviderId } from "@/lib/ai/types";
import { resolveGeminiModel } from "@/lib/ai/providers";

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

function normalizeSession(session: AiSession): AiSession {
  if (session.providerId !== "gemini") {
    return session;
  }

  const model = resolveGeminiModel(session.model);
  if (model === session.model) {
    return session;
  }

  return { ...session, model };
}

export function saveAiSession(session: AiSession): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeSession(session);
  const serialized = JSON.stringify(normalized);
  localStorage.setItem(STORAGE_KEY, serialized);
  sessionStorage.setItem(STORAGE_KEY, serialized);
}

export function loadAiSession(): AiSession | null {
  if (typeof window === "undefined") return null;

  const fromLocal = readSessionFrom(localStorage);
  if (fromLocal) {
    const normalized = normalizeSession(fromLocal);
    if (normalized.model !== fromLocal.model) {
      saveAiSession(normalized);
    }
    return normalized;
  }

  const fromSession = readSessionFrom(sessionStorage);
  if (fromSession) {
    const normalized = normalizeSession(fromSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
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
