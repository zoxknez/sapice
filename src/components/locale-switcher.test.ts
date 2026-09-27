import {describe, expect, it} from "vitest";
import {switchLocalePath} from "@/components/locale-switcher";

describe("locale route switching", () => {
  it("switches root locale", () => {
    expect(switchLocalePath("/sr", "sr", "en")).toBe("/en");
    expect(switchLocalePath("/en", "en", "sr")).toBe("/sr");
  });

  it("switches localized static routes", () => {
    expect(switchLocalePath("/sr/modeli", "sr", "en")).toBe("/en/models");
    expect(switchLocalePath("/en/materials", "en", "sr")).toBe("/sr/materijali");
    expect(switchLocalePath("/sr/metodologija", "sr", "en")).toBe("/en/methodology");
  });

  it("preserves dynamic model slugs", () => {
    expect(switchLocalePath("/sr/modeli/nordic-quad-winter", "sr", "en"))
      .toBe("/en/models/nordic-quad-winter");
    expect(switchLocalePath("/en/models/alpine-large-heated", "en", "sr"))
      .toBe("/sr/modeli/alpine-large-heated");
  });
});
