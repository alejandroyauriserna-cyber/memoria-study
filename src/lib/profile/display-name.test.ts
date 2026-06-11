import { describe, expect, it } from "vitest";
import {
  formatProfileFirstName,
  formatProfileShortName,
  sanitizeProfileDisplayName,
} from "@/lib/profile/display-name";

describe("sanitizeProfileDisplayName", () => {
  it("removes trailing username-like token", () => {
    expect(
      sanitizeProfileDisplayName("Alejandro Martin Yauri Sernaque Aleyauri2005"),
    ).toBe("Alejandro Martin Yauri Sernaque");
  });

  it("keeps normal names", () => {
    expect(sanitizeProfileDisplayName("María José García")).toBe("María José García");
  });
});

describe("formatProfileShortName", () => {
  it("limits words for header", () => {
    expect(formatProfileShortName("Alejandro Martin Yauri Sernaque")).toBe("Alejandro Martin");
  });
});

describe("formatProfileFirstName", () => {
  it("returns first token", () => {
    expect(formatProfileFirstName("Alejandro Martin Yauri Sernaque Aleyauri2005")).toBe("Alejandro");
  });
});
