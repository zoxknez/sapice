import {z} from "zod";
import {validationStateSchema} from "@/lib/domain";
import {
  budgetClassSchema,
  calculationCoverageSchema,
  designClassSchema,
  difficultySchema,
  exposureRequirementSchema,
  seasonSchema,
  structureTypeSchema,
  toolSchema
} from "@/lib/catalog/taxonomy";

/**
 * Canonical "practical" models: emergency, reuse, budget and standard DIY constructions.
 *
 * They live beside the engineered ShelterModel instead of being forced into it: the engineered
 * compiler assumes a framed, three-layer plywood/XPS envelope, which would be false geometry for a
 * tote, a foam box, a pallet frame or an open shade structure.
 */

const mm = z.number().positive();
const mm0 = z.number().nonnegative();

const layerSchema = z.object({materialId: z.string(), thicknessMm: mm});

const entranceSchema = z.object({
  widthMm: mm,
  heightMm: mm,
  sillMm: mm0,
  count: z.number().int().positive()
});

const openingSchema = z.object({
  wall: z.enum(["REAR", "SIDE"]),
  widthMm: mm,
  heightMm: mm,
  sillMm: mm0
});

const raiseSchema = z.enum(["BATTENS", "BRICKS", "PALLET", "LEGS", "NONE"]);

const nominalEnvelopeSchema = z.object({
  lengthMm: mm,
  widthMm: mm,
  heightMm: mm,
  /** Containers vary by product: a nominal envelope is always a planning assumption. */
  provenance: z.literal("ASSUMPTION")
});

export const panelBoxParamsSchema = z.object({
  family: z.literal("PANEL_BOX"),
  outer: z.object({widthMm: mm, depthMm: mm, frontHeightMm: mm, rearHeightMm: mm}),
  groundClearanceMm: mm0,
  raiseWith: raiseSchema,
  shell: layerSchema,
  insulation: layerSchema.nullable(),
  lining: layerSchema.nullable(),
  /** Floor can skip insulation (e.g. covered-porch or summer models). */
  insulateFloor: z.boolean(),
  insulateRoof: z.boolean(),
  roofCoveringId: z.string().nullable(),
  roofOverhangMm: mm0,
  entrance: entranceSchema,
  secondaryOpening: openingSchema.nullable(),
  chambers: z.number().int().min(1).max(3),
  serviceRoof: z.boolean(),
  /** Accessory boxes (vestibules) have no floor panel. */
  hasFloor: z.boolean()
});

export const toteParamsSchema = z.object({
  family: z.literal("TOTE_IN_TOTE"),
  outerTote: nominalEnvelopeSchema,
  innerTote: nominalEnvelopeSchema.nullable(),
  liningMode: z.enum(["NONE", "STRAW_ONLY", "FOAM_LINER", "FOAM_SLAB_AND_INNER_TOTE", "FOAM_GAP_AND_INNER_TOTE"]),
  foam: layerSchema.nullable(),
  entrance: entranceSchema,
  raiseWith: raiseSchema,
  groundClearanceMm: mm0
});

export const foamContainerParamsSchema = z.object({
  family: z.literal("FOAM_CONTAINER"),
  box: nominalEnvelopeSchema.extend({wallThicknessMm: mm}),
  outerShell: z.enum(["NONE", "TOTE", "WRAP"]),
  outerTote: nominalEnvelopeSchema.nullable(),
  entrance: entranceSchema,
  raiseWith: raiseSchema,
  groundClearanceMm: mm0
});

export const crateParamsSchema = z.object({
  family: z.literal("CRATE"),
  crate: nominalEnvelopeSchema,
  /** Insulation placed OUTSIDE the slats so the animal faces wood, wrapped by a waterproof layer. */
  outerInsulation: layerSchema,
  wrapMaterialId: z.string(),
  entrance: entranceSchema,
  raiseWith: raiseSchema,
  groundClearanceMm: mm0
});

export const emergencyWrapParamsSchema = z.object({
  family: z.literal("EMERGENCY_WRAP"),
  container: nominalEnvelopeSchema.extend({materialId: z.string()}),
  wrapMaterialId: z.string().nullable(),
  entrance: entranceSchema,
  raiseWith: raiseSchema,
  groundClearanceMm: mm0
});

const palletSectionSchema = z.object({
  role: z.enum(["FLOOR", "BACK", "SIDE_LEFT", "SIDE_RIGHT", "FRONT_LEFT", "FRONT_RIGHT"]),
  /** Index of the source pallet this section is cut from. */
  sourcePallet: z.number().int().nonnegative(),
  lengthMm: mm,
  heightMm: mm
});

