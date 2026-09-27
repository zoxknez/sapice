import {shelterModelSchema, type ShelterModel} from "@/lib/domain";

const models: ShelterModel[] = [
  {
    id: "cat-solo-winter-01",
    slug: "nordic-solo-winter",
    version: "1.0.0",
    validationState: "GEOMETRY_VALIDATED",
    animal: "cat",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 1, max: 2},
    dimensions: {widthMm: 620, depthMm: 520, frontHeightMm: 500, rearHeightMm: 450, groundClearanceMm: 120},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 150, entranceHeightMm: 170},
    construction: {wallInsulationMm: 50, floorInsulationMm: 50, roofInsulationMm: 50, wallThicknessMm: 71},
    heated: false,
    climateProfile: "WINTER_COLD",
    designOutsideC: -10,
    translations: {
      sr: {name: "Nordic Solo Winter", description: "Kompaktno izolovano zimsko sklonište za jednu odraslu mačku, uz rezervni kapacitet za dve zbijene mačke."},
      en: {name: "Nordic Solo Winter", description: "Compact insulated winter shelter for one adult cat, with reserve capacity for two cats resting closely together."}
    }
  },
  {
    id: "cat-duo-winter-01",
    slug: "nordic-duo-winter",
    version: "1.0.0",
    validationState: "GEOMETRY_VALIDATED",
    animal: "cat",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 2, max: 2},
    dimensions: {widthMm: 760, depthMm: 560, frontHeightMm: 520, rearHeightMm: 465, groundClearanceMm: 120},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 155, entranceHeightMm: 175},
    construction: {wallInsulationMm: 50, floorInsulationMm: 50, roofInsulationMm: 50, wallThicknessMm: 71},
    heated: false,
    climateProfile: "WINTER_COLD",
    designOutsideC: -10,
    translations: {
      sr: {name: "Nordic Duo Winter", description: "Jednokomorna zimska kućica za dve odrasle mačke sa malim unutrašnjim volumenom i zaštićenim ulazom."},
      en: {name: "Nordic Duo Winter", description: "Single-chamber winter shelter for two adult cats with restrained interior volume and a protected entrance."}
    }
  },
  {
    id: "cat-quad-winter-01",
    slug: "nordic-quad-winter",
    version: "1.0.0",
    validationState: "GEOMETRY_VALIDATED",
    animal: "cat",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 4, max: 4},
    dimensions: {widthMm: 1200, depthMm: 700, frontHeightMm: 650, rearHeightMm: 590, groundClearanceMm: 140},
    layout: {chambers: 2, entrances: 2, entranceWidthMm: 155, entranceHeightMm: 180},
    construction: {wallInsulationMm: 50, floorInsulationMm: 50, roofInsulationMm: 50, wallThicknessMm: 71},
    heated: false,
    climateProfile: "WINTER_COLD",
    designOutsideC: -10,
    translations: {
      sr: {name: "Nordic Quad Winter", description: "Dvokomorna kućica za četiri odrasle mačke, sa po jednom zaštićenom zonom za dve mačke."},
      en: {name: "Nordic Quad Winter", description: "Two-chamber shelter for four adult cats, with one protected resting zone for each pair."}
    }
  },
  {
    id: "cat-quad-heated-01",
    slug: "nordic-quad-heated",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    animal: "cat",
    intendedUse: "COMMUNITY_CAT_SHELTER",
    capacity: {recommended: 4, max: 4},
    dimensions: {widthMm: 1200, depthMm: 700, frontHeightMm: 650, rearHeightMm: 590, groundClearanceMm: 140},
    layout: {chambers: 2, entrances: 2, entranceWidthMm: 155, entranceHeightMm: 180},
    construction: {wallInsulationMm: 50, floorInsulationMm: 50, roofInsulationMm: 50, wallThicknessMm: 71},
    heated: true,
    climateProfile: "WINTER_SEVERE",
    designOutsideC: -15,
    translations: {
      sr: {name: "Nordic Quad Heated", description: "Grejana varijanta dvokomornog modela. Predviđa samo kompatibilan, namenski pet heating proizvod prema uputstvu proizvođača."},
      en: {name: "Nordic Quad Heated", description: "Heated variant of the two-chamber model. It accepts only a compatible purpose-built pet heating product installed to manufacturer instructions."}
    }
  },
  {
    id: "dog-medium-winter-01",
    slug: "alpine-medium-winter",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    animal: "dog",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 930, depthMm: 1120, frontHeightMm: 980, rearHeightMm: 880, groundClearanceMm: 140},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 360, entranceHeightMm: 560},
    construction: {wallInsulationMm: 50, floorInsulationMm: 50, roofInsulationMm: 50, wallThicknessMm: 71},
    heated: false,
    climateProfile: "WINTER_COLD",
    designOutsideC: -10,
    translations: {
      sr: {name: "Alpine Medium Winter", description: "Izolovana pomoćna zimska kućica za jednog srednjeg psa, sa podignutim podom i jednovodnim krovom."},
      en: {name: "Alpine Medium Winter", description: "Insulated auxiliary winter house for one medium dog, with an elevated floor and mono-pitch roof."}
    }
  },
  {
    id: "dog-large-heated-01",
    slug: "alpine-large-heated",
    version: "1.0.0",
    validationState: "DATA_VALIDATED",
    animal: "dog",
    intendedUse: "DOG_OUTDOOR_AUXILIARY",
    capacity: {recommended: 1, max: 1},
    dimensions: {widthMm: 1150, depthMm: 1350, frontHeightMm: 1150, rearHeightMm: 1010, groundClearanceMm: 160},
    layout: {chambers: 1, entrances: 1, entranceWidthMm: 460, entranceHeightMm: 700},
    construction: {wallInsulationMm: 60, floorInsulationMm: 60, roofInsulationMm: 60, wallThicknessMm: 81},
    heated: true,
    climateProfile: "WINTER_SEVERE",
    designOutsideC: -15,
    translations: {
      sr: {name: "Alpine Large Heated", description: "Velika izolovana pomoćna kućica sa predviđenom zonom za namenski grejni proizvod i odvojenom negrejanom površinom."},
      en: {name: "Alpine Large Heated", description: "Large insulated auxiliary shelter with a designated area for a purpose-built heating product and a separate unheated resting surface."}
    }
  }
];

export const shelterModels = models.map((model) => shelterModelSchema.parse(model));

export function getShelterModel(slug: string) {
  return shelterModels.find((model) => model.slug === slug);
}
