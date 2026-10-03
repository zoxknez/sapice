import {describe, expect, it} from "vitest";
import {materialLibrary, lambdaFromRPerInch} from "@/data/material-library";
import {materials} from "@/data/materials";
import {sources} from "@/data/sources";
import {evaluateSubstitute, layerResistance, substituteCandidates, thicknessForResistance} from "@/lib/catalog/substitutes";
import {beddingRecommendations, beddingVerdict} from "@/data/bedding";
import {reuseState, placementResult} from "@/lib/field-checks";
import {catalogEntries, catalogEntry} from "@/lib/catalog/entries";
import {budgetEstimate, budgetFit, emptyPriceProfile} from "@/lib/catalog/budget";
import {emptyWorkshop, inventoryReport, parseWorkshop} from "@/lib/catalog/inventory";
import {fitPartsOnOffcuts, packBatch, packCutParts} from "@/lib/nesting";
import {upgradeChain, upgradeEdges} from "@/data/upgrades";
import {retrofitPlan, type RetrofitInput} from "@/lib/retrofit";
import {getPracticalModel} from "@/data/practical-models";
import {compilePracticalModel} from "@/lib/practical/compiler";

describe("material library", () => {
  it("references existing sources for every known thermal value", () => {
    for (const material of Object.values(materialLibrary)) {
      for (const id of material.sourceIds) expect(sources[id], `${material.id}:${id}`).toBeDefined();
      if (material.thermal.status === "KNOWN") {
        expect(material.thermal.sourceIds.length).toBeGreaterThan(0);
        for (const id of material.thermal.sourceIds) expect(sources[id], `${material.id}:${id}`).toBeDefined();
        if (material.thermal.lambdaRangeWmK) {
          const [low, high] = material.thermal.lambdaRangeWmK;
          expect(low).toBeLessThanOrEqual(high);
        }
      }
    }
  });

  it("matches the engineered thermal library for plywood and XPS planning values", () => {
    expect(materialLibrary["plywood-exterior"].thermal.status === "KNOWN" && materialLibrary["plywood-exterior"].thermal.lambdaPlanningWmK).toBe(materials.plywood.lambdaTypicalWmK);
    expect(materialLibrary.xps.thermal.status === "KNOWN" && materialLibrary.xps.thermal.lambdaPlanningWmK).toBe(materials.xps.lambdaTypicalWmK);
  });

  it("converts R per inch to λ", () => {
    expect(lambdaFromRPerInch(5)).toBeCloseTo(0.0288, 3);
    expect(lambdaFromRPerInch(3.8)).toBeCloseTo(0.038, 3);
  });

  it("never allows fibrous insulation to face the animal", () => {
    for (const material of Object.values(materialLibrary)) {
      if (material.category === "FIBROUS_INSULATION") expect(material.animalFacing).toBe("NEVER");
    }
  });

  it("keeps unknown reused materials without invented conductivity", () => {
    for (const id of ["pallet", "scrap-lumber", "cardboard", "plastic-tote", "wood-crate"]) {
      expect(materialLibrary[id].thermal.status).toBe("UNKNOWN");
    }
  });
});

describe("substitutes", () => {
  it("computes R = d / λ and the equivalent thickness", () => {
    expect(layerResistance(50, 0.033)).toBeCloseTo(1.515, 3);
    expect(thicknessForResistance(1.515, 0.038)).toBe(58);
  });

  it("XPS 50 → EPS needs more thickness and carries caveats", () => {
    const result = evaluateSubstitute("xps", "eps", "INSULATION", 50);
    expect(result.kind).toBe("THERMAL_EQUIVALENT");
    if (result.kind !== "THERMAL_EQUIVALENT") return;
    expect(result.requiredThicknessMm).toBeGreaterThan(50);
    expect(result.caveatsEn.join(" ")).toContain("not structural equivalence");
  });

  it("cork without a sourced λ requires redesign instead of a fake equivalence", () => {
    expect(evaluateSubstitute("xps", "cork-board", "INSULATION", 50).kind).toBe("REDESIGN_REQUIRED");
  });

  it("mineral wool is not allowed in an assembly that is not fully enclosed", () => {
    expect(evaluateSubstitute("xps", "mineral-wool", "INSULATION", 50).kind).toBe("NOT_ALLOWED");
    expect(evaluateSubstitute("xps", "mineral-wool", "INSULATION", 50, {fullyEnclosedAssembly: true}).kind).toBe("THERMAL_EQUIVALENT");
  });

  it("refuses non animal-facing materials as an interior lining", () => {
    expect(evaluateSubstitute("plywood-interior", "eps", "ANIMAL_FACING_LINING", 6).kind).toBe("NOT_ALLOWED");
  });

  it("only lists known candidate materials", () => {
    for (const [from, list] of Object.entries(substituteCandidates)) {
      expect(materialLibrary[from]).toBeDefined();
      for (const id of list) expect(materialLibrary[id], id).toBeDefined();
    }
  });
});

