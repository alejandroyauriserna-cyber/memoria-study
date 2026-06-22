import type { TextGenerationProvider } from "@/lib/ai/text-generation-types";
import type { TextAiProviderStatus } from "@/lib/ai/server-ai-env";

export class TextAiProvidersFailedError extends Error {
  readonly providerErrors: string[];
  readonly providersAttempted: TextGenerationProvider[];
  readonly providersConfigured: TextAiProviderStatus;

  constructor(
    message: string,
    input: {
      providerErrors: string[];
      providersAttempted: TextGenerationProvider[];
      providersConfigured: TextAiProviderStatus;
    },
  ) {
    super(message);
    this.name = "TextAiProvidersFailedError";
    this.providerErrors = input.providerErrors;
    this.providersAttempted = input.providersAttempted;
    this.providersConfigured = input.providersConfigured;
  }
}

export function isTextAiProvidersFailedError(error: unknown): error is TextAiProvidersFailedError {
  return error instanceof TextAiProvidersFailedError;
}
