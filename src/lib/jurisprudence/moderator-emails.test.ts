import { describe, expect, it, vi } from "vitest";
import {
  getEnvModeratorEmails,
  isJurisprudenceModerator,
} from "@/lib/jurisprudence/moderator-emails";

describe("isJurisprudenceModerator", () => {
  it("returns false without env list outside development", async () => {
    const previousModerators = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    try {
      expect(await isJurisprudenceModerator("moderador@unitru.edu.pe")).toBe(false);
    } finally {
      vi.unstubAllEnvs();
      if (previousModerators === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previousModerators;
      }
    }
  });

  it("matches configured moderator email at runtime", async () => {
    const previous = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    process.env.JURISPRUDENCE_MODERATOR_EMAILS = "amyauris@unitru.edu.pe";
    try {
      expect(await isJurisprudenceModerator("amyauris@unitru.edu.pe")).toBe(true);
      expect(await isJurisprudenceModerator("otro@unitru.edu.pe")).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previous;
      }
    }
  });

  it("allows any authenticated email in development when no moderators configured", async () => {
    const previousModerators = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    try {
      expect(await isJurisprudenceModerator("creador@unitru.edu.pe")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
      if (previousModerators === undefined) {
        delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      } else {
        process.env.JURISPRUDENCE_MODERATOR_EMAILS = previousModerators;
      }
    }
  });
});

describe("getEnvModeratorEmails", () => {
  it("reads from process.env", () => {
    const previous = process.env.JURISPRUDENCE_MODERATOR_EMAILS;
    process.env.JURISPRUDENCE_MODERATOR_EMAILS = "a@unitru.edu.pe,b@unitru.edu.pe";
    try {
      expect(getEnvModeratorEmails()).toEqual(["a@unitru.edu.pe", "b@unitru.edu.pe"]);
    } finally {
      if (previous === undefined) delete process.env.JURISPRUDENCE_MODERATOR_EMAILS;
      else process.env.JURISPRUDENCE_MODERATOR_EMAILS = previous;
    }
  });
});
