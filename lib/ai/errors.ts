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

    if (nestedError && typeof nestedError === "object") {
      const message = (nestedError as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }

    if (typeof nestedError === "string" && nestedError.trim()) return nestedError;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    // Fall through to status-only message.
  }

  return `Provider request failed (${response.status})`;
}
