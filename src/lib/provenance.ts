import type {CompiledShelterModel} from "@/lib/compiler";
import {materials} from "@/data/materials";

export function compiledSourceIds(compiled: CompiledShelterModel) {
  const ids = new Set<string>(compiled.model.sourceIds);

  for (const assembly of Object.values(compiled.assemblies)) {
    for (const layer of assembly.layers) {
      for (const sourceId of materials[layer.materialId].sourceIds) {
        ids.add(sourceId);
      }
    }
  }

  ids.add(compiled.hardware.fastenerReferenceSourceId);
  ids.add(compiled.roofWeathering.referenceSourceId);
  if (compiled.heating.zones.length > 0) {
    ids.add(compiled.heating.safetySourceId);
  }

  return Array.from(ids);
}
