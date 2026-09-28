import type {AppLocale} from "@/i18n/routing";
import type {ShelterModel} from "@/lib/domain";

const animalSizeClassLabels: Record<AppLocale, Record<ShelterModel["animalSizeClass"], string>> = {
  sr: {
    standard: "standardni",
    small: "mali",
    medium: "srednji",
    large: "veliki"
  },
  en: {
    standard: "standard",
    small: "small",
    medium: "medium",
    large: "large"
  }
};

const climateProfileLabels: Record<AppLocale, Record<ShelterModel["climateProfile"], string>> = {
  sr: {
    SHELTERED_MILD: "Zaštićeni blagi uslovi",
    WINTER_MODERATE: "Umerena zima",
    WINTER_COLD: "Hladna zima",
    WINTER_SEVERE: "Vrlo hladna zima"
  },
  en: {
    SHELTERED_MILD: "Sheltered mild conditions",
    WINTER_MODERATE: "Moderate winter",
    WINTER_COLD: "Cold winter",
    WINTER_SEVERE: "Very cold winter"
  }
};

export function animalSizeClassLabel(sizeClass: ShelterModel["animalSizeClass"], locale: AppLocale) {
  return animalSizeClassLabels[locale][sizeClass];
}

export function climateProfileLabel(profile: ShelterModel["climateProfile"], locale: AppLocale) {
  return climateProfileLabels[locale][profile];
}
