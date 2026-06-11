import { describe, expect, it } from "vitest";
import {
  getEmailDomain,
  isJurisprudenceModerator,
  isUntInstitutionalEmail,
} from "@/lib/jurisprudence/unt-access";

describe("isUntInstitutionalEmail", () => {
  it("accepts @unitru.edu.pe", () => {
    expect(isUntInstitutionalEmail("estudiante@unitru.edu.pe")).toBe(true);
  });

  it("rejects personal email providers", () => {
    expect(isUntInstitutionalEmail("user@gmail.com")).toBe(false);
    expect(isUntInstitutionalEmail("")).toBe(false);
  });
});

describe("getEmailDomain", () => {
  it("extracts domain", () => {
    expect(getEmailDomain("estudiante@unitru.edu.pe")).toBe("unitru.edu.pe");
  });
});

describe("isJurisprudenceModerator", () => {
  it("returns false without env list", () => {
    expect(isJurisprudenceModerator("moderador@unitru.edu.pe")).toBe(false);
  });
});
