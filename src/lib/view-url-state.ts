import {budgetClassValues, designClasses, difficultyValues, toolValues, type DesignClass, type Season} from "@/lib/catalog/taxonomy-core";
import {defaultFinderV2Criteria, type FinderSeason, type FinderV2Criteria} from "@/lib/catalog/matcher";

export type FinderUrlState = FinderV2Criteria;

export type CatalogUrlState = {
  animal: "all" | "cat" | "dog";
  heating: "all" | "heated" | "passive";
  query: string;
  compareSlugs: string[];
  designClasses: DesignClass[];
  season: Season | "all";
};

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export const defaultFinderUrlState: FinderUrlState = defaultFinderV2Criteria;
const finderSeasons: FinderSeason[] = ["WINTER", "RAIN", "WIND", "SUMMER", "ALL_SEASON", "EMERGENCY", "ANY"];

export const defaultCatalogUrlState: CatalogUrlState = {
  animal: "all",
  heating: "all",
  query: "",
  compareSlugs: [],
  designClasses: [],
  season: "all"
};

const finderKeys = ["animal", "count", "dogSize", "heating", "climate", "width", "depth", "season", "structure", "class", "budget", "tools", "skill", "time", "location", "wind", "reuse", "have", "portable", "batch"] as const;
const catalogKeys = ["animal", "heating", "q", "compare", "class", "season"] as const;
const catalogSeasons: Season[] = ["WINTER", "RAIN", "WIND", "SUMMER", "ALL_SEASON", "EMERGENCY"];

