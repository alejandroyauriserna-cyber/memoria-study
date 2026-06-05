import { describe, expect, it } from "vitest";
import {
  GUIDED_STUDY_ANALYSIS_VERSION,
  isAnalysisStale,
} from "@/lib/guided-study/analysis-version";

describe("isAnalysisStale", () => {
  it("flags missing or old versions", () => {
    expect(isAnalysisStale(undefined)).toBe(true);
    expect(isAnalysisStale(1)).toBe(true);
    expect(isAnalysisStale(GUIDED_STUDY_ANALYSIS_VERSION)).toBe(false);
  });
});
