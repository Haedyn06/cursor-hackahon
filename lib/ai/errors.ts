export class AiProviderError extends Error {
  readonly status: number;
  readonly providerId?: string;

  constructor(message: string, status = 400, providerId?: string) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
    this.providerId = providerId;
  }
}

export async function readProviderError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Record<string, unknown>;
    const nestedError = data.error;

    let message: string | undefined;

    if (nestedError && typeof nestedError === "object") {
      const nestedMessage = (nestedError as { message?: unknown }).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        message = nestedMessage;
      }
    }

    if (!message && typeof nestedError === "string" && nestedError.trim()) {
      message = nestedError;
    }

    if (!message && typeof data.message === "string" && data.message.trim()) {
      message = data.message;
    }

    if (message) {
      return sanitizeProviderMessage(message);
    }
  } catch {
    // Fall through to status-only message.
  }

  return `Provider request failed (${response.status})`;
}

function sanitizeProviderMessage(message: string): string {
  const trimmed = message.trim();

  if (
    trimmed.includes("no longer available to new users") ||
    trimmed.includes("is no longer available")
  ) {
    return "This Gemini model is deprecated. Disconnect and reconnect your API key in Settings to use Gemini 2.5 Flash.";
  }

  if (
    trimmed.includes("exceeded your current quota") ||
    trimmed.includes("Quota exceeded")
  ) {
    return "Google AI quota exceeded. Check usage at aistudio.google.com, wait for the limit to reset, or switch to Groq (free tier) in Settings.";
  }

  const firstLine = trimmed.split("\n")[0]?.trim() ?? trimmed;
  if (firstLine.length > 280) {
    return `${firstLine.slice(0, 277)}…`;
  }

  return firstLine;
}
