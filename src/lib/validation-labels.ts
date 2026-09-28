import type {AppLocale} from "@/i18n/routing";
import type {ValidationState} from "@/lib/domain";

const validationLabels: Record<ValidationState, Record<AppLocale, string>> = {
  DATA_VALIDATED: {sr: "Podaci provereni", en: "Data validated"},
  GEOMETRY_VALIDATED: {sr: "Geometrija verifikovana", en: "Geometry validated"},
  ENGINEERING_REVIEWED: {sr: "Stručna tehnička provera", en: "Engineering review"},
  PROTOTYPE_BUILT: {sr: "Fizički prototip", en: "Physical prototype"},
  FIELD_TESTED: {sr: "Terenska validacija", en: "Field validation"}
};

export function validationStageLabel(state: ValidationState, locale: AppLocale): string {
  return validationLabels[state][locale];
}
