import { describe, expect, it } from "vitest";
import { readServerEnv, readServerEnvList } from "@/lib/env/runtime";

describe("readServerEnv", () => {
  it("trims values", () => {
    const previous = process.env.TEST_READ_SERVER_ENV;
    process.env.TEST_READ_SERVER_ENV = "  hello  ";
    try {
      expect(readServerEnv("TEST_READ_SERVER_ENV")).toBe("hello");
    } finally {
      if (previous === undefined) delete process.env.TEST_READ_SERVER_ENV;
      else process.env.TEST_READ_SERVER_ENV = previous;
    }
  });

  it("parses comma lists", () => {
    const previous = process.env.TEST_READ_SERVER_LIST;
    process.env.TEST_READ_SERVER_LIST = "AmyAuris@unitru.edu.pe, otro@unitru.edu.pe";
    try {
      expect(readServerEnvList("TEST_READ_SERVER_LIST")).toEqual([
        "amyauris@unitru.edu.pe",
        "otro@unitru.edu.pe",
      ]);
    } finally {
      if (previous === undefined) delete process.env.TEST_READ_SERVER_LIST;
      else process.env.TEST_READ_SERVER_LIST = previous;
    }
  });
});
