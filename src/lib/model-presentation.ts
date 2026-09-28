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
    detail: "Prenesite zone statusa PROVISIONAL u gornji deo zadnjeg zida i ostavite ih van položaja stubova. Ne secite konačan otvor dok ne izaberete konkretan podesivi ventilacioni umetak. Proizvođač umetka određuje otvor i slobodnu površinu za protok vazduha."
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
    note: "Broj se izvodi iz širine krova. Osa šarke prati liniju prednjeg zida i uvučena je od spoljne prednje ivice za dužinu prepusta. Pre dostizanja statusa ENGINEERING_REVIEWED proverite konačan tip šarke i nosivost."
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
    note: "Ukupna dužina elemenata rama + 10% rezerve. Profili ostaju označeni kao PROVISIONAL dok ne prođu stručnu tehničku proveru."
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
