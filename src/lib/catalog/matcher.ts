import type {CatalogEntry} from "@/lib/catalog/entries";
import {
  budgetClassRank,
  difficultyRank,
  type BudgetClass,
  type DesignClass,
  type Difficulty,
  type Season,
  type Tool
} from "@/lib/catalog/taxonomy-core";

/**
 * Finder 2.0: hard constraints remove a model, soft preferences only change a deterministic
 * lexicographic order. There is no opaque score: every position can be explained by the ordered
 * keys below, and every result carries the checks it passed and the compromises it makes.
 */

export type FinderSeason = Season | "ANY";
export type FinderLocation = "COVERED" | "SHELTERED" | "EXPOSED";
export type FinderClimate = "any" | "moderate" | "cold" | "severe";

export type FinderV2Criteria = {
  animal: "cat" | "dog";
  count: number;
  dogSize: "small" | "medium" | "large";
  season: FinderSeason;
  structure: "SHELTER" | "ANY";
  designClasses: DesignClass[];
  heating: "any" | "passive" | "heated";
  climate: FinderClimate;
  budgetMax: BudgetClass | "ANY";
  /** Empty means "not specified": no tool constraint. */
  tools: Tool[];
  skill: Difficulty;
  maxTimeMinutes: number | null;
  maxWidthMm: number;
  maxDepthMm: number;
  location: FinderLocation;
  windExposed: boolean;
  reuseAllowed: boolean;
  ownedMaterials: string[];
  portable: boolean;
  batch: boolean;
};

export const defaultFinderV2Criteria: FinderV2Criteria = {
  animal: "cat",
  count: 2,
  dogSize: "medium",
  season: "WINTER",
  structure: "SHELTER",
  designClasses: [],
  heating: "any",
  climate: "any",
  budgetMax: "ANY",
  tools: [],
  skill: "WORKSHOP",
  maxTimeMinutes: null,
  maxWidthMm: 2400,
  maxDepthMm: 1800,
  location: "EXPOSED",
  windExposed: false,
  reuseAllowed: true,
  ownedMaterials: [],
  portable: false,
  batch: false
};

export type MatchCheck =
  | "ANIMAL"
  | "CAPACITY"
  | "SEASON"
  | "STRUCTURE"
  | "DESIGN_CLASS"
  | "HEATING"
  | "CLIMATE"
  | "BUDGET"
  | "TOOLS"
  | "SKILL"
  | "TIME"
  | "SPACE"
  | "LOCATION"
  | "REUSE"
  | "EMERGENCY_SCOPE";

export type MatchCompromise =
  | "EMERGENCY_ONLY"
  | "NO_THERMAL_ESTIMATE"
  | "PARTIAL_THERMAL"
  | "FREQUENT_INSPECTION"
  | "NEEDS_COVER"
  | "NOT_FOR_SLEEPING"
  | "NO_WINTER_RATING"
  | "REUSE_INSPECTION"
  | "PLANNING_TIME_ESTIMATE";

export type MatchResult = {
  entry: CatalogEntry;
  passed: MatchCheck[];
  ownedUsed: string[];
  compromises: MatchCompromise[];
  /** The exact ordered key used for sorting, exposed so the UI can explain the position. */
  sortKey: number[];
};

const climateRank: Record<NonNullable<CatalogEntry["climateProfile"]>, number> = {
  SHELTERED_MILD: 0,
  WINTER_MODERATE: 1,
  WINTER_COLD: 2,
  WINTER_SEVERE: 3
};
const climateNeedRank: Record<Exclude<FinderClimate, "any">, number> = {moderate: 1, cold: 2, severe: 3};

const locationRank: Record<FinderLocation, number> = {COVERED: 0, SHELTERED: 1, EXPOSED: 2};
const exposureMaxLocation: Record<CatalogEntry["exposure"], number> = {COVERED_ONLY: 0, SHELTERED: 1, EXPOSED_OK: 2};

function toolSatisfied(required: Tool, owned: Tool[]) {
  if (required === "NONE") return true;
  if (owned.includes("WORKSHOP")) return true;
  if (owned.includes(required)) return true;
  if (required === "SCREWDRIVER" && owned.includes("DRILL")) return true;
  return false;
}

export function seasonMatches(entry: CatalogEntry, season: FinderSeason) {
  if (season === "ANY") return true;
  if (season === "EMERGENCY") {
    return entry.seasons.includes("EMERGENCY") || (entry.structureType === "SLEEPING_SHELTER" && entry.buildTimeMinutes[0] <= 60);
  }
  if (entry.seasons.includes(season)) return true;
  return (season === "RAIN" || season === "WIND") && entry.seasons.includes("ALL_SEASON");
}

