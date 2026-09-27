import {z} from "zod";

export const validationStateSchema = z.enum([
  "DATA_VALIDATED",
  "GEOMETRY_VALIDATED",
  "ENGINEERING_REVIEWED",
  "PROTOTYPE_BUILT",
  "FIELD_TESTED"
]);

export const shelterModelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  version: z.string(),
  validationState: validationStateSchema,
  sourceIds: z.array(z.string()).min(1),
  animal: z.enum(["cat", "dog"]),
  animalSizeClass: z.enum(["standard", "small", "medium", "large"]),
  intendedUse: z.enum([
    "COMMUNITY_CAT_SHELTER",
    "PET_OUTDOOR_AUXILIARY",
    "DOG_OUTDOOR_AUXILIARY",
    "RESCUE"
  ]),
  capacity: z.object({
    recommended: z.number().int().positive(),
    max: z.number().int().positive()
  }),
  dimensions: z.object({
    widthMm: z.number().int().positive(),
    depthMm: z.number().int().positive(),
    frontHeightMm: z.number().int().positive(),
    rearHeightMm: z.number().int().positive(),
    groundClearanceMm: z.number().int().nonnegative()
  }),
  layout: z.object({
    chambers: z.number().int().positive(),
    entrances: z.number().int().positive(),
    entranceWidthMm: z.number().int().positive(),
    entranceHeightMm: z.number().int().positive(),
    thresholdHeightMm: z.number().int().nonnegative(),
    dividerThicknessMm: z.number().int().positive()
  }),
  construction: z.object({
    wallAssemblyId: z.string(),
    floorAssemblyId: z.string(),
    roofAssemblyId: z.string()
  }),
  roof: z.object({
    sideOverhangMm: z.number().int().nonnegative(),
    frontOverhangMm: z.number().int().nonnegative(),
    rearOverhangMm: z.number().int().nonnegative()
  }),
  maintenance: z.object({
    roofAccess: z.enum(["HINGED", "REMOVABLE"]),
    hingeEdge: z.enum(["FRONT", "REAR"]).nullable()
  }),
  ventilation: z.object({
    strategy: z.literal("HIGH_REAR_PROVISION"),
    status: z.literal("PROVISIONAL"),
    zonesPerChamber: z.literal(1)
  }),
  heated: z.boolean(),
  climateProfile: z.enum([
    "SHELTERED_MILD",
    "WINTER_MODERATE",
    "WINTER_COLD",
    "WINTER_SEVERE"
  ]),
  referenceOutsideC: z.number(),
  translations: z.object({
    sr: z.object({name: z.string(), description: z.string()}),
    en: z.object({name: z.string(), description: z.string()})
  })
});

export type ShelterModel = z.infer<typeof shelterModelSchema>;
export type ValidationState = z.infer<typeof validationStateSchema>;
