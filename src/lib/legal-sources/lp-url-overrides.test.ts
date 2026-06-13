import { describe, expect, it } from "vitest";
import { resolvePresetSyncUrls } from "@/lib/legal-sources/lp-url-overrides";
import type { LegalSourcesSettings } from "@/types/legal-sources";

const preset = {
  id: "lp-ncpp",
  url: "https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/",
  urls: [
    "https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/",
    "https://lpderecho.pe/nuevo-codigo-procesal-penal/",
  ],
};

const emptySettings: LegalSourcesSettings = {
  strictMode: false,
  strictNormativeMode: true,
  sources: [],
};

describe("resolvePresetSyncUrls", () => {
  it("returns all catalog parts when preset defines multiple URLs", () => {
    expect(resolvePresetSyncUrls(emptySettings, preset)).toEqual(preset.urls);
  });

  it("prefers user-edited URLs over catalog defaults", () => {
    const settings: LegalSourcesSettings = {
      ...emptySettings,
      lpPresetUrls: {
        "lp-ncpp": ["https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/"],
      },
    };

    expect(resolvePresetSyncUrls(settings, preset)).toEqual([
      "https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/",
    ]);
  });
});