export const palletFrameParamsSchema = z.object({
  family: z.literal("PALLET_FRAME"),
  pallet: nominalEnvelopeSchema,
  sections: z.array(palletSectionSchema).min(4),
  /** Covers deck-board gaps on the outside. */
  cladding: layerSchema.nullable(),
  cavityInsulation: layerSchema.nullable(),
  lining: layerSchema.nullable(),
  roof: layerSchema,
  roofCoveringId: z.string(),
  roofOverhangMm: mm0,
  /** Height difference created with tapered battens so water runs to the rear. */
  roofFallMm: mm,
  entranceHeightMm: mm,
  groundClearanceMm: mm0
});

export const shadeParamsSchema = z.object({
  family: z.literal("SHADE_STRUCTURE"),
  footprint: z.object({widthMm: mm, depthMm: mm}),
  clearHeightFrontMm: mm,
  clearHeightRearMm: mm,
  roof: layerSchema,
  roofCoveringId: z.string().nullable(),
  roofOverhangMm: mm0,
  sides: z.enum(["OPEN", "BACK", "BACK_AND_SIDE", "THREE_SIDES"]),
  sidePanel: layerSchema.nullable(),
  platform: z.object({heightMm: mm, top: layerSchema}).nullable(),
  legProfileMm: z.tuple([mm, mm]),
  legCount: z.number().int().min(3)
});

export const platformParamsSchema = z.object({
  family: z.literal("RAISED_PLATFORM"),
  top: z.object({widthMm: mm, depthMm: mm}),
  topLayer: layerSchema,
  heightMm: mm,
  legProfileMm: z.tuple([mm, mm]),
  legCount: z.number().int().min(4)
});

export const retrofitItemSchema = z.enum([
  "ROOF_MEMBRANE",
  "RAISED_BASE",
  "ENTRANCE_FLAP",
  "WIND_BAFFLE",
  "INTERIOR_INSULATION",
  "PROTECTIVE_LINING",
  "SERVICE_ACCESS",
  "FLOOR_INSULATION"
]);

export const retrofitParamsSchema = z.object({
  family: z.literal("RETROFIT"),
  referenceHouse: z.object({widthMm: mm, depthMm: mm, heightMm: mm, wallThicknessMm: mm}),
  items: z.array(retrofitItemSchema).min(1),
  insulation: layerSchema,
  lining: layerSchema,
  roofCoveringId: z.string()
});

export const familyParamsSchema = z.discriminatedUnion("family", [
  panelBoxParamsSchema,
  toteParamsSchema,
  foamContainerParamsSchema,
  crateParamsSchema,
  emergencyWrapParamsSchema,
  palletFrameParamsSchema,
  shadeParamsSchema,
  platformParamsSchema,
  retrofitParamsSchema
]);

const copySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20)
});

export const practicalModelSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string(),
  validationState: validationStateSchema,
  designClass: designClassSchema.exclude(["ENGINEERED"]),
  structureType: structureTypeSchema,
  animal: z.enum(["cat", "dog"]),
  animalSizeClass: z.enum(["standard", "small", "medium", "large"]),
  capacity: z.object({recommended: z.number().int().positive(), max: z.number().int().positive()}),
  seasons: z.array(seasonSchema).min(1),
  exposure: exposureRequirementSchema,
  emergencyOnly: z.boolean(),
  difficulty: difficultySchema,
  tools: z.array(toolSchema).min(1),
  /** Planning estimate only, never a promise. */
  buildTimeMinutes: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  budgetClass: budgetClassSchema,
  coverage: z.array(calculationCoverageSchema).min(1),
  sourceIds: z.array(z.string()).min(1),
  bedding: z.enum(["straw", "none", "washable-dog-bed"]),
  params: familyParamsSchema,
  translations: z.object({sr: copySchema, en: copySchema})
});

export type PracticalModel = z.infer<typeof practicalModelSchema>;
export type FamilyParams = z.infer<typeof familyParamsSchema>;
export type PanelBoxParams = z.infer<typeof panelBoxParamsSchema>;
export type ToteParams = z.infer<typeof toteParamsSchema>;
export type FoamContainerParams = z.infer<typeof foamContainerParamsSchema>;
export type CrateParams = z.infer<typeof crateParamsSchema>;
export type EmergencyWrapParams = z.infer<typeof emergencyWrapParamsSchema>;
export type PalletFrameParams = z.infer<typeof palletFrameParamsSchema>;
export type ShadeParams = z.infer<typeof shadeParamsSchema>;
export type PlatformParams = z.infer<typeof platformParamsSchema>;
export type RetrofitParams = z.infer<typeof retrofitParamsSchema>;
export type RetrofitItem = z.infer<typeof retrofitItemSchema>;
export type Layer = z.infer<typeof layerSchema>;
