import {shelterModels} from "@/data/models";
import {practicalModels} from "@/data/practical-models";
import {materialLibrary} from "@/data/material-library";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {catalogEntries} from "@/lib/catalog/entries";
import {compilePracticalModel} from "@/lib/practical/compiler";
import type {NestablePart} from "@/lib/nesting";
import type {EngineeredThumbnailData} from "@/components/catalog/catalog-card";

/** Server-side data bundle shared by catalog-driven tool pages. */
export function engineeredThumbnails(): Record<string, EngineeredThumbnailData> {
  const summaries = modelComparisonSummaryMap(shelterModels);
  return Object.fromEntries(shelterModels.map((model) => [model.slug, {model, summary: summaries[model.id]}]));
}

/** Sheet-material cut parts per practical model, used for offcut fitting and batch nesting. */
export function sheetPartsBySlug(): Record<string, Record<string, NestablePart[]>> {
  const result: Record<string, Record<string, NestablePart[]>> = {};
  for (const model of practicalModels) {
    const compiled = compilePracticalModel(model);
    const byMaterial: Record<string, NestablePart[]> = {};
    for (const part of compiled.cutParts) {
      if (materialLibrary[part.materialId]?.inventoryUnit !== "SHEET") continue;
      (byMaterial[part.materialId] ??= []).push({
        id: part.id,
        quantity: part.quantity,
        widthMm: part.widthMm,
        heightMm: part.heightMm,
        shape: part.shape,
        trapezoidRearHeightMm: part.trapezoidRearHeightMm
      });
    }
    if (Object.keys(byMaterial).length) result[model.slug] = byMaterial;
  }
  return result;
}

/** Localized names of the sheet parts, keyed by model slug and part id, for human-readable cutting schedules. */
export function sheetPartNamesBySlug(): Record<string, Record<string, {sr: string; en: string}>> {
  const result: Record<string, Record<string, {sr: string; en: string}>> = {};
  for (const model of practicalModels) {
    for (const part of compilePracticalModel(model).cutParts) {
      if (materialLibrary[part.materialId]?.inventoryUnit !== "SHEET") continue;
      (result[model.slug] ??= {})[part.id] = {sr: part.nameSr, en: part.nameEn};
    }
  }
  return result;
}

export {catalogEntries};

/** Compact list of library materials for pickers (id, names, unit, category). */
export function materialOptions() {
  return Object.values(materialLibrary).map((material) => ({
    id: material.id,
    nameSr: material.nameSr,
    nameEn: material.nameEn,
    unit: material.inventoryUnit,
    category: material.category,
    stock: material.planningStock ? {widthMm: material.planningStock.widthMm, heightMm: material.planningStock.heightMm} : null,
    reuseInspection: material.reuseInspectionRequired
  }));
}

export type MaterialOption = ReturnType<typeof materialOptions>[number];