function parseNumber(value: string | null, fallback: number) {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCount(value: string | null, fallback: number) {
  const parsed = parseNumber(value, fallback);
  return parsed < 1 ? fallback : clampInteger(parsed, 1, 12);
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampRange(value: number, min: number, max: number, step: number, fallback: number) {
  if (value < min) return fallback;
  const clamped = Math.min(max, Math.max(min, value));
  return min + Math.round((clamped - min) / step) * step;
}

export function parseFinderUrlState(params: URLSearchParams): FinderUrlState {
  const d = defaultFinderUrlState;
  const animal = params.get("animal");
  const dogSize = params.get("dogSize");
  const heating = params.get("heating");
  const climate = params.get("climate");
  const season = params.get("season");
  const structure = params.get("structure");
  const budget = params.get("budget");
  const skill = params.get("skill");
  const location = params.get("location");
  const time = params.get("time");
  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);

  return {
    animal: animal === "dog" ? "dog" : animal === "cat" ? "cat" : d.animal,
    count: parseCount(params.get("count"), d.count),
    dogSize: dogSize === "small" || dogSize === "large" || dogSize === "medium" ? dogSize : d.dogSize,
    heating: heating === "passive" || heating === "heated" || heating === "any" ? heating : d.heating,
    climate: climate === "moderate" || climate === "severe" || climate === "cold" || climate === "any" ? climate : d.climate,
    maxWidthMm: clampRange(parseNumber(params.get("width"), d.maxWidthMm), 600, 2400, 50, d.maxWidthMm),
    maxDepthMm: clampRange(parseNumber(params.get("depth"), d.maxDepthMm), 500, 1800, 50, d.maxDepthMm),
    season: finderSeasons.find((value) => value === season) ?? d.season,
    structure: structure === "ANY" ? "ANY" : d.structure,
    designClasses: designClasses.filter((value) => list("class").includes(value)),
    budgetMax: budgetClassValues.find((value) => value === budget) ?? d.budgetMax,
    tools: toolValues.filter((value) => value !== "NONE" && list("tools").includes(value)),
    skill: difficultyValues.find((value) => value === skill) ?? d.skill,
    maxTimeMinutes: time && /^\d+$/.test(time) ? Math.min(10080, Math.max(15, Number(time))) : d.maxTimeMinutes,
    location: location === "COVERED" || location === "SHELTERED" || location === "EXPOSED" ? location : d.location,
    windExposed: params.get("wind") === "1",
    reuseAllowed: params.get("reuse") !== "0",
    ownedMaterials: list("have").filter((value) => /^[a-z0-9-]{2,40}$/.test(value)).slice(0, 40),
    portable: params.get("portable") === "1",
    batch: params.get("batch") === "1"
  };
}

export function serializeFinderUrlState(existing: URLSearchParams, state: FinderUrlState) {
  const d = defaultFinderUrlState;
  const params = new URLSearchParams(existing);
  finderKeys.forEach((key) => params.delete(key));

  if (state.animal !== d.animal) params.set("animal", state.animal);
  if (state.count !== d.count) params.set("count", String(state.count));
  if (state.dogSize !== d.dogSize) params.set("dogSize", state.dogSize);
  if (state.heating !== d.heating) params.set("heating", state.heating);
  if (state.climate !== d.climate) params.set("climate", state.climate);
  if (state.maxWidthMm !== d.maxWidthMm) params.set("width", String(state.maxWidthMm));
  if (state.maxDepthMm !== d.maxDepthMm) params.set("depth", String(state.maxDepthMm));
  if (state.season !== d.season) params.set("season", state.season);
  if (state.structure !== d.structure) params.set("structure", state.structure);
  if (state.designClasses.length) params.set("class", designClasses.filter((value) => state.designClasses.includes(value)).join(","));
  if (state.budgetMax !== d.budgetMax) params.set("budget", state.budgetMax);
  if (state.tools.length) params.set("tools", toolValues.filter((value) => state.tools.includes(value)).join(","));
  if (state.skill !== d.skill) params.set("skill", state.skill);
  if (state.maxTimeMinutes !== null) params.set("time", String(state.maxTimeMinutes));
  if (state.location !== d.location) params.set("location", state.location);
  if (state.windExposed) params.set("wind", "1");
  if (!state.reuseAllowed) params.set("reuse", "0");
  if (state.ownedMaterials.length) params.set("have", [...state.ownedMaterials].sort().join(","));
  if (state.portable) params.set("portable", "1");
  if (state.batch) params.set("batch", "1");

  return params;
}

function validUniqueSlugs(slugs: string[], validSlugs: readonly string[]) {
  const allowed = new Set(validSlugs);
  return [...new Set(slugs.filter((slug) => allowed.has(slug)))].slice(-3);
}

export function parseCatalogUrlState(params: URLSearchParams, validSlugs: readonly string[]): CatalogUrlState {
  const animal = params.get("animal");
  const heating = params.get("heating");
  const query = (params.get("q") ?? "").trim().slice(0, 100);
  const compareSlugs = validUniqueSlugs((params.get("compare") ?? "").split(","), validSlugs);

  return {
    animal: animal === "cat" || animal === "dog" ? animal : defaultCatalogUrlState.animal,
    heating: heating === "heated" || heating === "passive" ? heating : defaultCatalogUrlState.heating,
    query,
    compareSlugs,
    designClasses: designClasses.filter((value) => (params.get("class") ?? "").split(",").includes(value)),
    season: catalogSeasons.find((value) => value === params.get("season")) ?? "all"
  };
}

export function serializeCatalogUrlState(
  existing: URLSearchParams,
  state: CatalogUrlState,
  validSlugs: readonly string[]
) {
  const params = new URLSearchParams(existing);
  catalogKeys.forEach((key) => params.delete(key));

  if (state.animal !== defaultCatalogUrlState.animal) params.set("animal", state.animal);
  if (state.heating !== defaultCatalogUrlState.heating) params.set("heating", state.heating);
  const query = state.query.trim().slice(0, 100);
  if (query) params.set("q", query);
  const compareSlugs = validUniqueSlugs(state.compareSlugs, validSlugs);
  if (compareSlugs.length) params.set("compare", compareSlugs.join(","));
  const classes = designClasses.filter((value) => state.designClasses.includes(value));
  if (classes.length) params.set("class", classes.join(","));
  if (state.season !== "all") params.set("season", state.season);

  return params;
}

export function searchParamsRecordToURLSearchParams(record: SearchParamsRecord) {
  const params = new URLSearchParams();
  Object.entries(record).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  return params;
}

export function replaceBrowserSearchParams(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
}
