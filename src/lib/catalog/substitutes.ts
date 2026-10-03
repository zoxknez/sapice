import {getLibraryMaterial, type LibraryMaterial} from "@/data/material-library";

export type SubstituteRole = "INSULATION" | "SHEET" | "ANIMAL_FACING_LINING" | "ROOF_COVERING" | "BEDDING";

export type SubstituteResult =
  | {
      kind: "THERMAL_EQUIVALENT";
      fromId: string;
      toId: string;
      /** Layer resistance of the original layer with planning λ. */
      targetRm2KW: number;
      /** Thickness of the substitute for approximately the same layer R with its planning λ. */
      requiredThicknessMm: number;
      /** Thickness needed if the substitute performs at the poor end of its sourced range. */
      conservativeThicknessMm: number | null;
      caveatsSr: string[];
      caveatsEn: string[];
    }
  | {
      kind: "REDESIGN_REQUIRED";
      fromId: string;
      toId: string;
      reasonSr: string;
      reasonEn: string;
    }
  | {
      kind: "NOT_ALLOWED";
      fromId: string;
      toId: string;
      reasonSr: string;
      reasonEn: string;
    };

const commonCaveatsSr = [
  "Termička ekvivalencija nije konstrukciona ekvivalencija.",
  "Otpornost na vodu može biti drugačija.",
  "Ponašanje pod pritiskom može biti drugačije.",
  "Propustljivost za vodenu paru može biti drugačija.",
  "Detalji spojeva i pričvršćivanja mogu morati da se promene.",
  "Tehnički list izabranog proizvoda ima prednost nad planskom vrednošću."
];

const commonCaveatsEn = [
  "Thermal equivalence is not structural equivalence.",
  "Water resistance can differ.",
  "Compressive behaviour can differ.",
  "Vapour behaviour can differ.",
  "Joint and fixing details may need to change.",
  "The selected product datasheet takes precedence over the planning value."
];

/** R = d / λ with d in metres. */
export function layerResistance(thicknessMm: number, lambdaWmK: number) {
  return thicknessMm / 1000 / lambdaWmK;
}

/** Thickness in mm needed to reach `rTarget` with conductivity λ, rounded up to whole mm. */
export function thicknessForResistance(rTarget: number, lambdaWmK: number) {
  return Math.ceil(rTarget * lambdaWmK * 1000);
}

function isFibrous(material: LibraryMaterial) {
  return material.category === "FIBROUS_INSULATION";
}

export function evaluateSubstitute(
  fromId: string,
  toId: string,
  role: SubstituteRole,
  thicknessMm: number,
  options: {fullyEnclosedAssembly?: boolean} = {}
): SubstituteResult {
  const from = getLibraryMaterial(fromId);
  const to = getLibraryMaterial(toId);

  if (role === "ANIMAL_FACING_LINING" && to.animalFacing !== "ALLOWED") {
    return {
      kind: "NOT_ALLOWED",
      fromId,
      toId,
      reasonSr: `${to.nameSr} ne sme biti površina koju životinja dodiruje ili gricka.`,
      reasonEn: `${to.nameEn} must not be a surface the animal touches or chews.`
    };
  }

  if (isFibrous(to) && !options.fullyEnclosedAssembly) {
    return {
      kind: "NOT_ALLOWED",
      fromId,
      toId,
      reasonSr: `${to.nameSr} je dozvoljena samo u potpuno zatvorenom sklopu sa oblogom sa obe strane; ovaj sklop to ne obezbeđuje.`,
      reasonEn: `${to.nameEn} is only allowed in a fully enclosed assembly lined on both sides; this assembly does not provide that.`
    };
  }

  if (role === "INSULATION") {
    if (from.thermal.status !== "KNOWN" || to.thermal.status !== "KNOWN") {
      return {
        kind: "REDESIGN_REQUIRED",
        fromId,
        toId,
        reasonSr: "Moguća zamena koja zahteva redizajn: bar jedan materijal nema izvorovanu toplotnu provodljivost, pa se ekvivalentna debljina ne može izračunati.",
        reasonEn: "Possible substitute requiring redesign: at least one material has no sourced thermal conductivity, so an equivalent thickness cannot be calculated."
      };
    }
    const targetRm2KW = layerResistance(thicknessMm, from.thermal.lambdaPlanningWmK);
    const requiredThicknessMm = thicknessForResistance(targetRm2KW, to.thermal.lambdaPlanningWmK);
    const conservativeLambda = to.thermal.lambdaRangeWmK ? Math.max(...to.thermal.lambdaRangeWmK) : null;
    return {
      kind: "THERMAL_EQUIVALENT",
      fromId,
      toId,
      targetRm2KW: Math.round(targetRm2KW * 1000) / 1000,
      requiredThicknessMm,
      conservativeThicknessMm: conservativeLambda ? thicknessForResistance(targetRm2KW, conservativeLambda) : null,
      caveatsSr: [
        ...commonCaveatsSr,
        ...(to.animalFacing !== "ALLOWED" ? [`${to.nameSr} mora ostati iza zaštitne obloge.`] : [])
      ],
      caveatsEn: [
        ...commonCaveatsEn,
        ...(to.animalFacing !== "ALLOWED" ? [`${to.nameEn} must stay behind a protective lining.`] : [])
      ]
    };
  }

  return {
    kind: "REDESIGN_REQUIRED",
    fromId,
    toId,
    reasonSr: "Zamena menja konstrukciju (debljinu, nosivost ili zaštitu od vode); delove i spojeve treba ponovo isplanirati.",
    reasonEn: "The substitute changes the construction (thickness, strength or water protection); parts and joints must be re-planned."
  };
}

/** Candidate substitutes per material id. Order is deterministic and meaningful (closest first). */
export const substituteCandidates: Record<string, readonly string[]> = {
  xps: ["eps", "pir", "cork-board", "wood-fibre-board", "mineral-wool"],
  eps: ["xps", "pir", "cork-board", "wood-fibre-board"],
  pir: ["xps", "eps"],
  "plywood-exterior": ["osb3", "osb4"],
  osb3: ["osb4", "plywood-exterior"],
  osb4: ["osb3", "plywood-exterior"],
  "plywood-interior": ["plywood-exterior", "osb3", "vinyl-surface"],
  "bitumen-membrane": ["epdm", "roofing-felt", "galvanized-sheet"],
  "roofing-felt": ["bitumen-membrane", "epdm"],
  "plastic-tote": ["eps-shipping-box", "pet-carrier"],
  pallet: ["scrap-lumber", "osb3"],
  "scrap-lumber": ["pallet", "osb3", "softwood"]
};

export function substituteRoleFor(materialId: string): SubstituteRole {
  const material = getLibraryMaterial(materialId);
  if (material.insulationRole === "PRIMARY") return "INSULATION";
  if (material.category === "MEMBRANE" || material.category === "ROOF_COVERING") return "ROOF_COVERING";
  if (material.category === "BEDDING_FILL") return "BEDDING";
  return "SHEET";
}
