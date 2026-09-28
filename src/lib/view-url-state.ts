import type {FinderCriteria} from "@/lib/finder";

export type FinderUrlState = FinderCriteria;

export type CatalogUrlState = {
  animal: "all" | "cat" | "dog";
  heating: "all" | "heated" | "passive";
  query: string;
  compareSlugs: string[];
};

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export const defaultFinderUrlState: FinderUrlState = {
  animal: "cat",
  count: 2,
  dogSize: "medium",
  heating: "any",
  climate: "cold",
  maxWidthMm: 1400,
  maxDepthMm: 1400
};

export const defaultCatalogUrlState: CatalogUrlState = {
  animal: "all",
  heating: "all",
  query: "",
  compareSlugs: []
};

const finderKeys = ["animal", "count", "dogSize", "heating", "climate", "width", "depth"] as const;
const catalogKeys = ["animal", "heating", "q", "compare"] as const;

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
  const animal = params.get("animal");
  const dogSize = params.get("dogSize");
  const heating = params.get("heating");
  const climate = params.get("climate");

  return {
    animal: animal === "dog" ? "dog" : animal === "cat" ? "cat" : defaultFinderUrlState.animal,
    count: parseCount(params.get("count"), defaultFinderUrlState.count),
    dogSize: dogSize === "small" || dogSize === "large" || dogSize === "medium"
      ? dogSize
      : defaultFinderUrlState.dogSize,
    heating: heating === "passive" || heating === "heated" || heating === "any"
      ? heating
      : defaultFinderUrlState.heating,
    climate: climate === "moderate" || climate === "severe" || climate === "cold"
      ? climate
      : defaultFinderUrlState.climate,
    maxWidthMm: clampRange(
      parseNumber(params.get("width"), defaultFinderUrlState.maxWidthMm),
      600,
      2400,
      50,
      defaultFinderUrlState.maxWidthMm
    ),
    maxDepthMm: clampRange(
      parseNumber(params.get("depth"), defaultFinderUrlState.maxDepthMm),
      500,
      1800,
      50,
      defaultFinderUrlState.maxDepthMm
    )
  };
}

export function serializeFinderUrlState(existing: URLSearchParams, state: FinderUrlState) {
  const params = new URLSearchParams(existing);
  finderKeys.forEach((key) => params.delete(key));

  if (state.animal !== defaultFinderUrlState.animal) params.set("animal", state.animal);
  if (state.count !== defaultFinderUrlState.count) params.set("count", String(state.count));
  if (state.dogSize !== defaultFinderUrlState.dogSize) params.set("dogSize", state.dogSize);
  if (state.heating !== defaultFinderUrlState.heating) params.set("heating", state.heating);
  if (state.climate !== defaultFinderUrlState.climate) params.set("climate", state.climate);
  if (state.maxWidthMm !== defaultFinderUrlState.maxWidthMm) params.set("width", String(state.maxWidthMm));
  if (state.maxDepthMm !== defaultFinderUrlState.maxDepthMm) params.set("depth", String(state.maxDepthMm));

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
    compareSlugs
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
