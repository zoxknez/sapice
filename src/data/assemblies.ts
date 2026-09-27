export type AssemblyKind = "wall" | "floor" | "roof";
export type LayerRole = "exterior-panel" | "insulation" | "interior-panel";

export type ConstructionLayer = {
  materialId: "plywood" | "xps";
  thicknessMm: number;
  role: LayerRole;
};

export type ConstructionAssembly = {
  id: string;
  kind: AssemblyKind;
  nameSr: string;
  nameEn: string;
  layers: ConstructionLayer[];
};

function wallAssembly(insulationMm: number): ConstructionAssembly {
  return {
    id: `wall-xps-${insulationMm}`,
    kind: "wall",
    nameSr: `Zid · XPS ${insulationMm} mm`,
    nameEn: `Wall · XPS ${insulationMm} mm`,
    layers: [
      {materialId: "plywood", thicknessMm: 12, role: "exterior-panel"},
      {materialId: "xps", thicknessMm: insulationMm, role: "insulation"},
      {materialId: "plywood", thicknessMm: 9, role: "interior-panel"}
    ]
  };
}

function floorAssembly(insulationMm: number): ConstructionAssembly {
  return {
    id: `floor-xps-${insulationMm}`,
    kind: "floor",
    nameSr: `Pod · XPS ${insulationMm} mm`,
    nameEn: `Floor · XPS ${insulationMm} mm`,
    layers: [
      {materialId: "plywood", thicknessMm: 12, role: "exterior-panel"},
      {materialId: "xps", thicknessMm: insulationMm, role: "insulation"},
      {materialId: "plywood", thicknessMm: 12, role: "interior-panel"}
    ]
  };
}

function roofAssembly(insulationMm: number): ConstructionAssembly {
  return {
    id: `roof-xps-${insulationMm}`,
    kind: "roof",
    nameSr: `Krov · XPS ${insulationMm} mm`,
    nameEn: `Roof · XPS ${insulationMm} mm`,
    layers: [
      {materialId: "plywood", thicknessMm: 12, role: "exterior-panel"},
      {materialId: "xps", thicknessMm: insulationMm, role: "insulation"},
      {materialId: "plywood", thicknessMm: 9, role: "interior-panel"}
    ]
  };
}

export const constructionAssemblies: Record<string, ConstructionAssembly> = Object.fromEntries(
  [50, 60]
    .flatMap((insulationMm) => [
      wallAssembly(insulationMm),
      floorAssembly(insulationMm),
      roofAssembly(insulationMm)
    ])
    .map((assembly) => [assembly.id, assembly])
);

export function getAssembly(id: string) {
  const assembly = constructionAssemblies[id];
  if (!assembly) throw new Error(`Unknown construction assembly: ${id}`);
  return assembly;
}

export function assemblyThicknessMm(assembly: ConstructionAssembly) {
  return assembly.layers.reduce((sum, layer) => sum + layer.thicknessMm, 0);
}

export function assemblyInsulationMm(assembly: ConstructionAssembly) {
  return assembly.layers
    .filter((layer) => layer.role === "insulation")
    .reduce((sum, layer) => sum + layer.thicknessMm, 0);
}
