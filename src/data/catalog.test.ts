import {describe, expect, it} from "vitest";
import {shelterModels} from "@/data/models";
import {sources} from "@/data/sources";

describe("catalog integrity", () => {
  it("keeps model ids and slugs unique", () => {
    const ids = shelterModels.map((model) => model.id);
    const slugs = shelterModels.map((model) => model.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps bilingual model copy populated", () => {
    for (const model of shelterModels) {
      expect(model.translations.sr.name.trim().length).toBeGreaterThan(0);
      expect(model.translations.sr.description.trim().length).toBeGreaterThan(0);
      expect(model.translations.en.name.trim().length).toBeGreaterThan(0);
      expect(model.translations.en.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps source record ids aligned with their keys", () => {
    for (const [key, source] of Object.entries(sources)) {
      expect(source.id).toBe(key);
      expect(source.url.startsWith("https://")).toBe(true);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)).toBe(true);
    }
  });

  it("does not duplicate source ids within one model", () => {
    for (const model of shelterModels) {
      expect(new Set(model.sourceIds).size).toBe(model.sourceIds.length);
    }
  });
});
