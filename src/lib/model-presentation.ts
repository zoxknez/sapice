import type {AppLocale} from "@/i18n/routing";
import type {BuildStep, CutPart, HardwareItem, LinearPart} from "@/lib/compiler";
import type {CostLine} from "@/lib/costing";

const buildStepCopySr: Record<string, {title: string; detail: string}> = {
  base: {
    title: "Napravite podignutu bazu",
    detail: "Sastavite planirani raspored uspravnih oslonaca i uzdužnih nosača. Ispod svakog oslonca postavite odgovarajuću stopicu ili podmetač koji odvaja drvo od mokre podloge; sidrenje i oslonac prilagodite stvarnoj lokaciji."
  },
  walls: {
    title: "Sastavite zidove prema planu spojeva",
    detail: "Prednji i zadnji zid zadržavaju punu širinu, a bočni se uklapaju između njihovih unutrašnjih ravni. Pratite zadate dužine i visine bočnih zidova i mere ulaza; ne produžavajte bočne ploče u ugaone zone."
  },
  "corner-weathering": {
    title: "Zaštitite četiri spoljašnje ugaone ivice",
    detail: "Preko vertikalnih spojeva postavite kompatibilne ugaone lajsne i zaptivanje, tako da presečene ivice ploča ne budu izložene vodi. Izabrani profil i preklop moraju odgovarati spoljašnjoj završnoj oblozi."
  },
  "ventilation-provision": {
    title: "Ostavite gornje zone zadnjeg zida za ventilacione umetke",
    detail: "Prenesite privremeno rezervisane zone u gornji deo zadnjeg zida i ostavite ih van položaja stubova. Ne secite konačan otvor dok ne izaberete konkretan podesivi ventilacioni umetak. Proizvođač umetka određuje otvor i slobodnu površinu za protok vazduha."
  },
  roof: {
    title: "Montirajte krov i hidroizolaciju",
    detail: "Krov ima nagib od prednje ka zadnjoj ivici, pa zadnja ivica odvodi vodu. Izaberite krovni sistem čije uputstvo izričito dozvoljava projektovani nagib. Pratite propisani redosled slojeva i preklopa; detalji ivica treba da usmere vodu iza kućice, dalje od ulaza."
  }
};

const hardwareItemCopySr: Record<string, {name?: string; note?: string}> = {
  "corner-weather-trim": {
    name: "Zaštita spoljašnjih ugaonih ivica",
    note: "Okvirna dužina za četiri spoljašnje vertikalne ivice. Izabrani profil, zaptivanje i preklop moraju odgovarati spoljašnjoj oblozi i završnoj zaštiti."
  },
  "panel-fasteners": {
    note: "Procena V1 koristi približno 150 mm razmaka uz ivice i 300 mm u polju kao početni referentni obrazac. Konačni prečnik, dužina i raspored treba da prođu stručnu tehničku proveru."
  },
  "roof-hinges": {
    note: "Broj se izvodi iz širine krova. Osa šarke prati liniju prednjeg zida i uvučena je od spoljne prednje ivice za dužinu prepusta. Pre statusa „Stručna tehnička provera” proverite konačan tip šarke i nosivost."
  },
  "roof-latches": {
    note: "Zatvarači služe da servisni krov ostane bezbedno zatvoren na vetru. Postavljaju se uz liniju zadnjeg zida, uvučeno od zadnje ivice za dužinu prepusta, tako da putanja oticanja vode ostane slobodna."
  },
  "roof-edge-weathering-profile": {
    name: "Kapna ivica i zaštitni profil krova",
    note: "Okvirna dužina obuhvata ceo obod krovne ploče. Konačan profil, redosled slojeva i obrada niže zadnje ivice moraju pratiti izabrani krovni sistem."
  },
  "protected-cable-entry": {
    note: "Samo za namenski proizvod za grejanje životinja i u skladu sa njegovim uputstvom. Aplikacija ne daje uputstva za samostalno izvođenje instalacije na mrežni napon."
  }
};

const costLineCopySr: Record<string, {label?: string; note?: string}> = {
  "plywood-12-sheet": {
    note: "Broj ploča prema rasporedu krojnih delova na pločama dimenzija 2500 × 1250 mm."
  },
  "plywood-9-sheet": {
    note: "Broj ploča prema rasporedu krojnih delova na pločama dimenzija 2500 × 1250 mm."
  },
  "xps-board": {
    note: "Broj XPS ploča standardnog formata 1250 × 600 mm. Dimenzije proverite kod lokalnog dobavljača."
  },
  "ventilation-inserts": {
    note: "Po jedan konkretan umetak za svaku rezervisanu zonu ventilacije. Konačan otvor i slobodna površina za protok vazduha moraju odgovarati tehničkom listu izabranog proizvoda."
  },
  "timber-frame": {
    note: "Ukupna dužina elemenata rama + 10% rezerve. Profili ostaju označeni kao privremeni dok ne prođu stručnu tehničku proveru."
  },
  "heating-product": {
    label: "Namenski proizvod za grejanje životinja",
    note: "Za planiranje se računa po jedan kompatibilan namenski proizvod za svaku predviđenu zonu grejanja. Ako izabrani sertifikovani sistem pokriva više zona, nabavku uskladite sa njegovim tehničkim listom. Aplikacija ne projektuje improvizovane grejače."
  }
};

export function modelBuildStepCopy(step: BuildStep, locale: AppLocale) {
  if (locale === "en") return {title: step.titleEn, detail: step.detailEn};
  const copy = buildStepCopySr[step.id];
  return copy ?? {title: step.titleSr, detail: step.detailSr};
}

