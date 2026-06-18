import { describe, expect, it } from "vitest";
import { clampElapsedSec } from "@/lib/guided-study/tutor-voice/resume-offset";

describe("clampElapsedSec", () => {
  it("no baja de cero", () => {
    expect(clampElapsedSec(-30, 120)).toBe(0);
  });

  it("no supera la duración total", () => {
    expect(clampElapsedSec(200, 120)).toBe(119);
  });

  it("mantiene valores intermedios", () => {
    expect(clampElapsedSec(45, 120)).toBe(45);
  });
});
