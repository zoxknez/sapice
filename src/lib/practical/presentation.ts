import type {AppLocale} from "@/i18n/routing";
import type {PracticalModel} from "@/lib/practical/domain";

/** Deterministic "who it is for" copy derived from the model's class, animal and capacity. */
export function whoFor(model: PracticalModel, locale: AppLocale): string[] {
  const isSr = locale === "sr";
  const items: string[] = [];
  switch (model.designClass) {
    case "EMERGENCY":
      items.push(isSr ? "Za nekoga ko večeras mora da zaštiti životinju onim što ima pri ruci." : "For someone who has to protect an animal tonight with whatever is at hand.");
      break;
    case "REUSE":
      items.push(isSr ? "Za one koji imaju iskorišćen materijal i mogu da provere njegovo stanje i poreklo." : "For people with reused material who can check its condition and history.");
      break;
    case "BUDGET":
      items.push(isSr ? "Za početnike sa osnovnim alatom i malim budžetom." : "For beginners with basic tools and a small budget.");
      break;
    case "STANDARD_DIY":
      items.push(isSr ? "Za iskusnije majstore sa električnim alatom." : "For more experienced makers with power tools.");
      break;
  }
  if (model.animal === "cat") {
    items.push(isSr
      ? `Za ${model.capacity.recommended === 1 ? "jednu mačku" : `${model.capacity.recommended} mačke`}${model.capacity.max > model.capacity.recommended ? ` (najviše ${model.capacity.max})` : ""}, uključujući slobodnoživeće mačke.`
      : `For ${model.capacity.recommended === 1 ? "one cat" : `${model.capacity.recommended} cats`}${model.capacity.max > model.capacity.recommended ? ` (up to ${model.capacity.max})` : ""}, including community cats.`);
  } else {
    const size = {small: isSr ? "malog" : "small", medium: isSr ? "srednjeg" : "medium", large: isSr ? "velikog" : "large", standard: ""}[model.animalSizeClass];
    items.push(isSr ? `Za jednog ${size} psa kao pomoćno spoljašnje rešenje; pre izrade izmerite psa.` : `For one ${size} dog as an auxiliary outdoor solution; measure the dog before building.`);
  }
  if (model.seasons.includes("SUMMER")) items.push(isSr ? "Za letnje mesece, kao senka i zaklon uz vodu i slobodan izlaz." : "For summer months, as shade and cover with water and freedom to leave.");
  return items;
}

/** Deterministic "when not to use it" list. */
export function whenNotToUse(model: PracticalModel, locale: AppLocale): string[] {
  const isSr = locale === "sr";
  const items: string[] = [];
  if (model.emergencyOnly) items.push(isSr ? "Kao trajno sklonište: ovo je samo hitno rešenje i mora se zameniti čim je moguće." : "As a permanent shelter: this is emergency-only and must be replaced as soon as possible.");
  if (model.exposure === "COVERED_ONLY") items.push(isSr ? "Napolju bez krova iznad: mora stajati pod nadstrešnicom, u šupi ili ulazu." : "Outside without a roof above it: it must stand under a canopy, in a shed or a doorway.");
  if (model.exposure === "SHELTERED") items.push(isSr ? "Na potpuno izloženom mestu: potreban je zaklon od vetra i kiše (zid, ograda, streha)." : "At a fully exposed spot: it needs shelter from wind and rain (a wall, fence or eaves).");
  if (model.structureType === "SLEEPING_SHELTER" && !model.seasons.includes("WINTER") && !model.seasons.includes("EMERGENCY")) {
    items.push(isSr ? "Kao zimsko sklonište: nema izolacije za hladne noći." : "As a winter shelter: it has no insulation for cold nights.");
  }
  if (model.structureType !== "SLEEPING_SHELTER") items.push(isSr ? "Kao sklonište za spavanje: ovo je pomoćna konstrukcija." : "As a sleeping shelter: this is an auxiliary structure.");
  if (model.seasons.includes("SUMMER")) items.push(isSr ? "Kao zamena za hladniji bezbedan prostor tokom velike vrućine." : "As a replacement for a cooler safe space during extreme heat.");
  if (model.animal === "dog") items.push(isSr ? "Kao zamena za boravak u zatvorenom tokom opasne hladnoće ili vrućine." : "As a substitute for being indoors during dangerous cold or heat.");
  items.push(isSr
    ? "Za mlade, stare, bolesne i neaklimatizovane životinje bez dodatne zaštite i nadzora."
    : "For young, old, sick or unacclimated animals without extra protection and supervision.");
  if (model.designClass === "REUSE") items.push(isSr ? "Sa materijalom koji nije prošao kontrolnu listu za ponovnu upotrebu." : "With material that has not passed the reuse checklist.");
  return items;
}
