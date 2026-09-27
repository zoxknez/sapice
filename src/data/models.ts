import {shelterModelSchema, type ShelterModel} from "@/lib/domain";
import {assertShelterModelValid} from "@/lib/validation";

const catSources = [
  "aspcapro-community-cat-winter",
  "aspca-cold-weather",
  "iso-6946-2017",
  "iso-13789-2017"
];

const dogSources = [
  "humane-world-pets-cold",
  "aspca-cold-weather",
  "iso-6946-2017",
  "iso-13789-2017"
];

const models: ShelterModel[] = [
  {
    id: "cat-solo-winter-01",
    slug: "nordic-solo-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: catSources,
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 1, max: 2},
    dimensions: {widthMm: 620, depthMm: 520, frontHeightMm: 500, rearHeightMm: 450, groundClearanceMm: 120},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 150, entranceHeightMm: 170, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Nordic Solo Winter", description: "Kompaktno izolovano zimsko sklonište za jednu odraslu mačku, uz rezervni kapacitet za dve mačke koje ga dobrovoljno dele."},
      en: {name: "Nordic Solo Winter", description: "Compact insulated winter shelter for one adult cat, with reserve capacity for two cats that voluntarily share it."}
    }
  },
  {
    id: "cat-duo-winter-01",
    slug: "nordic-duo-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: catSources,
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 2, max: 2},
    dimensions: {widthMm: 760, depthMm: 560, frontHeightMm: 520, rearHeightMm: 465, groundClearanceMm: 120},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 150, entranceHeightMm: 175, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Nordic Duo Winter", description: "Jednokomorna zimska kućica za dve odrasle mačke sa ograničenim unutrašnjim volumenom i podignutom bazom."},
      en: {name: "Nordic Duo Winter", description: "Single-chamber winter shelter for two adult cats with restrained interior volume and an elevated base."}
    }
  },
  {
    id: "cat-quad-winter-01",
    slug: "nordic-quad-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: catSources,
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 4, max: 4},
    dimensions: {widthMm: 1200, depthMm: 700, frontHeightMm: 650, rearHeightMm: 590, groundClearanceMm: 140},
    layout: {chambers: 2, entrances: 2, entranceWidthMm: 150, entranceHeightMm: 180, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Nordic Quad Winter", description: "Dvokomorna kućica za četiri odrasle mačke, sa po jednom komorom za par mačaka i dva nezavisna ulaza."},
      en: {name: "Nordic Quad Winter", description: "Two-chamber shelter for four adult cats, with one chamber per pair and two independent entrances."}
    }
  },
  {
    id: "cat-quad-heated-01",
    slug: "nordic-quad-heated",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: [...catSources, "iec-60335-2-71-2018"],
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 4, max: 4},
    dimensions: {widthMm: 1200, depthMm: 700, frontHeightMm: 650, rearHeightMm: 590, groundClearanceMm: 140},
    layout: {chambers: 2, entrances: 2, entranceWidthMm: 150, entranceHeightMm: 180, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: true,
    climateProfile: "WINTER_SEVERE",
    referenceOutsideC: -15,
    translations: {
      sr: {name: "Nordic Quad Heated", description: "Grejana varijanta dvokomornog modela sa prostorom za kompatibilan namenski grejni proizvod i negrejanom zonom za izbor životinje."},
      en: {name: "Nordic Quad Heated", description: "Heated two-chamber variant with space for a compatible purpose-built heating product and an unheated choice zone."}
    }
  },
  {
    id: "cat-six-winter-01",
    slug: "alpine-colony-six",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: catSources,
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 6, max: 6},
    dimensions: {widthMm: 1620, depthMm: 760, frontHeightMm: 700, rearHeightMm: 625, groundClearanceMm: 150},
    layout: {chambers: 3, entrances: 3, entranceWidthMm: 150, entranceHeightMm: 180, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Alpine Colony Six", description: "Trokamorno sklonište za do šest community mačaka. Više komora smanjuje zavisnost cele grupe od jednog ulaza."},
      en: {name: "Alpine Colony Six", description: "Three-chamber shelter for up to six community cats. Multiple chambers reduce the whole group's dependence on one entrance."}
    }
  },
  {
    id: "dog-small-winter-01",
    slug: "alpine-small-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: dogSources,
    animal: "dog",
    animalSizeClass: "small",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 760, depthMm: 900, frontHeightMm: 800, rearHeightMm: 720, groundClearanceMm: 130},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 280, entranceHeightMm: 430, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Alpine Small Winter", description: "Izolovana pomoćna zimska kućica za jednog manjeg psa, sa suvim podignutim podom i zaštitom od promaje."},
      en: {name: "Alpine Small Winter", description: "Insulated auxiliary winter house for one small dog with a dry raised floor and draft protection."}
    }
  },
  {
    id: "dog-medium-winter-01",
    slug: "alpine-medium-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: dogSources,
    animal: "dog",
    animalSizeClass: "medium",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 930, depthMm: 1120, frontHeightMm: 980, rearHeightMm: 880, groundClearanceMm: 140},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 360, entranceHeightMm: 560, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Alpine Medium Winter", description: "Izolovana pomoćna zimska kućica za jednog srednjeg psa, sa podignutim podom i jednovodnim krovom."},
      en: {name: "Alpine Medium Winter", description: "Insulated auxiliary winter house for one medium dog, with an elevated floor and mono-pitch roof."}
    }
  },
  {
    id: "dog-large-winter-01",
    slug: "alpine-large-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: dogSources,
    animal: "dog",
    animalSizeClass: "large",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 1150, depthMm: 1350, frontHeightMm: 1150, rearHeightMm: 1010, groundClearanceMm: 160},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 460, entranceHeightMm: 700, thresholdHeightMm: 120, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-60", floorAssemblyId: "floor-xps-60", roofAssemblyId: "roof-xps-60"},
    roof: {sideOverhangMm: 30, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Alpine Large Winter", description: "Prostranija, ali i dalje termički kontrolisana pomoćna kućica za velikog psa."},
      en: {name: "Alpine Large Winter", description: "A larger yet thermally restrained auxiliary shelter for one large dog."}
    }
  },
  {
    id: "dog-large-heated-01",
    slug: "alpine-large-heated",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: [...dogSources, "iec-60335-2-71-2018"],
    animal: "dog",
    animalSizeClass: "large",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 1150, depthMm: 1350, frontHeightMm: 1150, rearHeightMm: 1010, groundClearanceMm: 160},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 460, entranceHeightMm: 700, thresholdHeightMm: 120, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-60", floorAssemblyId: "floor-xps-60", roofAssemblyId: "roof-xps-60"},
    roof: {sideOverhangMm: 30, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: true,
    climateProfile: "WINTER_SEVERE",
    referenceOutsideC: -15,
    translations: {
      sr: {name: "Alpine Large Heated", description: "Velika izolovana pomoćna kućica sa predviđenom zonom za kompatibilan namenski grejni proizvod i odvojenom negrejanom površinom."},
      en: {name: "Alpine Large Heated", description: "Large insulated auxiliary shelter with a designated area for a compatible purpose-built heating product and a separate unheated surface."}
    }
  },
  {
    id: "rescue-cat-eight-01",
    slug: "rescue-modular-eight",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    sourceIds: catSources,
    animal: "cat",
    animalSizeClass: "standard",
    intendedUse: "RESCUE",
    capacity: {recommended: 8, max: 8},
    dimensions: {widthMm: 2100, depthMm: 820, frontHeightMm: 760, rearHeightMm: 670, groundClearanceMm: 160},
    layout: {chambers: 4, entrances: 4, entranceWidthMm: 150, entranceHeightMm: 180, thresholdHeightMm: 110, dividerThicknessMm: 12},
    construction: {wallAssemblyId: "wall-xps-50", floorAssemblyId: "floor-xps-50", roofAssemblyId: "roof-xps-50"},
    roof: {sideOverhangMm: 70, frontOverhangMm: 90, rearOverhangMm: 90},
    maintenance: {roofAccess: "HINGED", hingeEdge: "REAR"},
    ventilation: {strategy: "HIGH_REAR_PROVISION", status: "PROVISIONAL", zonesPerChamber: 1},
    heated: false,
    climateProfile: "WINTER_COLD",
    referenceOutsideC: -10,
    translations: {
      sr: {name: "Rescue Modular Eight", description: "Četvorokomorni referentni model za rescue/community upotrebu, projektovan kao ponovljiv modularni segment."},
      en: {name: "Rescue Modular Eight", description: "Four-chamber reference model for rescue/community use, designed as a repeatable modular segment."}
    }
  }
];

export const shelterModels = models.map((model) => {
  const parsed = shelterModelSchema.parse(model);
  assertShelterModelValid(parsed);
  return parsed;
});

export function getShelterModel(slug: string) {
  return shelterModels.find((model) => model.slug === slug);
}