describe("bedding", () => {
  it("defaults to straw for exposed community-cat winter shelters and rejects hay, towels and blankets", () => {
    const context = {animal: "cat" as const, season: "WINTER" as const, exposedOutdoor: true};
    expect(beddingRecommendations(context)[0].option.id).toBe("straw");
    expect(beddingVerdict("hay", context)).toBe("NOT_RECOMMENDED");
    expect(beddingVerdict("towel", context)).toBe("NOT_RECOMMENDED");
    expect(beddingVerdict("blanket", context)).toBe("NOT_RECOMMENDED");
  });

  it("prefers no bedding in summer", () => {
    expect(beddingVerdict("none", {animal: "dog", season: "SUMMER", exposedOutdoor: true})).toBe("RECOMMENDED");
  });
});

describe("field checklists", () => {
  it("any reject criterion rejects reused material", () => {
    expect(reuseState({reject: {OIL: true}, accept: {CLEAN: true, DRY: true, UNDAMAGED: true, KNOWN_USE: true, NO_CHEMICALS: true, SUITS_ROLE: true, OWNER_PERMISSION: true}})).toBe("REJECTED");
  });

  it("passes only when every accept criterion is confirmed", () => {
    expect(reuseState({reject: {}, accept: {CLEAN: true}})).toBe("INCOMPLETE");
    expect(reuseState({reject: {}, accept: {CLEAN: true, DRY: true, UNDAMAGED: true, KNOWN_USE: true, NO_CHEMICALS: true, SUITS_ROLE: true, OWNER_PERMISSION: true}})).toBe("CHECKLIST_PASSED");
  });

  it("flooding is always critical; summer sun is critical only in summer", () => {
    expect(placementResult({FLOODING_RISK: true}, {animal: "dog", season: "WINTER"}).result).toBe("CRITICAL_ISSUE");
    expect(placementResult({MIDDAY_SUN: true}, {animal: "dog", season: "WINTER"}).result).toBe("NEEDS_ATTENTION");
    expect(placementResult({MIDDAY_SUN: true}, {animal: "dog", season: "SUMMER"}).result).toBe("CRITICAL_ISSUE");
    expect(placementResult({}, {animal: "cat", season: "ALL"}).result).toBe("NO_OBVIOUS_ISSUE");
  });
});

describe("budget", () => {
  const entry = catalogEntry("tote-with-straw")!;

  it("is incomplete without user prices and never invents a price", () => {
    const estimate = budgetEstimate(entry, emptyPriceProfile, emptyWorkshop);
    expect(estimate.complete).toBe(false);
    expect(estimate.requiredPurchaseCost).toBe(0);
    expect(budgetFit(estimate, 1000)).toBe("UNKNOWN");
  });

  it("ignores owned material value in the purchase cost but reports it separately", () => {
    const prices = Object.fromEntries(entry.requiredMaterials.map((line) => [line.materialId!, 100]));
    const owned = {version: 1 as const, tools: [], items: [{materialId: "plastic-tote", quantity: 1, unit: "PIECE" as const, offcuts: []}]};
    const withOwned = budgetEstimate(entry, {version: 1, currency: "RSD", prices}, owned);
    const without = budgetEstimate(entry, {version: 1, currency: "RSD", prices}, emptyWorkshop);
    expect(withOwned.complete).toBe(true);
    expect(withOwned.requiredPurchaseCost).toBe(without.requiredPurchaseCost - 100);
    expect(withOwned.ownedValueIgnored).toBe(100);
    expect(withOwned.costPerAnimal).toBe(withOwned.requiredPurchaseCost / entry.capacity.recommended);
  });
});