export function structureMatches(entry: CatalogEntry, criteria: Pick<FinderV2Criteria, "structure" | "season">) {
  if (criteria.structure === "ANY") return true;
  if (entry.structureType === "SLEEPING_SHELTER") return true;
  if (criteria.season === "SUMMER") return entry.structureType === "SHADE" || entry.structureType === "RAISED_PLATFORM";
  if (criteria.season === "RAIN" || criteria.season === "WIND") return entry.structureType === "WINDBREAK" || entry.structureType === "SHADE";
  return false;
}

/** Returns the list of failed hard constraints (empty = passes). */
export function failedChecks(entry: CatalogEntry, criteria: FinderV2Criteria): MatchCheck[] {
  const failed: MatchCheck[] = [];
  const sizeOk = criteria.animal === "cat" ? entry.animalSizeClass === "standard" : entry.animalSizeClass === criteria.dogSize;
  if (entry.animal !== criteria.animal || !sizeOk) failed.push("ANIMAL");
  const requested = criteria.animal === "dog" ? 1 : Math.max(1, criteria.count);
  if (entry.capacity.max < requested) failed.push("CAPACITY");
  if (!seasonMatches(entry, criteria.season)) failed.push("SEASON");
  if (!structureMatches(entry, criteria)) failed.push("STRUCTURE");
  if (criteria.designClasses.length && !criteria.designClasses.includes(entry.designClass)) failed.push("DESIGN_CLASS");
  if ((criteria.heating === "heated" && !entry.heated) || (criteria.heating === "passive" && entry.heated)) failed.push("HEATING");
  if (criteria.climate !== "any") {
    if (!entry.climateProfile || climateRank[entry.climateProfile] < climateNeedRank[criteria.climate]) failed.push("CLIMATE");
  }
  if (criteria.budgetMax !== "ANY" && budgetClassRank[entry.budgetClass] > budgetClassRank[criteria.budgetMax]) failed.push("BUDGET");
  if (criteria.tools.length && !entry.tools.every((tool) => toolSatisfied(tool, criteria.tools))) failed.push("TOOLS");
  if (difficultyRank[entry.difficulty] > difficultyRank[criteria.skill]) failed.push("SKILL");
  if (criteria.maxTimeMinutes !== null && entry.buildTimeMinutes[0] > criteria.maxTimeMinutes) failed.push("TIME");
  if (entry.footprint.widthMm > criteria.maxWidthMm || entry.footprint.depthMm > criteria.maxDepthMm) failed.push("SPACE");
  if (exposureMaxLocation[entry.exposure] < locationRank[criteria.location]) failed.push("LOCATION");
  if (!criteria.reuseAllowed && entry.usesReusedMaterial) failed.push("REUSE");
  const emergencyRequested = criteria.season === "EMERGENCY" || criteria.designClasses.includes("EMERGENCY");
  if (entry.emergencyOnly && !emergencyRequested) failed.push("EMERGENCY_SCOPE");
  return failed;
}

const allChecks: MatchCheck[] = ["ANIMAL", "CAPACITY", "SEASON", "STRUCTURE", "DESIGN_CLASS", "HEATING", "CLIMATE", "BUDGET", "TOOLS", "SKILL", "TIME", "SPACE", "LOCATION", "REUSE", "EMERGENCY_SCOPE"];

function compromisesFor(entry: CatalogEntry, criteria: FinderV2Criteria): MatchCompromise[] {
  const result: MatchCompromise[] = [];
  if (entry.emergencyOnly) result.push("EMERGENCY_ONLY");
  if (entry.structureType !== "SLEEPING_SHELTER") result.push("NOT_FOR_SLEEPING");
  if (entry.thermalStatus === "UNAVAILABLE" && entry.structureType === "SLEEPING_SHELTER") result.push("NO_THERMAL_ESTIMATE");
  if (entry.thermalStatus === "INCOMPLETE") result.push("PARTIAL_THERMAL");
  if (entry.designClass === "EMERGENCY" || entry.designClass === "REUSE") result.push("FREQUENT_INSPECTION");
  if (entry.exposure === "COVERED_ONLY") result.push("NEEDS_COVER");
  if (entry.usesReusedMaterial) result.push("REUSE_INSPECTION");
  if (criteria.season === "WINTER" && !entry.climateProfile && entry.structureType === "SLEEPING_SHELTER") result.push("NO_WINTER_RATING");
  result.push("PLANNING_TIME_ESTIMATE");
  return result;
}

/**
 * Lexicographic sort key, lower is better:
 * 1. use-case compatibility (exact season, then generic; emergency-only last unless asked for)
 * 2. capacity waste
 * 3. owned materials NOT used (fewer missing owned materials first)
 * 4. budget class
 * 5. number of required tools
 * 6. minimum build time
 * 7. footprint area (compactness)
 * 8. preference penalties (portable/batch/wind), then slug as a stable tie-breaker in sort()
 */
