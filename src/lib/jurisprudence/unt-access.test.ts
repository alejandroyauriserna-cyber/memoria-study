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
  it("returns false without env list outside development", () => {
    const previous = process.env.NODE_ENV;
    const previousModerators = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    process.env.NODE_ENV = "test";
    delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    try {
      expect(isJurisprudenceModerator("moderador@unitru.edu.pe")).toBe(false);
    } finally {
      process.env.NODE_ENV = previous;
      if (previousModerators === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previousModerators;
      }
    }
  });

  it("matches configured moderator email at runtime", () => {
    const previous = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    process.env.JURISPRUDENCE_MODERATOR_EMAILS = "amyauris@unitru.edu.pe";
    try {
      expect(isJurisprudenceModerator("amyauris@unitru.edu.pe")).toBe(true);
      expect(isJurisprudenceModerator("otro@unitru.edu.pe")).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previous;
      }
    }
  });

  it("allows any authenticated email in development when no moderators configured", () => {
    const previous = process.env.NODE_ENV;
    const previousModerators = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    process.env.NODE_ENV = "development";
    delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    try {
      expect(isJurisprudenceModerator("creador@unitru.edu.pe")).toBe(true);
    } finally {
      process.env.NODE_ENV = previous;
      if (previousModerators === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previousModerators;
      }
    }
  });
});
