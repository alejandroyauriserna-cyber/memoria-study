import { describe, expect, it } from "vitest";
import { parseJsonResponse } from "@/lib/api/parse-json-response";

describe("parseJsonResponse", () => {
  it("parsea JSON válido", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
    await expect(parseJsonResponse(response)).resolves.toEqual({ ok: true });
  });

  it("informa archivo demasiado grande", async () => {
    const response = new Response("Payload Too Large", { status: 413 });
    await expect(parseJsonResponse(response)).rejects.toThrow(/demasiado pesado/i);
  });

  it("informa timeout cuando la respuesta no es JSON", async () => {
    const response = new Response("<html>Gateway Timeout</html>", { status: 504 });
    await expect(parseJsonResponse(response)).rejects.toThrow(/tardó demasiado/i);
  });
});