function sortKey(entry: CatalogEntry, criteria: FinderV2Criteria, ownedUsed: string[]): number[] {
  const exactSeason = criteria.season === "ANY" || entry.seasons.includes(criteria.season) ? 0 : 1;
  const emergencyPenalty = entry.emergencyOnly && criteria.season !== "EMERGENCY" ? 1 : 0;
  const requested = criteria.animal === "dog" ? 1 : Math.max(1, criteria.count);
  const ownedRequired = new Set(entry.requiredMaterials.map((line) => line.materialId).filter(Boolean));
  const ownedRelevant = criteria.ownedMaterials.filter((id) => ownedRequired.has(id)).length;
  const portablePenalty = criteria.portable && !["TOTE_IN_TOTE", "FOAM_CONTAINER", "CRATE", "EMERGENCY_WRAP"].includes(entry.family) ? 1 : 0;
  const batchPenalty = criteria.batch && !entry.coverage.includes("NESTING") ? 1 : 0;
  const windPenalty = criteria.windExposed && !entry.seasons.includes("WIND") ? 1 : 0;
  return [
    emergencyPenalty * 10 + exactSeason,
    entry.capacity.max - requested,
    -Math.min(ownedRelevant, ownedUsed.length),
    budgetClassRank[entry.budgetClass],
    entry.tools.filter((tool) => tool !== "NONE").length,
    entry.buildTimeMinutes[0],
    Math.round((entry.footprint.widthMm * entry.footprint.depthMm) / 1000),
    portablePenalty + batchPenalty + windPenalty
  ];
}

export function compareKeys(a: number[], b: number[]) {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function matchCatalog(entries: CatalogEntry[], criteria: FinderV2Criteria): MatchResult[] {
  return entries
    .filter((entry) => failedChecks(entry, criteria).length === 0)
    .map((entry) => {
      const required = new Set(entry.requiredMaterials.map((line) => line.materialId).filter((id): id is string => Boolean(id)));
      const ownedUsed = criteria.ownedMaterials.filter((id) => required.has(id)).sort();
      return {
        entry,
        passed: allChecks.filter((check) => check !== "EMERGENCY_SCOPE"),
        ownedUsed,
        compromises: compromisesFor(entry, criteria),
        sortKey: sortKey(entry, criteria, ownedUsed)
      };
    })
    .sort((a, b) => compareKeys(a.sortKey, b.sortKey) || a.entry.slug.localeCompare(b.entry.slug));
}

export type Relaxation = {check: MatchCheck; criteria: FinderV2Criteria; matchCount: number};

/**
 * Single-criterion relaxations for an empty result. Animal and dog size are never relaxed.
 */
/** The smallest footprint (by area, then width) that lets at least one model pass once space is unlimited. */
function smallestSufficientSpace(entries: CatalogEntry[], criteria: FinderV2Criteria): Partial<FinderV2Criteria> | null {
  const unlimited = {...criteria, maxWidthMm: Number.MAX_SAFE_INTEGER, maxDepthMm: Number.MAX_SAFE_INTEGER};
  const smallest = matchCatalog(entries, unlimited)
    .map((match) => match.entry.footprint)
    .sort((a, b) => a.widthMm * a.depthMm - b.widthMm * b.depthMm || a.widthMm - b.widthMm)[0];
  if (!smallest) return null;
  return {maxWidthMm: Math.max(criteria.maxWidthMm, smallest.widthMm), maxDepthMm: Math.max(criteria.maxDepthMm, smallest.depthMm)};
}

export function suggestRelaxations(entries: CatalogEntry[], criteria: FinderV2Criteria): Relaxation[] {
  const candidates: Array<[MatchCheck, Partial<FinderV2Criteria>]> = [
    ["CAPACITY", {count: Math.max(...entries.filter((entry) => entry.animal === criteria.animal).map((entry) => entry.capacity.max))}],
    ["SPACE", {maxWidthMm: 2400, maxDepthMm: 1800}],
    ["HEATING", {heating: "any"}],
    ["CLIMATE", {climate: "any"}],
    ["BUDGET", {budgetMax: "ANY"}],
    ["TOOLS", {tools: []}],
    ["SKILL", {skill: "WORKSHOP"}],
    ["TIME", {maxTimeMinutes: null}],
    ["LOCATION", {location: "COVERED"}],
    ["DESIGN_CLASS", {designClasses: []}],
    ["REUSE", {reuseAllowed: true}],
    ["STRUCTURE", {structure: "ANY"}],
    ["SEASON", {season: "ANY"}]
  ];
  const result: Relaxation[] = [];
  for (const [check, basePatch] of candidates) {
    const patch = check === "SPACE" ? smallestSufficientSpace(entries, criteria) ?? basePatch : basePatch;
    const next = {...criteria, ...patch};
    if (JSON.stringify(next) === JSON.stringify(criteria)) continue;
    if (check === "CAPACITY" && criteria.animal === "dog") continue;
    if (check === "CAPACITY" && (patch.count ?? 0) >= criteria.count) continue;
    const matchCount = matchCatalog(entries, next).length;
    if (matchCount > 0) result.push({check, criteria: next, matchCount});
  }
  return result;
}
