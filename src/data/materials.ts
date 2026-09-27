export type Material = {
  id: string;
  nameSr: string;
  nameEn: string;
  lambdaTypicalWmK: number;
  lambdaRangeWmK: [number, number];
  notesSr: string;
  notesEn: string;
};

export const materials: Record<string, Material> = {
  plywood: {
    id: "plywood",
    nameSr: "Vodootporna šperploča",
    nameEn: "Exterior plywood",
    lambdaTypicalWmK: 0.13,
    lambdaRangeWmK: [0.11, 0.17],
    notesSr: "Projektantska vrednost zavisi od vrste drveta, gustine i vlage.",
    notesEn: "Design value varies with wood species, density and moisture."
  },
  xps: {
    id: "xps",
    nameSr: "XPS izolacija",
    nameEn: "XPS insulation",
    lambdaTypicalWmK: 0.034,
    lambdaRangeWmK: [0.029, 0.038],
    notesSr: "Koristiti tehnički list konkretnog proizvoda za finalni proračun.",
    notesEn: "Use the selected product data sheet for the final calculation."
  }
};
