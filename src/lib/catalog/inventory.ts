import type {CatalogEntry, RequiredMaterial} from "@/lib/catalog/entries";
import type {BomUnit} from "@/lib/practical/compiler";
import {fitPartsOnOffcuts, type NestablePart, type StockPiece} from "@/lib/nesting";
import type {Tool} from "@/lib/catalog/taxonomy-core";

/**
 * "Moja radionica" (My workshop): what the user already owns. Stored locally in the browser first.
 * Quantities are in the material's inventory unit. Offcuts are optional rectangular pieces of a
 * sheet material, checked with the deterministic offcut fitter.
 */
export type InventoryItem = {
  materialId: string;
  quantity: number;
  unit: BomUnit;
  offcuts: Array<{widthMm: number; heightMm: number}>;
};

export type Workshop = {
  version: 1;
  items: InventoryItem[];
  tools: Tool[];
};

export const emptyWorkshop: Workshop = {version: 1, items: [], tools: []};
export const workshopStorageKey = "sapice:workshop:v1";

export function parseWorkshop(raw: unknown): Workshop {
  if (!raw || typeof raw !== "object") return emptyWorkshop;
  const value = raw as Partial<Workshop>;
  if (value.version !== 1 || !Array.isArray(value.items) || !Array.isArray(value.tools)) return emptyWorkshop;
  return {
    version: 1,
    items: value.items
      .filter((item): item is InventoryItem => Boolean(item) && typeof item.materialId === "string" && typeof item.quantity === "number" && item.quantity >= 0)
      .map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unit: item.unit,
        offcuts: Array.isArray(item.offcuts)
          ? item.offcuts.filter((cut) => cut && cut.widthMm > 0 && cut.heightMm > 0).map((cut) => ({widthMm: cut.widthMm, heightMm: cut.heightMm}))
          : []
      })),
    tools: value.tools.filter((tool): tool is Tool => typeof tool === "string")
  };
}

export type InventoryLineStatus = "OWNED" | "PARTIAL" | "BUY" | "OFFCUTS_FIT" | "OFFCUTS_SHORT" | "CHECK_MANUALLY" | "NOT_IN_LIBRARY";

export type InventoryLine = {
  required: RequiredMaterial;
  ownedQuantity: number;
  toBuy: number | null;
  status: InventoryLineStatus;
};

export type InventoryReport = {
  lines: InventoryLine[];
  missingTools: Tool[];
  ownedLineCount: number;
  buyLineCount: number;
  /** Everything needed is owned (excluding lines outside the library). */
  fullyOwned: boolean;
};

const roundQty = (value: number) => Math.round(value * 100) / 100;

function toolOwned(tool: Tool, owned: Tool[]) {
  return tool === "NONE" || owned.includes("WORKSHOP") || owned.includes(tool) || (tool === "SCREWDRIVER" && owned.includes("DRILL"));
}

/**
 * Compares a model's required materials with the workshop. Parts for offcut checks are passed
 * separately because only the server-compiled cut list knows their exact sizes.
 */
export function inventoryReport(
  entry: CatalogEntry,
  workshop: Workshop,
  partsByMaterial: Record<string, NestablePart[]> = {}
): InventoryReport {
  const lines: InventoryLine[] = entry.requiredMaterials.map((required) => {
    if (!required.materialId) return {required, ownedQuantity: 0, toBuy: null, status: "NOT_IN_LIBRARY"};
    const owned = workshop.items.find((item) => item.materialId === required.materialId);
    if (!owned) return {required, ownedQuantity: 0, toBuy: required.quantity, status: "BUY"};
    if (owned.unit !== required.unit) {
      if (required.unit === "SHEET" && owned.offcuts.length && partsByMaterial[required.materialId]?.length) {
        const fit = fitPartsOnOffcuts(
          partsByMaterial[required.materialId],
          owned.offcuts.map((cut, index): StockPiece => ({id: `o${index + 1}`, ...cut}))
        );
        return {required, ownedQuantity: 0, toBuy: fit.allPlaced ? 0 : null, status: fit.allPlaced ? "OFFCUTS_FIT" : "OFFCUTS_SHORT"};
      }
      return {required, ownedQuantity: owned.quantity, toBuy: null, status: "CHECK_MANUALLY"};
    }
    if (required.unit === "SHEET" && owned.quantity < required.quantity && owned.offcuts.length && partsByMaterial[required.materialId]?.length) {
      const fit = fitPartsOnOffcuts(
        partsByMaterial[required.materialId],
        owned.offcuts.map((cut, index): StockPiece => ({id: `o${index + 1}`, ...cut}))
      );
      if (fit.allPlaced) return {required, ownedQuantity: owned.quantity, toBuy: 0, status: "OFFCUTS_FIT"};
    }
    const toBuy = roundQty(Math.max(0, required.quantity - owned.quantity));
    return {required, ownedQuantity: owned.quantity, toBuy, status: toBuy === 0 ? "OWNED" : "PARTIAL"};
  });
  const missingTools = entry.tools.filter((tool) => !toolOwned(tool, workshop.tools));
  const relevant = lines.filter((line) => line.status !== "NOT_IN_LIBRARY");
  return {
    lines,
    missingTools,
    ownedLineCount: relevant.filter((line) => line.status === "OWNED" || line.status === "OFFCUTS_FIT").length,
    buyLineCount: relevant.filter((line) => line.status === "BUY" || line.status === "PARTIAL" || line.status === "OFFCUTS_SHORT").length,
    fullyOwned: relevant.length > 0 && relevant.every((line) => line.status === "OWNED" || line.status === "OFFCUTS_FIT")
  };
}

export function ownedMaterialIds(workshop: Workshop) {
  return workshop.items.filter((item) => item.quantity > 0 || item.offcuts.length > 0).map((item) => item.materialId);
}
