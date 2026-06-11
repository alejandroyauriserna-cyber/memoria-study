import { describe, expect, it } from "vitest";
import { findJurisprudenceDuplicates } from "@/lib/jurisprudence/find-duplicates";
import { normalizeExpediente, normalizeJurisprudenceText } from "@/lib/jurisprudence/normalize-text";

describe("normalizeJurisprudenceText", () => {
  it("removes accents and punctuation", () => {
    expect(normalizeJurisprudenceText("Casación Nº 1465-2007")).toBe("casacion n 1465 2007");
  });
});

describe("normalizeExpediente", () => {
  it("uppercases expediente", () => {
    expect(normalizeExpediente("  cas-1465-2007  ")).toBe("CAS-1465-2007");
  });
});

describe("findJurisprudenceDuplicates", () => {
  it("detects duplicate expediente", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          ilike: () => ({
            neq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { id: "cas-1465", title: "Fallo", expediente: "CAS-1465" },
                }),
              }),
            }),
          }),
        }),
      }),
    };

    const match = await findJurisprudenceDuplicates(admin as never, {
      title: "Otro título",
      expediente: "cas-1465",
    });

    expect(match?.reason).toBe("expediente");
    expect(match?.id).toBe("cas-1465");
  });
});
