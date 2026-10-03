/**
 * Retrofit advisor: a deterministic, ordered list of improvements for an existing shelter.
 * It deliberately does not calculate thermal performance: the user's description of an existing
 * house (unknown species, gaps, moisture, condition) is not precise enough for a credible U-value.
 */

export type RetrofitInput = {
  animal: "cat" | "dog";
  dogSize: "small" | "medium" | "large";
  season: "WINTER" | "SUMMER" | "ALL";
  widthMm: number | null;
  depthMm: number | null;
  heightMm: number | null;
  wallMaterial: "WOOD" | "OSB" | "PLASTIC" | "METAL" | "UNKNOWN";
  wallThicknessMm: number | null;
  floor: "WOOD_RAISED" | "WOOD_ON_GROUND" | "NONE" | "CONCRETE" | "PLASTIC";
  roof: "SLOPED_AWAY" | "SLOPED_TO_ENTRANCE" | "FLAT" | "UNKNOWN";
  leaks: boolean;
  onGround: boolean;
  entrances: number;
  entranceWidthMm: number | null;
  insulated: boolean;
  insulationExposed: boolean;
  ventilated: boolean;
  woodCondition: "GOOD" | "WEATHERED" | "ROTTEN" | "NOT_WOOD";
  location: "EXPOSED" | "SHELTERED" | "COVERED";
  removableRoof: boolean;
};

export type RetrofitPriority = {
  id: string;
  rank: number;
  severity: "STOP" | "HIGH" | "MEDIUM" | "LOW";
  titleSr: string;
  titleEn: string;
  whySr: string;
  whyEn: string;
  materialIds: string[];
};

/** Entrance widths above these values are treated as larger than needed (planning thresholds, ASSUMPTION). */
export const entranceWidthThresholdMm = {cat: 200, small: 260, medium: 340, large: 420} as const;

