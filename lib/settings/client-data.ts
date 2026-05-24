import { clearAiSession } from "@/lib/ai/session";
import { clearBuilderLibrary } from "@/lib/resume-builder-library-storage";

export function clearBuilderLibraryStorage() {
  clearBuilderLibrary();
}

export function clearLocalAppData() {
  clearAiSession();
  clearBuilderLibrary();
}
