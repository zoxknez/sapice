/**
 * Upgrade graph. An edge is never marketing copy: it states what is added, what is gained, what
 * stays limited, which new materials are needed and whether it is a new canonical model (new plan
 * fingerprint) or an in-place change to an existing build (no canonical plan describes the result).
 */
export type UpgradeEdge = {
  id: string;
  from: string;
  /** Target canonical model slug, or null for an in-place modification. */
  to: string | null;
  kind: "NEW_MODEL" | "IN_PLACE";
  addsSr: string;
  addsEn: string;
  gainsSr: string;
  gainsEn: string;
  limitsSr: string;
  limitsEn: string;
  newMaterialIds: string[];
};

const edge = (
  from: string,
  to: string | null,
  newMaterialIds: string[],
  addsSr: string,
  addsEn: string,
  gainsSr: string,
  gainsEn: string,
  limitsSr: string,
  limitsEn: string
): UpgradeEdge => ({
  id: `${from}->${to ?? "in-place:" + addsEn.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`,
  from,
  to,
  kind: to ? "NEW_MODEL" : "IN_PLACE",
  addsSr,
  addsEn,
  gainsSr,
  gainsEn,
  limitsSr,
  limitsEn,
  newMaterialIds
});

export const upgradeEdges: UpgradeEdge[] = [
  // Cat emergency → engineered chain
  edge("emergency-cardboard-dry", "emergency-waterproof-wrap", ["waterproof-sheet", "bricks"],
    "Folija spolja i podizanje na cigle.", "An outer film wrap and raising on bricks.",
    "Može kratko da stoji na zaklonjenom mestu napolju.", "Can stand briefly at a sheltered outdoor spot.",
    "I dalje karton: hitno, svakodnevna provera, zamena čim se navlaži.", "Still cardboard: emergency only, daily checks, replace when damp."),
  edge("emergency-waterproof-wrap", "single-plastic-tote", ["plastic-tote"],
    "Plastična kutija umesto kartona.", "A plastic tote instead of cardboard.",
    "Vodootporan omotač koji ne omekšava.", "A waterproof shell that does not soften.",
    "Bez izolacije; zimi samo sa slamom i uz zaklon.", "No insulation; in winter only with straw and cover."),
  edge("single-plastic-tote", "tote-with-straw", ["straw", "bricks"],
    "Slama do polovine visine, podizanje i viši prag.", "Straw up to half height, raising and a higher sill.",
    "Jeftino zimsko rešenje za jednu mačku.", "An inexpensive winter option for one cat.",
    "Nema kontrolisanog izolacionog sloja; nema termičke procene.", "No controlled insulation layer; no thermal estimate."),
  edge("tote-with-straw", "tote-in-tote-straw", ["plastic-tote", "eps"],
    "Druga, manja kutija i ploča pene na dnu.", "A second, smaller tote and a foam slab on the bottom.",
    "Vazdušni sloj i izolovan pod.", "An air gap and an insulated floor.",
    "Zidovi i dalje bez pene; plastika ostaje nepoznat termički sloj.", "Walls still without foam; plastic remains an unknown thermal layer."),
  edge("tote-in-tote-straw", "double-tote-insulated", ["eps"],
    "Ploče pene i u procepu između zidova.", "Foam panels in the wall gap too.",
    "Potpuniji izolacioni sloj oko unutrašnje kutije.", "A more complete insulation layer around the inner tote.",
    "Plastika puca vremenom; nije trajna drvena konstrukcija.", "Plastic cracks over time; not a durable timber build."),
  edge("double-tote-insulated", "osb-economy-cat", ["osb3", "eps", "plywood-interior", "roofing-felt", "softwood"],
    "Prelazak na trajnu drvenu kutiju.", "Moving to a durable timber box.",
    "Duži vek, servisirljiv krov i potpuna termička procena.", "Longer life, a serviceable roof and a complete thermal estimate.",
    "Potreban alat i više vremena; ivice OSB-a traže zaštitu.", "Needs tools and more time; OSB edges need protection."),
  edge("osb-economy-cat", "compact-single-cat-winter", ["plywood-exterior", "xps", "bitumen-membrane", "hinges", "latch"],
    "Šperploča, XPS 50 mm i servisni krov.", "Plywood, 50 mm XPS and a service roof.",
    "Bolja izolacija i lakše čišćenje.", "Better insulation and easier cleaning.",
    "I dalje bez kompajliranog rama i okova.", "Still without a compiled frame and hardware."),
  edge("compact-single-cat-winter", "nordic-solo-winter", ["plywood-exterior", "xps", "softwood"],
    "Inženjerski model sa ramom, okovom i krojnom listom.", "The engineered model with framing, hardware and cut list.",
    "Kompletan radionički plan i ID plana.", "A complete workshop plan and plan ID.",
    "Viši trošak i radionički alat; status je i dalje samo provera podataka.", "Higher cost and workshop tools; status is still data-validated only."),
  edge("foam-shipping-box-shelter", "eps-core-plastic-shell", ["plastic-tote"],
    "Plastična kutija oko stiropora.", "A plastic tote around the foam box.",
    "Pena zaštićena od kiše, sunca i grebanja spolja.", "Foam protected from rain, sun and outside scratching.",
    "Debljina pene zavisi od kutije; termika ostaje delimična.", "Foam thickness depends on the box; thermal stays partial."),
  edge("tote-with-straw", "tote-eps-lined", ["eps"],
    "Obloga od EPS-a sa svih strana.", "An EPS lining on every side.",
    "Kontrolisan izolacioni sloj u kutiji.", "A controlled insulation layer in the tote.",
    "Pena mora biti zaštićena slamom i proveravana zbog grebanja.", "Foam must be covered by straw and checked for scratching."),
  edge("tote-eps-lined", "tote-xps-lined", ["xps"],
    "XPS umesto EPS-a iste debljine.", "XPS instead of EPS of the same thickness.",
    "Bolja otpornost na vlagu i pritisak.", "Better moisture and compression resistance.",
    "Viša cena; plastika i dalje nepoznat sloj.", "Higher cost; plastic is still an unknown layer."),
  edge("scrap-wood-cat-box", "osb-economy-cat", ["osb3"],
    "OSB ploče umesto starih dasaka.", "OSB boards instead of old planks.",
    "Poznat materijal i potpuna termička procena.", "A known material and a complete thermal estimate.",
    "Kupovina ploča.", "Buying boards."),
  edge("pallet-mini-cat-shelter", "osb-economy-cat", ["osb3", "eps", "plywood-interior"],
    "Kutija od ploča umesto paleta.", "A panel box instead of pallets.",
    "Manje razmaka i manje provere porekla.", "Fewer gaps and less origin checking.",
    "Kupovina ploča.", "Buying boards."),
  // Pallet dog in-place and model upgrades
  edge("pallet-dog-basic", null, ["bitumen-membrane", "sealant"],
    "Zaštita od vremena: bitumenska traka na krovu i zaptivene ivice.", "Weather protection: bituminous roof membrane and sealed edges.",
    "Krov ne propušta vodu.", "The roof stops water.",
    "Zidovi i dalje imaju razmake; to je izmena tvoje kućice, ne novi kanonski plan.", "Walls still have gaps; this changes your build, not the canonical plan."),
  edge("pallet-dog-basic", null, ["concrete-blocks"],
    "Podignut pod na betonske blokove.", "A floor raised on concrete blocks.",
    "Pod dalje od vlažne zemlje i bolji protok vazduha ispod.", "Floor further from wet ground with airflow beneath.",
    "Izmena postojeće kućice; plan paleta ostaje isti.", "A change to your build; the pallet plan stays the same."),
  edge("pallet-dog-basic", "pallet-osb-dog", ["osb3", "eps", "plywood-interior"],
    "Unutrašnja obloga, EPS u šupljinama i OSB spolja.", "Interior lining, EPS in the cavities and OSB outside.",
    "Zimska upotreba na zaklonjenom mestu i delimična termička procena.", "Winter use at a sheltered spot and a partial thermal estimate.",
    "Pod i krov nisu izolovani; paleta ostaje nepoznat sloj.", "Floor and roof are not insulated; the pallet stays an unknown layer."),
  edge("pallet-osb-dog", null, ["xps", "plywood-interior"],
    "Izolovan krov: XPS ispod krovne ploče sa oblogom.", "Insulated roof: XPS under the roof board with a lining.",
    "Manji gubitak toplote kroz krov.", "Less heat loss through the roof.",
    "Izmena postojeće kućice; termička procena ne prati izmenu.", "A change to your build; the thermal estimate does not follow the change."),
  edge("pallet-osb-dog", "osb-economy-dog-medium", ["osb3", "eps", "plywood-interior"],
    "Kutija od ploča sa izolovanim podom i krovom.", "A panel box with insulated floor and roof.",
    "Potpuna termička procena i manje provere porekla.", "A complete thermal estimate and less origin checking.",
    "Kupovina ploča.", "Buying boards."),
  edge("osb-economy-dog-medium", "insulated-xps-dog-medium", ["plywood-exterior", "xps", "bitumen-membrane", "hinges", "latch"],
    "Šperploča, XPS 50 mm i servisni krov.", "Plywood, 50 mm XPS and a service roof.",
    "Bolja izolacija, servisni pristup.", "Better insulation and service access.",
    "Bez kompajliranog rama.", "No compiled frame."),
  edge("insulated-xps-dog-medium", "alpine-medium-winter", ["plywood-exterior", "xps", "softwood"],
    "Inženjerski model sa ramom i okovom.", "The engineered model with framing and hardware.",
    "Kompletan radionički plan.", "A complete workshop plan.",
    "Radionički alat i viši trošak.", "Workshop tools and a higher cost."),
  edge("scrap-timber-dog-medium", "osb-economy-dog-medium", ["osb3"],
    "OSB ploče umesto stare građe.", "OSB boards instead of old timber.",
    "Poznat materijal i potpuna termička procena.", "A known material and a complete thermal estimate.",
    "Kupovina ploča.", "Buying boards."),
  edge("summer-shade-dog-medium", "raised-sleeping-platform-dog", [],
    "Odvojeno podignuto ležište.", "A separate raised bed.",
    "Ležište koje se premešta u senku tokom dana.", "A bed that moves with the shade during the day.",
    "Nema krova; samo uz senku drveća ili cerade.", "No roof; only with tree or tarp shade.")
];

export function upgradesFrom(slug: string) {
  return upgradeEdges.filter((edgeItem) => edgeItem.from === slug);
}

export function upgradesInto(slug: string) {
  return upgradeEdges.filter((edgeItem) => edgeItem.to === slug);
}

/** Follows NEW_MODEL edges from a start model. Deterministic: first outgoing edge in data order. */
export function upgradeChain(start: string, maxLength = 12): string[] {
  const chain = [start];
  let current = start;
  for (let step = 0; step < maxLength; step++) {
    const next = upgradeEdges.find((edgeItem) => edgeItem.from === current && edgeItem.kind === "NEW_MODEL");
    if (!next?.to || chain.includes(next.to)) break;
    chain.push(next.to);
    current = next.to;
  }
  return chain;
}
