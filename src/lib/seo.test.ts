import {describe, expect, it} from "vitest";
import {resolveSiteUrl} from "@/lib/seo";

describe("site URL resolution", () => {
  it("uses the www host for production when no override is configured", () => {
    expect(resolveSiteUrl({environment: "production", publicSiteUrl: null}))
      .toBe("https://www.sapice.space");
  });

  it("preserves an explicit site URL override and strips trailing slashes", () => {
    expect(resolveSiteUrl({environment: "production", publicSiteUrl: "https://preview.sapice.space///"}))
      .toBe("https://preview.sapice.space");
  });

  it("keeps localhost as the development default", () => {
    expect(resolveSiteUrl({environment: "development", publicSiteUrl: null}))
      .toBe("http://localhost:3000");
  });
});
