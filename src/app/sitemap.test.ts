import {describe, expect, it} from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap metadata", () => {
  it("does not publish unsupported or unverified freshness hints", () => {
    const pages = sitemap();

    expect(pages.length).toBeGreaterThan(12);
    for (const page of pages) {
      expect(page).not.toHaveProperty("lastModified");
      expect(page).not.toHaveProperty("changeFrequency");
      expect(page).not.toHaveProperty("priority");
    }
  });
});
