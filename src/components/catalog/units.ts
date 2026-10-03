import type {AppLocale} from "@/i18n/routing";
import type {BomUnit} from "@/lib/practical/compiler";

const labels: Record<BomUnit, {sr: string; en: string}> = {
  SHEET: {sr: "ploča", en: "sheets"},
  PIECE: {sr: "kom.", en: "pcs"},
  LINEAR_M: {sr: "m", en: "m"},
  AREA_M2: {sr: "m²", en: "m²"},
  BALE: {sr: "bala", en: "bale"},
  PACK: {sr: "pak.", en: "pack"}
};

export function unitLabel(unit: BomUnit, locale: AppLocale) {
  return labels[unit][locale];
}

const categoryLabels: Record<string, {sr: string; en: string}> = {
  SHEET_WOOD: {sr: "Drvene ploče", en: "Wood sheets"},
  SOLID_WOOD: {sr: "Masivno drvo", en: "Solid timber"},
  REUSED_WOOD: {sr: "Iskorišćeno drvo", en: "Reused timber"},
  RIGID_FOAM: {sr: "Tvrda izolacija", en: "Rigid foam"},
  FIBROUS_INSULATION: {sr: "Vlaknasta izolacija", en: "Fibrous insulation"},
  NATURAL_BOARD: {sr: "Prirodne ploče", en: "Natural boards"},
  CONTAINER: {sr: "Kutije i posude", en: "Containers"},
  PAPER: {sr: "Karton", en: "Cardboard"},
  BEDDING_FILL: {sr: "Posteljina", en: "Bedding"},
  FLOOR_SURFACE: {sr: "Podne obloge", en: "Floor surfaces"},
  ROOF_COVERING: {sr: "Krovni pokrivači", en: "Roof coverings"},
  MEMBRANE: {sr: "Folije i membrane", en: "Films and membranes"},
  MASONRY: {sr: "Cigle i blokovi", en: "Bricks and blocks"},
  CONSUMABLE: {sr: "Potrošni materijal", en: "Consumables"},
  HARDWARE: {sr: "Okov", en: "Hardware"},
  SALVAGE: {sr: "Ostaci sa gradnje", en: "Construction salvage"}
};

export function materialCategoryLabel(category: string, locale: AppLocale) {
  return categoryLabels[category]?.[locale] ?? category;
}