export function retrofitPlan(input: RetrofitInput): {priorities: RetrofitPriority[]; thermalCalculated: false; notesSr: string[]; notesEn: string[]} {
  const priorities: RetrofitPriority[] = [];
  const add = (item: Omit<RetrofitPriority, "rank">) => priorities.push({...item, rank: 0});

  if (input.woodCondition === "ROTTEN") {
    add({id: "rotten", severity: "STOP", titleSr: "Trula konstrukcija: popravka ili nova kućica", titleEn: "Rotten structure: repair or replace", whySr: "Trulo drvo ne drži šrafove, upija vodu i može da popusti. Pre ulaganja u izolaciju zamenite oštećene delove ili izaberite novi model.", whyEn: "Rotten wood does not hold screws, absorbs water and can fail. Replace damaged parts or choose a new model before investing in insulation.", materialIds: []});
  }
  if (input.leaks || input.roof === "UNKNOWN") {
    add({id: "water", severity: "HIGH", titleSr: "Sprečite prodor vode", titleEn: "Stop water getting in", whySr: "Topla kućica koja se vlaži može biti lošija od jednostavnije kućice koja ostaje suva. Krov i spojevi su prvi posao.", whyEn: "A warm house that gets damp can be worse than a simpler house that stays dry. The roof and joints come first.", materialIds: ["bitumen-membrane", "sealant"]});
  }
  if (input.roof === "SLOPED_TO_ENTRANCE" || input.roof === "FLAT") {
    add({id: "roof-fall", severity: "HIGH", titleSr: "Krov neka odvodi vodu iza kućice", titleEn: "Make the roof shed water behind the house", whySr: "Voda koja se sliva ka ulazu ili stoji na ravnom krovu ulazi u kućicu. Dodajte klinaste letve ili okrenite kućicu.", whyEn: "Water draining toward the entrance or pooling on a flat roof gets inside. Add tapered battens or turn the house.", materialIds: ["softwood", "bitumen-membrane"]});
  }
  if (input.onGround || input.floor === "WOOD_ON_GROUND" || input.floor === "NONE" || input.floor === "CONCRETE") {
    add({id: "raise", severity: "HIGH", titleSr: "Podignite kućicu od tla", titleEn: "Raise the house off the ground", whySr: "Pod na vlažnoj ili hladnoj zemlji gubi toplotu i vlaži se. Stabilni oslonci odvajaju pod od tla.", whyEn: "A floor on damp or cold ground loses heat and gets wet. Stable supports separate the floor from the ground.", materialIds: ["concrete-blocks"]});
  }
  if (input.floor === "NONE") {
    add({id: "floor", severity: "HIGH", titleSr: "Dodajte pod", titleEn: "Add a floor", whySr: "Bez poda nema zaštite od vlage odozdo ni mesta za posteljinu.", whyEn: "Without a floor there is no protection from moisture below and nowhere for bedding.", materialIds: ["osb3", "softwood"]});
  }
  const threshold = input.animal === "cat" ? entranceWidthThresholdMm.cat : entranceWidthThresholdMm[input.dogSize];
  if (input.season !== "SUMMER" && (input.location === "EXPOSED" || (input.entranceWidthMm !== null && input.entranceWidthMm > threshold))) {
    add({id: "entrance", severity: "MEDIUM", titleSr: "Zaštitite ulaz od direktnog vetra", titleEn: "Protect the entrance from direct wind", whySr: `Okrenite ulaz od dominantnog vetra i dodajte zavesu ili unutrašnju pregradu za L-ulaz.${input.entranceWidthMm !== null && input.entranceWidthMm > threshold ? " Ulaz je širi nego što je potrebno; manji otvor zadržava više toplote." : ""}`, whyEn: `Turn the entrance away from the prevailing wind and add a flap or an interior baffle for an L-entry.${input.entranceWidthMm !== null && input.entranceWidthMm > threshold ? " The entrance is wider than needed; a smaller opening keeps more heat in." : ""}`, materialIds: ["flap-material", "plywood-interior"]});
  }
  if (input.season !== "SUMMER" && !input.insulated) {
    add({id: "insulate", severity: "MEDIUM", titleSr: "Dodajte izolaciju kada je kućica suva", titleEn: "Add insulation once the house is dry", whySr: "Ploče izolacije postavite iznutra na zidove, krov i pod tek kada su voda i podizanje rešeni.", whyEn: "Fit insulation boards inside the walls, roof and floor only once water and raising are solved.", materialIds: ["xps"]});
  }
  if (input.season !== "SUMMER" && (input.insulated ? input.insulationExposed : true)) {
    add({id: "protect-insulation", severity: "MEDIUM", titleSr: "Zaštitite izolaciju od životinje", titleEn: "Protect the insulation from the animal", whySr: "Pena se gricka i grebe, a mineralna vuna nikada ne sme biti dostupna. Preko izolacije postavite oblogu.", whyEn: "Foam gets chewed and scratched, and mineral wool must never be reachable. Cover the insulation with a lining.", materialIds: ["plywood-interior"]});
  }
  if (!input.removableRoof) {
    add({id: "service", severity: "LOW", titleSr: "Omogućite servisni pristup", titleEn: "Provide service access", whySr: "Kućica koja se ne može otvoriti teško se čisti i suši. Šarke na krovu ili vrata za čišćenje olakšavaju održavanje.", whyEn: "A house that cannot be opened is hard to clean and dry. Roof hinges or a cleaning door make maintenance easier.", materialIds: ["hinges", "latch"]});
  }
  if (input.wallMaterial === "METAL") {
    add({id: "metal", severity: input.season === "SUMMER" ? "HIGH" : "MEDIUM", titleSr: "Metalni zidovi: toplota i kondenzacija", titleEn: "Metal walls: heat and condensation", whySr: "Lim se na suncu jako zagreva, a zimi na njemu nastaje kondenzacija. Potrebna je senka i unutrašnja obloga sa vazdušnim slojem.", whyEn: "Sheet metal gets very hot in sun and collects condensation in winter. It needs shade and an interior lining with an air gap.", materialIds: ["plywood-interior"]});
  }
  if (input.season === "SUMMER" || input.season === "ALL") {
    add({id: "summer", severity: input.season === "SUMMER" ? "HIGH" : "LOW", titleSr: "Leti: senka, voda i slobodan izlaz", titleEn: "Summer: shade, water and freedom to leave", whySr: "Zatvorena kućica nije zaštita od velike vrućine i može je pogoršati. Obezbedite punu senku koja ne zaustavlja vazduh, svežu vodu i mogućnost da životinja ode na hladnije mesto.", whyEn: "A closed doghouse is no protection from extreme heat and can make it worse. Provide full shade that does not block airflow, fresh water and a way to move somewhere cooler.", materialIds: ["polycarbonate"]});
  }
  if (!input.ventilated && input.season !== "SUMMER") {
    add({id: "ventilation", severity: "LOW", titleSr: "Ventilacija bez nasumičnih rupa", titleEn: "Ventilation without random holes", whySr: "Ako se pojavi kondenzacija, dodajte mali zaštićen otvor visoko pozadi, dalje od mesta gde životinja leži. Ne bušite otvore nasumično.", whyEn: "If condensation appears, add a small protected opening high at the rear, away from where the animal lies. Do not drill holes at random.", materialIds: ["mesh"]});
  }

  const order: Record<RetrofitPriority["severity"], number> = {STOP: 0, HIGH: 1, MEDIUM: 2, LOW: 3};
  const sequence = ["rotten", "water", "roof-fall", "raise", "floor", "entrance", "insulate", "protect-insulation", "service", "metal", "summer", "ventilation"];
  priorities.sort((a, b) => order[a.severity] - order[b.severity] || sequence.indexOf(a.id) - sequence.indexOf(b.id));
  priorities.forEach((item, index) => (item.rank = index + 1));

  return {
    priorities,
    thermalCalculated: false,
    notesSr: [
      "Termička procena se ne računa: opis postojeće kućice nije dovoljno precizan za verodostojnu U-vrednost.",
      "Redosled je deterministički: najpre bezbednost konstrukcije i voda, pa podizanje, ulaz, izolacija i održavanje."
    ],
    notesEn: [
      "No thermal estimate is calculated: a description of an existing house is not precise enough for a credible U-value.",
      "The order is deterministic: structural safety and water first, then raising, the entrance, insulation and maintenance."
    ]
  };
}

/** Planning sheet count for interior insulation of a described house (ASSUMPTION: +15% waste). */
export function retrofitInsulationSheets(input: Pick<RetrofitInput, "widthMm" | "depthMm" | "heightMm" | "wallThicknessMm">, sheet = {widthMm: 1250, heightMm: 600}) {
  if (!input.widthMm || !input.depthMm || !input.heightMm) return null;
  const t = input.wallThicknessMm ?? 18;
  const w = input.widthMm - 2 * t;
  const d = input.depthMm - 2 * t;
  const h = input.heightMm - 2 * t;
  if (w <= 0 || d <= 0 || h <= 0) return null;
  const areaM2 = (2 * w * h + 2 * d * h + 2 * w * d) / 1_000_000;
  return {areaM2: Math.round(areaM2 * 100) / 100, sheets: Math.ceil((areaM2 * 1.15) / ((sheet.widthMm * sheet.heightMm) / 1_000_000))};
}