export function hardwareItemName(item: HardwareItem, locale: AppLocale) {
  return locale === "sr"
    ? hardwareItemCopySr[item.id]?.name ?? item.nameSr
    : item.nameEn;
}

export function hardwareItemNote(item: HardwareItem, locale: AppLocale) {
  return locale === "sr"
    ? hardwareItemCopySr[item.id]?.note ?? item.notesSr
    : item.notesEn;
}

export function cutPartNote(part: CutPart, locale: AppLocale) {
  if (locale === "en") return part.notesEn;
  if (part.id === "front-outer") {
    return "Položaji i dimenzije ulaza izvedeni su iz kanonskog rasporeda modela.";
  }
  return part.notesSr;
}

export function cutPartMaterialLabel(part: CutPart, locale: AppLocale) {
  if (part.material === "plywood-12") {
    return locale === "sr" ? "Šperploča 12 mm" : "12 mm plywood";
  }
  if (part.material === "plywood-9") {
    return locale === "sr" ? "Šperploča 9 mm" : "9 mm plywood";
  }
  if (part.material === "xps") {
    return locale === "sr" ? "XPS izolacija" : "XPS insulation";
  }
  return part.material;
}

export function linearPartNote(part: LinearPart, locale: AppLocale) {
  if (locale === "en") return part.notesEn;
  if (part.id.startsWith("base-post-")) {
    return "Rešetka oslonaca V1 podiže uzdužni nosač do donje strane poda. Izbor materijala za kontakt sa tlom, stopica i sidrenja zahteva stručnu proveru na konkretnoj lokaciji.";
  }
  if (part.id.startsWith("left-stud-") || part.id.startsWith("right-stud-")) {
    const spacing = part.notesSr?.match(/≈\s*[\d.]+\s*mm/)?.[0];
    return `Koordinata Z izražena je u odnosu na kućicu. Stub se nalazi unutar bočnog zida, između prednjeg i zadnjeg sklopa; razmak prati najveći osni razmak predviđen za V1${spacing ? ` (${spacing})` : ""}.`;
  }
  return part.notesSr;
}

export function provenanceLabel(provenance: "ASSUMPTION" | "GEOMETRY", locale: AppLocale) {
  if (locale === "en") return provenance;
  return provenance === "ASSUMPTION" ? "Pretpostavka" : "Izvedeno iz geometrije";
}

export function costLineCopy(line: CostLine, locale: AppLocale) {
  if (locale === "en") return {label: line.labelEn, note: line.noteEn};

  const hardwareId = line.id.startsWith("hardware-")
    ? line.id.slice("hardware-".length)
    : undefined;
  const hardwareCopy = hardwareId ? hardwareItemCopySr[hardwareId] : undefined;
  const lineCopy = costLineCopySr[line.id];

  return {
    label: hardwareCopy?.name ?? lineCopy?.label ?? line.labelSr,
    note: hardwareCopy?.note ?? lineCopy?.note ?? line.noteSr
  };
}

// Serbian display copy for model descriptions. Canonical translations stay untouched in
// src/data/models.ts because they are part of the plan fingerprint input.
const modelDescriptionSr: Record<string, string> = {
  "cat-six-winter-01":
    "Trokomorno sklonište za do šest slobodnoživećih mačaka. Više komora smanjuje zavisnost cele grupe od jednog ulaza.",
  "rescue-cat-eight-01":
    "Četvorokomorni referentni model za udruženja i kolonije slobodnoživećih mačaka, projektovan kao ponovljiv modularni deo.",
  "cat-duo-heated-01":
    "Grejana jednokomorna varijanta za dve odrasle mačke, sa rezervisanom zonom za namenski grejni proizvod i preostalom negrejanom površinom poda.",
  "cat-six-heated-01":
    "Grejana trokomorna varijanta za do šest slobodnoživećih mačaka, sa po jednom odvojenom zonom za namenski grejni proizvod u svakoj komori.",
  "rescue-cat-eight-heated-01":
    "Grejana četvorokomorna varijanta za udruženja i kolonije do osam mačaka, sa posebnom zonom za izabrani grejni proizvod u svakoj komori.",
  "dog-medium-heated-01":
    "Grejana pomoćna zimska kućica za jednog srednjeg psa, sa rezervisanom zonom za namenski grejni proizvod i zaštićenim prolazom za kabl."
};

export function modelDescription(
  model: {id: string; translations: Record<AppLocale, {description: string}>},
  locale: AppLocale
) {
  if (locale === "sr") return modelDescriptionSr[model.id] ?? model.translations.sr.description;
  return model.translations.en.description;
}

const planStatusSr: Record<string, string> = {
  PROVISIONAL: "PRIVREMENO",
  PRODUCT_SPECIFIC: "ZAVISI OD PROIZVODA",
  NOT_APPLICABLE: "NIJE PRIMENLJIVO"
};

export function planStatusLabel(status: string, locale: AppLocale) {
  return locale === "sr" ? planStatusSr[status] ?? status : status;
}

const materialNoteSr: Record<string, string> = {
  xps:
    "Za V1 sklopove od 50 i 60 mm koristi se λD 0,033 W/mK iz tehničkog lista FIBRANxps 300. Drugi proizvod mora da zameni ovu vrednost podatkom iz sopstvene izjave o svojstvima (DoP) ili tehničkog lista.",
  plywood:
    "V1 termički proračun koristi 0,17 W/mK kao konzervativnu referencu za brezovu i vodootpornu (brodsku) šperploču. Stvarna vrednost zavisi od vrste drveta, gustine i vlage; finalni projekat treba da koristi tehnički list izabrane ploče."
};

export function materialNote(materialId: string, locale: AppLocale) {
  return locale === "sr" ? materialNoteSr[materialId] : undefined;
}
