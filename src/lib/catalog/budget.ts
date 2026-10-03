import type {CatalogEntry} from "@/lib/catalog/entries";
import type {Workshop} from "@/lib/catalog/inventory";

/**
 * Budget estimates are computed only from prices the user enters. Šapice never ships "current"
 * market prices. A missing price makes the estimate incomplete instead of being guessed.
 */
export type PriceProfile = {
  version: 1;
  currency: "RSD" | "EUR" | "USD" | "GBP";
  /** Price per inventory unit of a library material. */
  prices: Record<string, number>;
};

export const emptyPriceProfile: PriceProfile = {version: 1, currency: "RSD", prices: {}};
export const priceProfileStorageKey = "sapice:prices:v1";

export function parsePriceProfile(raw: unknown): PriceProfile {
  if (!raw || typeof raw !== "object") return emptyPriceProfile;
  const value = raw as Partial<PriceProfile>;
  if (value.version !== 1 || typeof value.prices !== "object" || !value.prices) return emptyPriceProfile;
  const currency = value.currency === "EUR" || value.currency === "USD" || value.currency === "GBP" ? value.currency : "RSD";
  const prices: Record<string, number> = {};
  for (const [id, price] of Object.entries(value.prices)) {
    if (typeof price === "number" && Number.isFinite(price) && price >= 0) prices[id] = price;
  }
  return {version: 1, currency, prices};
}

export type BudgetLine = {
  materialId: string | null;
  labelSr: string;
  labelEn: string;
  required: number;
  owned: number;
  toBuy: number;
  unitPrice: number | null;
  purchaseCost: number | null;
  /** Market value of owned material, shown separately and never added to the purchase cost. */
  ownedValueIgnored: number | null;
};

export type BudgetEstimate = {
  lines: BudgetLine[];
  requiredPurchaseCost: number;
  ownedValueIgnored: number;
  missingPriceCount: number;
  complete: boolean;
  costPerShelter: number | null;
  costPerAnimal: number | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function budgetEstimate(entry: CatalogEntry, profile: PriceProfile, workshop: Workshop, units = 1): BudgetEstimate {
  const lines: BudgetLine[] = entry.requiredMaterials.map((material) => {
    const required = round2(material.quantity * units);
    const ownedItem = material.materialId ? workshop.items.find((item) => item.materialId === material.materialId && item.unit === material.unit) : undefined;
    const owned = Math.min(required, ownedItem?.quantity ?? 0);
    const toBuy = round2(Math.max(0, required - owned));
    const unitPrice = material.materialId && material.materialId in profile.prices ? profile.prices[material.materialId] : null;
    return {
      materialId: material.materialId,
      labelSr: material.labelSr,
      labelEn: material.labelEn,
      required,
      owned,
      toBuy,
      unitPrice,
      purchaseCost: toBuy === 0 ? 0 : unitPrice === null ? null : round2(toBuy * unitPrice),
      ownedValueIgnored: unitPrice === null ? null : round2(owned * unitPrice)
    };
  });
  const missingPriceCount = lines.filter((line) => line.purchaseCost === null).length;
  const requiredPurchaseCost = round2(lines.reduce((sum, line) => sum + (line.purchaseCost ?? 0), 0));
  const complete = missingPriceCount === 0;
  return {
    lines,
    requiredPurchaseCost,
    ownedValueIgnored: round2(lines.reduce((sum, line) => sum + (line.ownedValueIgnored ?? 0), 0)),
    missingPriceCount,
    complete,
    costPerShelter: complete ? round2(requiredPurchaseCost / units) : null,
    costPerAnimal: complete ? round2(requiredPurchaseCost / (units * Math.max(1, entry.capacity.recommended))) : null
  };
}

export type BudgetFit = "WITHIN" | "OVER" | "UNKNOWN";

export function budgetFit(estimate: BudgetEstimate, amount: number): BudgetFit {
  if (estimate.requiredPurchaseCost > amount) return "OVER";
  if (!estimate.complete) return "UNKNOWN";
  return "WITHIN";
}
