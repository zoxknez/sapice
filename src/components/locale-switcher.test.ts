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

  it("switches the new platform routes", () => {
    expect(switchLocalePath("/sr/hitno", "sr", "en")).toBe("/en/emergency");
    expect(switchLocalePath("/en/build-with-what-you-have", "en", "sr")).toBe("/sr/napravi-od-onoga-sto-imas");
    expect(switchLocalePath("/sr/za-udruzenja", "sr", "en")).toBe("/en/rescue");
  });

  it("translates localized topic slugs", () => {
    expect(switchLocalePath("/sr/planovi/jeftina-kucica-za-macke", "sr", "en")).toBe("/en/plans/cheap-cat-shelter");
    expect(switchLocalePath("/en/plans/pallet-dog-house", "en", "sr")).toBe("/sr/planovi/kucica-za-psa-od-paleta");
  });
});
