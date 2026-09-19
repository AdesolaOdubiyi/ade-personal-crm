export interface ExtractionProvider {
  extractCandidates(text: string): Promise<unknown>;
}

export class ExtractionProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExtractionProviderError";
  }
}
