import {describe, expect, it} from "vitest";
import {catalogEntries} from "@/lib/catalog/entries";
import {compareKeys, defaultFinderV2Criteria, failedChecks, matchCatalog, suggestRelaxations, type FinderV2Criteria} from "@/lib/catalog/matcher";

const entries = catalogEntries();
const run = (patch: Partial<FinderV2Criteria>) => matchCatalog(entries, {...defaultFinderV2Criteria, ...patch});

describe("catalog", () => {
  it("has at least 40 distinct models with unique slugs and ids", () => {
    expect(entries.length).toBeGreaterThanOrEqual(40);
    expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });

  it("keeps design class and validation state separate", () => {
    for (const entry of entries) {
      expect(["EMERGENCY", "REUSE", "BUDGET", "STANDARD_DIY", "ENGINEERED"]).toContain(entry.designClass);
      expect(entry.validationState).toBe("DATA_VALIDATED");
    }
  });

  it("has complete SR and EN names and descriptions", () => {
    for (const entry of entries) {
      expect(entry.nameSr.length, entry.slug).toBeGreaterThan(3);
      expect(entry.nameEn.length, entry.slug).toBeGreaterThan(3);
      expect(entry.descriptionSr.length, entry.slug).toBeGreaterThan(20);
      expect(entry.descriptionEn.length, entry.slug).toBeGreaterThan(20);
    }
  });
});

describe("finder 2.0 hard constraints", () => {
  it("only returns cat entries with enough capacity for cats", () => {
    const results = run({animal: "cat", count: 4});
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.entry.animal).toBe("cat");
      expect(result.entry.capacity.max).toBeGreaterThanOrEqual(4);
    }
  });

  it("never returns another dog size class", () => {
    for (const dogSize of ["small", "medium", "large"] as const) {
      for (const result of run({animal: "dog", dogSize, season: "ANY", structure: "ANY"})) {
        expect(result.entry.animalSizeClass).toBe(dogSize);
      }
    }
  });

  it("summer requests never return insulated winter boxes", () => {
    const results = run({season: "SUMMER"});
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) expect(result.entry.seasons).toContain("SUMMER");
    expect(results.some((result) => result.entry.designClass === "ENGINEERED")).toBe(false);
  });

  it("hides emergency-only models unless the request is an emergency", () => {
    expect(run({season: "ANY", structure: "ANY"}).some((result) => result.entry.emergencyOnly)).toBe(false);
    const emergency = run({season: "EMERGENCY", location: "COVERED", count: 1});
    expect(emergency.some((result) => result.entry.emergencyOnly)).toBe(true);
  });

  it("respects owned tools: no power tools means no power-tool models", () => {
    for (const result of run({tools: ["UTILITY_KNIFE"], season: "ANY", structure: "ANY"})) {
      expect(result.entry.tools.every((tool) => tool === "UTILITY_KNIFE" || tool === "NONE")).toBe(true);
    }
  });

  it("covered-only models are excluded from exposed locations", () => {
    expect(run({location: "EXPOSED", season: "ANY"}).some((result) => result.entry.exposure === "COVERED_ONLY")).toBe(false);
    expect(run({location: "COVERED", season: "WINTER"}).some((result) => result.entry.exposure === "COVERED_ONLY")).toBe(true);
  });

  it("excludes reused-material models when reuse is not allowed", () => {
    expect(run({reuseAllowed: false, season: "ANY"}).every((result) => !result.entry.usesReusedMaterial)).toBe(true);
  });

  it("climate filtering only keeps rated engineered models", () => {
    const results = run({climate: "severe", heating: "heated"});
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.entry.kind === "ENGINEERED" && result.entry.heated)).toBe(true);
  });

  it("budget ceiling removes higher budget classes", () => {
    for (const result of run({budgetMax: "ULTRA_LOW", season: "ANY", structure: "ANY"})) {
      expect(["FREE_REUSED", "ULTRA_LOW"]).toContain(result.entry.budgetClass);
    }
  });
});

describe("finder 2.0 deterministic ordering", () => {
  it("is sorted by the exposed lexicographic key", () => {
    const results = run({season: "WINTER"});
    for (let index = 1; index < results.length; index++) {
      expect(compareKeys(results[index - 1].sortKey, results[index].sortKey)).toBeLessThanOrEqual(0);
    }
  });

  it("puts the smallest sufficient capacity before larger ones", () => {
    const results = run({count: 1, season: "WINTER"});
    expect(results[0].entry.capacity.max).toBeLessThanOrEqual(results[results.length - 1].entry.capacity.max);
  });

  it("prefers models that use owned materials, all else equal", () => {
    const withoutOwned = run({season: "WINTER", count: 1});
    const withOwned = run({season: "WINTER", count: 1, ownedMaterials: ["plastic-tote", "straw"]});
    const firstToteWith = withOwned.findIndex((result) => result.entry.family === "TOTE_IN_TOTE");
    const firstToteWithout = withoutOwned.findIndex((result) => result.entry.family === "TOTE_IN_TOTE");
    expect(firstToteWith).toBeLessThanOrEqual(firstToteWithout);
    expect(withOwned[firstToteWith].ownedUsed).toContain("plastic-tote");
  });

  it("is stable regardless of catalog order", () => {
    const criteria = {...defaultFinderV2Criteria, season: "ANY" as const};
    expect(matchCatalog([...entries].reverse(), criteria).map((result) => result.entry.slug)).toEqual(matchCatalog(entries, criteria).map((result) => result.entry.slug));
  });
});

describe("finder 2.0 relaxations", () => {
  it("suggests single-criterion relaxations that produce matches", () => {
    const criteria: FinderV2Criteria = {...defaultFinderV2Criteria, animal: "dog", dogSize: "large", maxWidthMm: 700, maxDepthMm: 700};
    expect(matchCatalog(entries, criteria)).toHaveLength(0);
    const relaxations = suggestRelaxations(entries, criteria);
    expect(relaxations.map((relaxation) => relaxation.check)).toContain("SPACE");
    for (const relaxation of relaxations) {
      expect(relaxation.criteria.animal).toBe("dog");
      expect(relaxation.criteria.dogSize).toBe("large");
    }
  });

  it("relaxes space to the smallest sufficient footprint, not to unlimited", () => {
    const criteria: FinderV2Criteria = {...defaultFinderV2Criteria, animal: "dog", dogSize: "large", maxWidthMm: 900, maxDepthMm: 900};
    const space = suggestRelaxations(entries, criteria).find((relaxation) => relaxation.check === "SPACE")!;
    const fitting = matchCatalog(entries, space.criteria);
    expect(fitting.length).toBeGreaterThan(0);
    const smallestArea = Math.min(...fitting.map((match) => match.entry.footprint.widthMm * match.entry.footprint.depthMm));
    expect(space.criteria.maxWidthMm * space.criteria.maxDepthMm).toBe(smallestArea);
  });

  it("reports which hard checks fail", () => {
    const cat = entries.find((entry) => entry.slug === "emergency-cardboard-dry")!;
    expect(failedChecks(cat, defaultFinderV2Criteria)).toContain("EMERGENCY_SCOPE");
  });
});
