import { describe, expect, it } from "vitest";
import { resolveUserEmail } from "@/lib/auth/user-email";

describe("resolveUserEmail", () => {
  it("prefers user.email", () => {
    expect(
      resolveUserEmail({
        email: "AmyAuris@unitru.edu.pe",
        user_metadata: { email: "otro@unitru.edu.pe" },
        identities: [],
      } as never),
    ).toBe("amyauris@unitru.edu.pe");
  });

  it("falls back to user_metadata.email", () => {
    expect(
      resolveUserEmail({
        email: undefined,
        user_metadata: { email: "amyauris@unitru.edu.pe" },
        identities: [],
      } as never),
    ).toBe("amyauris@unitru.edu.pe");
  });
});
