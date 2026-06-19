import { describe, expect, it } from "vitest";
import { materialStoragePathFromFileUrl } from "@/lib/materials/delete-material";

describe("materialStoragePathFromFileUrl", () => {
  it("extracts the storage object path from a public Supabase URL", () => {
    expect(
      materialStoragePathFromFileUrl(
        "https://example.supabase.co/storage/v1/object/public/shared-materials/user-1/abc-file.pdf",
      ),
    ).toBe("user-1/abc-file.pdf");
  });

  it("returns null for unrelated URLs", () => {
    expect(materialStoragePathFromFileUrl("https://example.com/file.pdf")).toBeNull();
  });
});
