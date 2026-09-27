export type Material = {
  id: "plywood" | "xps";
  nameSr: string;
  nameEn: string;
  lambdaTypicalWmK: number;
  lambdaRangeWmK: [number, number];
  lambdaByThicknessMm?: Record<number, number>;
  sourceIds: string[];
  notesSr: string;
  notesEn: string;
};

export const materials: Record<Material["id"], Material> = {
  plywood: {
    id: "plywood",
    nameSr: "Vodootporna šperploča",
    nameEn: "Exterior plywood",
    lambdaTypicalWmK: 0.17,
    lambdaRangeWmK: [0.10, 0.18],
    sourceIds: ["nord-marine-birch-plywood", "usfs-wood-handbook-2021", "iso-10456-2007"],
    notesSr: "V1 termički proračun koristi 0,17 W/mK kao konzervativnu referencu za birch/marine plywood. Stvarna vrednost zavisi od vrste drveta, gustine i vlage; finalni projekat treba da koristi tehnički list izabrane ploče.",
    notesEn: "The V1 thermal calculation uses 0.17 W/mK as a conservative birch/marine plywood reference. Actual conductivity depends on species, density and moisture; the final build should use the selected panel data sheet."
  },
  xps: {
    id: "xps",
    nameSr: "XPS izolacija",
    nameEn: "XPS insulation",
    lambdaTypicalWmK: 0.033,
    lambdaRangeWmK: [0.031, 0.037],
    lambdaByThicknessMm: {
      50: 0.033,
      60: 0.033
    },
    sourceIds: ["fibran-xps-300", "iso-10456-2007"],
    notesSr: "Za V1 sklopove 50 i 60 mm koristi se λD 0,033 W/mK iz FIBRANxps 300 tehničkog lista. Drugi proizvod mora da zameni ovu vrednost sopstvenim DoP/tehničkim listom.",
    notesEn: "V1 assemblies at 50 and 60 mm use λD 0.033 W/mK from the FIBRANxps 300 technical data sheet. A different product should replace this value with its own DoP/data sheet."
  }
};

export function materialLambda(materialId: Material["id"], thicknessMm: number) {
  const material = materials[materialId];
  return material.lambdaByThicknessMm?.[thicknessMm] ?? material.lambdaTypicalWmK;
}