describe("inventory and offcuts", () => {
  it("parses only valid local workshop data", () => {
    expect(parseWorkshop({version: 2})).toEqual(emptyWorkshop);
    expect(parseWorkshop({version: 1, items: [{materialId: "eps", quantity: -1, unit: "SHEET"}], tools: []}).items).toHaveLength(0);
  });

  it("checks whether the needed parts fit the user's offcuts", () => {
    const parts = [{id: "a", quantity: 1, widthMm: 600, heightMm: 400, shape: "rectangle" as const}];
    expect(fitPartsOnOffcuts(parts, [{id: "o1", widthMm: 900, heightMm: 500}]).allPlaced).toBe(true);
    expect(fitPartsOnOffcuts(parts, [{id: "o1", widthMm: 500, heightMm: 500}]).allPlaced).toBe(false);
    expect(fitPartsOnOffcuts(parts, [{id: "o1", widthMm: 405, heightMm: 610}]).allPlaced).toBe(true);
  });

  it("reports owned, partial and missing lines and missing tools", () => {
    const entry = catalogEntry("tote-eps-lined")!;
    const workshop = {version: 1 as const, tools: [], items: [{materialId: "plastic-tote", quantity: 1, unit: "PIECE" as const, offcuts: []}]};
    const report = inventoryReport(entry, workshop);
    expect(report.lines.find((line) => line.required.materialId === "plastic-tote")?.status).toBe("OWNED");
    expect(report.lines.find((line) => line.required.materialId === "eps")?.status).toBe("BUY");
    expect(report.missingTools).toContain("UTILITY_KNIFE");
  });

  it("can satisfy a sheet requirement from offcuts using the compiled cut list", () => {
    const model = getPracticalModel("tote-eps-lined")!;
    const parts = compilePracticalModel(model).cutParts.filter((part) => part.materialId === "eps");
    const entry = catalogEntry("tote-eps-lined")!;
    const bigOffcuts = Array.from({length: 8}, () => ({widthMm: 1000, heightMm: 500}));
    const report = inventoryReport(entry, {version: 1, tools: ["UTILITY_KNIFE"], items: [{materialId: "eps", quantity: 0, unit: "SHEET", offcuts: bigOffcuts}]}, {eps: parts});
    expect(report.lines.find((line) => line.required.materialId === "eps")?.status).toBe("OFFCUTS_FIT");
  });
});

describe("batch nesting", () => {
  it("shares stock across identical units instead of multiplying single plans", () => {
    const parts = compilePracticalModel(getPracticalModel("osb-economy-cat")!).cutParts.filter((part) => part.materialId === "osb3");
    const single = packCutParts(parts).length;
    const batch = packBatch(parts, 6).length;
    expect(batch).toBeLessThanOrEqual(single * 6);
    expect(batch).toBeLessThan(single * 6);
    const ids = packBatch(parts, 2).flatMap((sheet) => sheet.parts.map((part) => part.partId));
    expect(ids.some((id) => id.startsWith("u2-"))).toBe(true);
  });
});

describe("upgrade graph", () => {
  const slugs = new Set(catalogEntries().map((entry) => entry.slug));

  it("only connects existing canonical models", () => {
    for (const edge of upgradeEdges) {
      expect(slugs.has(edge.from), edge.id).toBe(true);
      if (edge.to) expect(slugs.has(edge.to), edge.id).toBe(true);
      expect(edge.kind === "NEW_MODEL").toBe(edge.to !== null);
      for (const id of edge.newMaterialIds) expect(materialLibrary[id], id).toBeDefined();
    }
  });

  it("walks the emergency cat chain to an engineered model without cycles", () => {
    const chain = upgradeChain("emergency-cardboard-dry");
    expect(chain[0]).toBe("emergency-cardboard-dry");
    expect(chain).toContain("tote-with-straw");
    expect(chain[chain.length - 1]).toBe("nordic-solo-winter");
    expect(new Set(chain).size).toBe(chain.length);
  });

  it("has unique edge ids", () => {
    expect(new Set(upgradeEdges.map((edge) => edge.id)).size).toBe(upgradeEdges.length);
  });
});

describe("retrofit", () => {
  const base: RetrofitInput = {
    animal: "dog", dogSize: "medium", season: "WINTER", widthMm: 900, depthMm: 1100, heightMm: 900,
    wallMaterial: "WOOD", wallThicknessMm: 18, floor: "WOOD_ON_GROUND", roof: "SLOPED_TO_ENTRANCE",
    leaks: true, onGround: true, entrances: 1, entranceWidthMm: 450, insulated: false, insulationExposed: false,
    ventilated: false, woodCondition: "WEATHERED", location: "EXPOSED", removableRoof: false
  };

  it("puts water before raising, entrance, insulation, lining and service access", () => {
    const ids = retrofitPlan(base).priorities.map((item) => item.id);
    const order = ["water", "raise", "entrance", "insulate", "protect-insulation", "service"];
    const positions = order.map((id) => ids.indexOf(id));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("never calculates thermal performance", () => {
    expect(retrofitPlan(base).thermalCalculated).toBe(false);
  });

  it("stops at rotten structures", () => {
    expect(retrofitPlan({...base, woodCondition: "ROTTEN"}).priorities[0].id).toBe("rotten");
  });

  it("does not recommend insulation for a summer-only retrofit", () => {
    const ids = retrofitPlan({...base, season: "SUMMER"}).priorities.map((item) => item.id);
    expect(ids).not.toContain("insulate");
    expect(ids).toContain("summer");
  });
});
