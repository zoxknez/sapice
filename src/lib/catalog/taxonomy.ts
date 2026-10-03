import {z} from "zod";
import {designClassValues, seasonValues, structureTypeValues, constructionFamilyValues, calculationCoverageValues, difficultyValues, toolValues, budgetClassValues, exposureRequirementValues} from "@/lib/catalog/taxonomy-core";

export * from "@/lib/catalog/taxonomy-core";

export const designClassSchema = z.enum(designClassValues);
export const seasonSchema = z.enum(seasonValues);
export const structureTypeSchema = z.enum(structureTypeValues);
export const constructionFamilySchema = z.enum(constructionFamilyValues);
export const calculationCoverageSchema = z.enum(calculationCoverageValues);
export const difficultySchema = z.enum(difficultyValues);
export const toolSchema = z.enum(toolValues);
export const budgetClassSchema = z.enum(budgetClassValues);
export const exposureRequirementSchema = z.enum(exposureRequirementValues);
