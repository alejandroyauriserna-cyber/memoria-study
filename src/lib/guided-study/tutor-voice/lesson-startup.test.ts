import { describe, expect, it } from "vitest";
import {
  lessonStartupLabel,
  narrationPlaybackErrorMessage,
  parseNarrationFetchError,
} from "@/lib/guided-study/tutor-voice/lesson-startup";

describe("lessonStartupLabel", () => {
  it("describes each startup phase", () => {
    expect(lessonStartupLabel("generating", "listen")).toContain("Generando");
    expect(lessonStartupLabel("preparing_audio", "listen")).toContain("voz");
    expect(lessonStartupLabel("starting", "practice")).toContain("interactiva");
    expect(lessonStartupLabel("starting", "listen")).toContain("narración");
  });
});

describe("parseNarrationFetchError", () => {
  it("maps auth and server failures", () => {
    expect(parseNarrationFetchError(401, { error: "Debes iniciar sesión." })).toContain("sesión");
    expect(parseNarrationFetchError(503, {})).toContain("disponible");
    expect(parseNarrationFetchError(500, { error: "Fallo IA" })).toBe("Fallo IA");
  });
});

describe("narrationPlaybackErrorMessage", () => {
  it("explains browser audio blocks", () => {
    expect(narrationPlaybackErrorMessage("not-allowed")).toContain("bloqueó");
    expect(narrationPlaybackErrorMessage()).toContain("Reintentar");
  });
});
