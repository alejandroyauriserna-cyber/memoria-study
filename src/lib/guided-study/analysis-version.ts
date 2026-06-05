/** Increment when prompts, index schema, or exam structure change materially. */
export const GUIDED_STUDY_ANALYSIS_VERSION = 2;

export function isAnalysisStale(storedVersion?: number | null): boolean {
  return (storedVersion ?? 1) < GUIDED_STUDY_ANALYSIS_VERSION;
}
