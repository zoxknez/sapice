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

  it("lists every model and topic page in both locales with hreflang alternates", () => {
    const urls = sitemap().map((page) => page.url);
    expect(urls.some((url) => url.endsWith("/sr/hitno"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/en/models/tote-in-tote-straw"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/sr/planovi/jeftina-kucica-za-macke"))).toBe(true);
    expect(sitemap().every((page) => page.alternates?.languages)).toBe(true);
  });
});
