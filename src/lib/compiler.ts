import type {ShelterModel} from "@/lib/domain";
import {constructionInterfaceGeometry, constructionSummary, entranceGeometry, framingMethod, getModelAssemblies, heatingProvisionGeometry, layoutGeometry, provisionalIntermediatePositions, roofPanelGeometry, roofSlope, surfaceAreas, thermalSummary, ventilationProvisionGeometry} from "@/lib/engineering";
import {cutGeometryAreaMm2, cutGeometryCutoutPerimeterMm, cutGeometryOuterPerimeterMm} from "@/lib/cut-geometry";
import {materials} from "@/data/materials";
import {deterministicFingerprint} from "@/lib/fingerprint";

export type CutPart = {
  id: string;
  nameSr: string;
  nameEn: string;
  material: "plywood-12" | "plywood-9" | "xps";
  quantity: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  shape: "rectangle" | "trapezoid";
  trapezoidRearHeightMm?: number;
  notesSr?: string;
  notesEn?: string;
  cutouts?: Array<{
    type: "roundedRectangle";
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
    radiusMm: number;
  }>;
};

export type BuildStep = {
  id: string;
  titleSr: string;
  titleEn: string;
  detailSr: string;
  detailEn: string;
};


export type LinearPart = {
  id: string;
  nameSr: string;
  nameEn: string;
  profileMm: [number, number];
  quantity: number;
  lengthMm: number;
  provenance: "ASSUMPTION" | "GEOMETRY";
  wall?: "front" | "rear" | "left" | "right" | "floor" | "roof" | "base" | "divider";
  positionMm?: number;
  positionXmm?: number;
  positionZmm?: number;
  startHeightMm?: number;
  elevationMm?: number;
  notesSr?: string;
  notesEn?: string;
};


export const compilerMethod = {
  version: "1.4.0"
} as const;

export type HardwareItem = {
  id: string;
  nameSr: string;
  nameEn: string;
  quantity: number;
  unit: "piece" | "m";
  provenance: "ASSUMPTION" | "GEOMETRY";
  notesSr: string;
  notesEn: string;
};


function splitInsulationPanel({
  id,
  nameSr,
  nameEn,
  widthMm,
  heightMm,
  thicknessMm,
  notesSr,
  notesEn
}: {
  id: string;
  nameSr: string;
  nameEn: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  notesSr?: string;
  notesEn?: string;
}): CutPart[] {
  // Matches the current XPS planning profile: 1250 × 600 mm,
  // 5 mm perimeter margin and 2 mm kerf.
  const maxPieceWidthMm = 1250 - 2 * 5 - 2;
  const maxPieceHeightMm = 600 - 2 * 5 - 2;
  const columns = Math.max(1, Math.ceil(widthMm / maxPieceWidthMm));
  const rows = Math.max(1, Math.ceil(heightMm / maxPieceHeightMm));
  const segmentWidth = Math.ceil(widthMm / columns);
  const segmentHeight = Math.ceil(heightMm / rows);
  const parts: CutPart[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const remainingWidth = widthMm - column * segmentWidth;
      const remainingHeight = heightMm - row * segmentHeight;
      parts.push({
        id: `${id}-r${row + 1}c${column + 1}`,
        nameSr,
        nameEn,
        material: "xps",
        quantity: 1,
        widthMm: Math.min(segmentWidth, remainingWidth),
        heightMm: Math.min(segmentHeight, remainingHeight),
        thicknessMm,
        shape: "rectangle",
        notesSr,
        notesEn
      });
    }
  }

  return parts;
}

export function compileShelterModel(model: ShelterModel) {
  const construction = constructionSummary(model);
  const assemblies = getModelAssemblies(model);
  const wall = construction.wallThicknessMm;
  const floorThicknessMm = construction.floorThicknessMm;
  const roofThicknessMm = construction.roofThicknessMm;
  const interfaces = constructionInterfaceGeometry(model);
  const internalWidthMm = Math.max(0, model.dimensions.widthMm - 2 * wall);
  const internalDepthMm = Math.max(0, model.dimensions.depthMm - 2 * wall);
  const internalFrontHeightMm = interfaces.wallFrontHeightMm;
  const internalRearHeightMm = interfaces.wallRearHeightMm;
  const roof = roofSlope(model);
  const roofPanel = roofPanelGeometry(model);
  const areas = surfaceAreas(model);
  const thermal = thermalSummary(model);
  const layout = layoutGeometry(model);
  const entrance = entranceGeometry(model);
  const ventilation = ventilationProvisionGeometry(model);
  const heating = heatingProvisionGeometry(model);

  const entranceCutouts = layout.entranceCentersXmm.map((centerX) => {
    return {
      type: "roundedRectangle" as const,
      xMm: Math.round(centerX - model.layout.entranceWidthMm / 2),
      yMm: model.layout.thresholdHeightMm - floorThicknessMm,
      widthMm: entrance.widthMm,
      heightMm: entrance.heightMm,
      radiusMm: entrance.radiusMm
    };
  });

  const cutParts: CutPart[] = [
    {
      id: "floor-outer",
      nameSr: "Donja ploča poda",
      nameEn: "Lower floor panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.depthMm,
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "floor-inner",
      nameSr: "Unutrašnja ploča poda",
      nameEn: "Interior floor panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.depthMm,
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "front-outer",
      nameSr: "Spoljašnja prednja ploča",
      nameEn: "Exterior front panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: Math.round(interfaces.wallFrontHeightMm),
      thicknessMm: 12,
      shape: "rectangle",
      cutouts: entranceCutouts,
      notesSr: "Otvori ulaza su izvedeni iz kanonskog layout-a modela.",
      notesEn: "Entrance cut-outs are derived from the canonical shelter layout."
    },
    {
      id: "rear-outer",
      nameSr: "Spoljašnja zadnja ploča",
      nameEn: "Exterior rear panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: Math.round(interfaces.wallRearHeightMm),
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "side-outer",
      nameSr: "Spoljašnje bočne ploče",
      nameEn: "Exterior side panels",
      material: "plywood-12",
      quantity: 2,
      widthMm: model.dimensions.depthMm,
      heightMm: Math.round(interfaces.wallFrontHeightMm),
      thicknessMm: 12,
      shape: "trapezoid",
      trapezoidRearHeightMm: Math.round(interfaces.wallRearHeightMm),
      notesSr: `Prednja zidna ivica ${Math.round(interfaces.wallFrontHeightMm)} mm; zadnja zidna ivica ${Math.round(interfaces.wallRearHeightMm)} mm. Zid stoji na gotovom podu i završava ispod krovnog sklopa.`,
      notesEn: `Front wall edge ${Math.round(interfaces.wallFrontHeightMm)} mm; rear wall edge ${Math.round(interfaces.wallRearHeightMm)} mm. The wall sits on the finished floor and terminates below the roof assembly.`
    },
    {
      id: "roof-outer",
      nameSr: "Spoljašnja ploča krova",
      nameEn: "Exterior roof panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: Math.ceil(roofPanel.panelWidthMm),
      heightMm: Math.ceil(roofPanel.panelLengthMm),
      thicknessMm: 12,
      shape: "rectangle"
    },
    {
      id: "front-inner",
      nameSr: "Unutrašnja prednja obloga",
      nameEn: "Interior front lining",
      material: "plywood-9",
      quantity: 1,
      widthMm: internalWidthMm,
      heightMm: Math.round(internalFrontHeightMm),
      thicknessMm: 9,
      shape: "rectangle",
      cutouts: entranceCutouts.map((cutout) => ({
        ...cutout,
        xMm: Math.max(0, cutout.xMm - wall),
        yMm: cutout.yMm
      }))
    },
    {
      id: "rear-inner",
      nameSr: "Unutrašnja zadnja obloga",
      nameEn: "Interior rear lining",
      material: "plywood-9",
      quantity: 1,
      widthMm: internalWidthMm,
      heightMm: Math.round(internalRearHeightMm),
      thicknessMm: 9,
      shape: "rectangle"
    },
    {
      id: "side-inner",
      nameSr: "Unutrašnje bočne obloge",
      nameEn: "Interior side linings",
      material: "plywood-9",
      quantity: 2,
      widthMm: internalDepthMm,
      heightMm: Math.round(internalFrontHeightMm),
      thicknessMm: 9,
      shape: "trapezoid",
      trapezoidRearHeightMm: Math.round(internalRearHeightMm),
      notesSr: `Prednja čista ivica ${internalFrontHeightMm} mm; zadnja čista ivica ${internalRearHeightMm} mm.`,
      notesEn: `Front clear edge ${internalFrontHeightMm} mm; rear clear edge ${internalRearHeightMm} mm.`
    },
    {
      id: "roof-inner",
      nameSr: "Unutrašnja obloga krova",
      nameEn: "Interior roof lining",
      material: "plywood-9",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: Math.ceil(roof.trueLengthMm),
      thicknessMm: 9,
      shape: "rectangle"
    },
    ...splitInsulationPanel({
      id: "xps-front",
      nameSr: "XPS prednjeg zida",
      nameEn: "Front-wall XPS",
      widthMm: internalWidthMm,
      heightMm: internalFrontHeightMm,
      thicknessMm: assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0,
      notesSr: "Otvor ulaza obeležiti i iseći posle suvog uklapanja prema kompajliranim otvorima prednje ploče.",
      notesEn: "Trim entrance openings after dry fitting against the compiled front-panel cutouts."
    }),
    ...splitInsulationPanel({
      id: "xps-rear",
      nameSr: "XPS zadnjeg zida",
      nameEn: "Rear-wall XPS",
      widthMm: internalWidthMm,
      heightMm: internalRearHeightMm,
      thicknessMm: assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0
    }),
    ...splitInsulationPanel({
      id: "xps-side-a",
      nameSr: "XPS bočnog zida A",
      nameEn: "Side-wall XPS A",
      widthMm: internalDepthMm,
      heightMm: internalFrontHeightMm,
      thicknessMm: assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0,
      notesSr: `Finalna gornja ivica prati kosinu krova do zadnje visine ${internalRearHeightMm} mm.`,
      notesEn: `Final top edge follows the roof slope down to ${internalRearHeightMm} mm.`
    }),
    ...splitInsulationPanel({
      id: "xps-side-b",
      nameSr: "XPS bočnog zida B",
      nameEn: "Side-wall XPS B",
      widthMm: internalDepthMm,
      heightMm: internalFrontHeightMm,
      thicknessMm: assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0,
      notesSr: `Finalna gornja ivica prati kosinu krova do zadnje visine ${internalRearHeightMm} mm.`,
      notesEn: `Final top edge follows the roof slope down to ${internalRearHeightMm} mm.`
    }),
    ...splitInsulationPanel({
      id: "xps-floor",
      nameSr: "XPS poda",
      nameEn: "Floor XPS",
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.depthMm,
      thicknessMm: assemblies.floor.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0
    }),
    ...splitInsulationPanel({
      id: "xps-roof",
      nameSr: "XPS krova",
      nameEn: "Roof XPS",
      widthMm: model.dimensions.widthMm,
      heightMm: Math.ceil(roof.trueLengthMm),
      thicknessMm: assemblies.roof.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0
    }),
    ...(model.layout.chambers > 1 ? [{
      id: "divider",
      nameSr: "Unutrašnja pregrada",
      nameEn: "Interior divider",
      material: "plywood-12" as const,
      quantity: model.layout.chambers - 1,
      widthMm: internalDepthMm,
      heightMm: internalFrontHeightMm,
      trapezoidRearHeightMm: internalRearHeightMm,
      thicknessMm: model.layout.dividerThicknessMm,
      shape: "trapezoid" as const,
      notesSr: `Prednja čista ivica ${internalFrontHeightMm} mm; zadnja čista ivica ${internalRearHeightMm} mm. Gornju ivicu iseći po kompajliranoj kosini krova.`,
      notesEn: `Front clear edge ${internalFrontHeightMm} mm; rear clear edge ${internalRearHeightMm} mm. Cut the top edge to the compiled roof slope.`
    }] : [])
  ];

  const fabricationMaterialMap = new Map<string, {
    id: string;
    materialId: "plywood" | "xps";
    thicknessMm: number;
    nameSr: string;
    nameEn: string;
    netAreaM2: number;
  }>();

  for (const part of cutParts) {
    const materialId = part.material === "xps" ? "xps" : "plywood";
    const key = `${materialId}-${part.thicknessMm}`;
    const areaM2 =
      (cutGeometryAreaMm2(part) * part.quantity) / 1_000_000;
    const existing = fabricationMaterialMap.get(key);
    const material = materials[materialId];

    if (existing) {
      existing.netAreaM2 += areaM2;
    } else {
      fabricationMaterialMap.set(key, {
        id: key,
        materialId,
        thicknessMm: part.thicknessMm,
        nameSr: `${material.nameSr} · ${part.thicknessMm} mm`,
        nameEn: `${material.nameEn} · ${part.thicknessMm} mm`,
        netAreaM2: areaM2
      });
    }
  }

  const fabricationMaterials = Array.from(fabricationMaterialMap.values())
    .sort((a, b) =>
      a.materialId.localeCompare(b.materialId) ||
      b.thicknessMm - a.thicknessMm
    );

  const wallInsulationMm =
    assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0;
  const frameProfile: [number, number] = [30, wallInsulationMm];
  const baseProfile: [number, number] = [45, 45];
  const maxStudSpacingMm = framingMethod.maxStudSpacingMm;
  const maxFloorJoistSpacingMm = 500;
  const maxRoofRafterSpacingMm = 500;
  const maxBaseRunnerSpacingMm = 700;
  const maxBasePostSpacingMm = 700;

  const baseRunnerCount = Math.max(
    2,
    Math.ceil(model.dimensions.widthMm / maxBaseRunnerSpacingMm)
  );
  const baseRunnerPositionsXmm = Array.from(
    {length: baseRunnerCount},
    (_, index) =>
      model.dimensions.widthMm * ((index + 1) / (baseRunnerCount + 1))
  );
  const baseRunnerParts: LinearPart[] = baseRunnerPositionsXmm.map(
    (positionMm, index) => ({
      id: `base-runner-${index + 1}`,
      nameSr: `Uzdužni nosač baze ${index + 1}`,
      nameEn: `Base runner ${index + 1}`,
      profileMm: baseProfile,
      quantity: 1,
      lengthMm: model.dimensions.depthMm,
      provenance: "ASSUMPTION" as const,
      wall: "base" as const,
      positionMm,
      notesSr: `Pozicija je izvedena iz V1 maksimalnog razmaka oslonaca ≈ ${maxBaseRunnerSpacingMm} mm.`,
      notesEn: `Position is derived from the V1 maximum base-support spacing of ≈ ${maxBaseRunnerSpacingMm} mm.`
    })
  );

  const basePostRowCount = Math.max(
    2,
    Math.ceil(model.dimensions.depthMm / maxBasePostSpacingMm)
  );
  const baseSupportPositionsZmm = Array.from(
    {length: basePostRowCount},
    (_, index) =>
      model.dimensions.depthMm * ((index + 1) / (basePostRowCount + 1))
  );
  const baseSupportPostHeightMm = Math.max(
    1,
    model.dimensions.groundClearanceMm - baseProfile[1]
  );
  const baseSupportPostParts: LinearPart[] = baseRunnerPositionsXmm.flatMap(
    (positionXmm, runnerIndex) =>
      baseSupportPositionsZmm.map((positionZmm, rowIndex) => ({
        id: `base-post-${runnerIndex + 1}-${rowIndex + 1}`,
        nameSr: `Vertikalni oslonac baze ${runnerIndex + 1}.${rowIndex + 1}`,
        nameEn: `Base support post ${runnerIndex + 1}.${rowIndex + 1}`,
        profileMm: baseProfile,
        quantity: 1,
        lengthMm: baseSupportPostHeightMm,
        provenance: "ASSUMPTION" as const,
        wall: "base" as const,
        positionXmm,
        positionZmm,
        notesSr: "V1 support grid podiže runner do donje strane poda. Materijal u kontaktu sa tlom, stopica i sidrenje ostaju za engineering/site review.",
        notesEn: "The V1 support grid raises the runner to the floor underside. Ground-contact material, footing and anchorage remain subject to engineering/site review."
      }))
  );

  const floorJoistCount = Math.max(
    0,
    Math.ceil(model.dimensions.depthMm / maxFloorJoistSpacingMm) - 1
  );
  const floorJoistPositionsZmm = Array.from(
    {length: floorJoistCount},
    (_, index) =>
      model.dimensions.depthMm * ((index + 1) / (floorJoistCount + 1))
  );
  const floorJoistParts: LinearPart[] = floorJoistPositionsZmm.map(
    (positionMm, index) => ({
      id: `floor-joist-${index + 1}`,
      nameSr: `Međuprečka poda ${index + 1}`,
      nameEn: `Floor intermediate joist ${index + 1}`,
      profileMm: frameProfile,
      quantity: 1,
      lengthMm: Math.max(
        1,
        model.dimensions.widthMm - 2 * frameProfile[0]
      ),
      provenance: "ASSUMPTION" as const,
      wall: "floor" as const,
      positionMm,
      notesSr: `Pozicija prati V1 maksimalni osni razmak ≈ ${maxFloorJoistSpacingMm} mm.`,
      notesEn: `Position follows the V1 maximum center spacing of ≈ ${maxFloorJoistSpacingMm} mm.`
    })
  );

  const roofRafterCount = Math.max(
    0,
    Math.ceil(model.dimensions.widthMm / maxRoofRafterSpacingMm) - 1
  );
  const roofRafterPositionsXmm = Array.from(
    {length: roofRafterCount},
    (_, index) =>
      model.dimensions.widthMm * ((index + 1) / (roofRafterCount + 1))
  );
  const roofRafterParts: LinearPart[] = roofRafterPositionsXmm.map(
    (positionMm, index) => ({
      id: `roof-rafter-${index + 1}`,
      nameSr: `Kosi nosač krova ${index + 1}`,
      nameEn: `Roof rafter ${index + 1}`,
      profileMm: frameProfile,
      quantity: 1,
      lengthMm: Math.round(roof.trueLengthMm),
      provenance: "ASSUMPTION" as const,
      wall: "roof" as const,
      positionMm,
      notesSr: `Pozicija prati V1 maksimalni osni razmak ≈ ${maxRoofRafterSpacingMm} mm.`,
      notesEn: `Position follows the V1 maximum center spacing of ≈ ${maxRoofRafterSpacingMm} mm.`
    })
  );

  const clearStudHeightAtDepth = (positionMm: number) => {
    const ratio =
      model.dimensions.depthMm === 0
        ? 0
        : positionMm / model.dimensions.depthMm;
    const wallHeightMm =
      interfaces.wallFrontHeightMm +
      (interfaces.wallRearHeightMm - interfaces.wallFrontHeightMm) * ratio;
    return Math.max(1, Math.round(wallHeightMm));
  };

  const rearIntermediatePositionsMm = provisionalIntermediatePositions(
    model.dimensions.widthMm,
    maxStudSpacingMm
  );
  const rearIntermediateStuds: LinearPart[] = rearIntermediatePositionsMm.map(
    (positionMm, index) => ({
      id: `rear-stud-${index + 1}`,
      nameSr: "Međustub zadnjeg zida",
      nameEn: "Rear-wall intermediate stud",
      profileMm: frameProfile,
      quantity: 1,
      lengthMm: internalRearHeightMm,
      provenance: "ASSUMPTION" as const,
      wall: "rear" as const,
      positionMm,
      notesSr: `Pozicija je izvedena iz V1 maksimalnog osnog razmaka ≈ ${maxStudSpacingMm} mm.`,
      notesEn: `Position is derived from the V1 maximum stud spacing of ≈ ${maxStudSpacingMm} mm.`
    })
  );

  const sideIntermediatePositionsMm = provisionalIntermediatePositions(
    model.dimensions.depthMm,
    maxStudSpacingMm
  );
  const sideIntermediateStuds: LinearPart[] = ["left", "right"].flatMap((wallSide) =>
    sideIntermediatePositionsMm.map((positionMm, index) => ({
      id: `${wallSide}-stud-${index + 1}`,
      nameSr: "Međustub bočnog zida",
      nameEn: "Side-wall intermediate stud",
      profileMm: frameProfile,
      quantity: 1,
      lengthMm: clearStudHeightAtDepth(positionMm),
      provenance: "ASSUMPTION" as const,
      wall: wallSide as "left" | "right",
      positionMm,
      notesSr: `Pozicija prati V1 maksimalni osni razmak ≈ ${maxStudSpacingMm} mm; dužina prati kosinu krova.`,
      notesEn: `Position follows the V1 maximum stud spacing of ≈ ${maxStudSpacingMm} mm; length follows the roof slope.`
    }))
  );

  const entranceSillAboveFinishedFloorMm =
    model.layout.thresholdHeightMm - floorThicknessMm;

  const entranceSupportPositionsXmm = Array.from(
    new Set(
      layout.entranceCentersXmm.flatMap((centerMm) => [
        centerMm - model.layout.entranceWidthMm / 2,
        centerMm,
        centerMm + model.layout.entranceWidthMm / 2
      ])
    )
  ).sort((a, b) => a - b);

  const entranceFrameParts: LinearPart[] = layout.entranceCentersXmm.flatMap(
    (centerMm, index) => {
      const leftXmm = centerMm - model.layout.entranceWidthMm / 2;
      const rightXmm = centerMm + model.layout.entranceWidthMm / 2;
      const supportLengthMm =
        entranceSillAboveFinishedFloorMm + model.layout.entranceHeightMm;

      const headerElevationMm = supportLengthMm + frameProfile[0] / 2;
      const crippleStartHeightMm = supportLengthMm + frameProfile[0];
      const crippleLengthMm = Math.max(
        1,
        Math.round(
          interfaces.wallFrontHeightMm -
            crippleStartHeightMm -
            frameProfile[0]
        )
      );

      return [
        {
          id: `entrance-${index + 1}-left-support`,
          nameSr: `Levo vertikalno ojačanje ulaza ${index + 1}`,
          nameEn: `Entrance ${index + 1} left vertical support`,
          profileMm: frameProfile,
          quantity: 1,
          lengthMm: supportLengthMm,
          provenance: "GEOMETRY" as const,
          wall: "front" as const,
          positionMm: leftXmm,
          startHeightMm: 0
        },
        {
          id: `entrance-${index + 1}-right-support`,
          nameSr: `Desno vertikalno ojačanje ulaza ${index + 1}`,
          nameEn: `Entrance ${index + 1} right vertical support`,
          profileMm: frameProfile,
          quantity: 1,
          lengthMm: supportLengthMm,
          provenance: "GEOMETRY" as const,
          wall: "front" as const,
          positionMm: rightXmm,
          startHeightMm: 0
        },
        {
          id: `entrance-${index + 1}-header`,
          nameSr: `Gornje ojačanje ulaza ${index + 1}`,
          nameEn: `Entrance ${index + 1} header`,
          profileMm: frameProfile,
          quantity: 1,
          lengthMm: model.layout.entranceWidthMm + 2 * frameProfile[0],
          provenance: "GEOMETRY" as const,
          wall: "front" as const,
          positionMm: centerMm,
          elevationMm: headerElevationMm
        },
        {
          id: `entrance-${index + 1}-cripple`,
          nameSr: `Kratki stub iznad ulaza ${index + 1}`,
          nameEn: `Entrance ${index + 1} cripple stud`,
          profileMm: frameProfile,
          quantity: 1,
          lengthMm: crippleLengthMm,
          provenance: "GEOMETRY" as const,
          wall: "front" as const,
          positionMm: centerMm,
          startHeightMm: crippleStartHeightMm
        }
      ];
    }
  );

  const linearParts: LinearPart[] = [
    ...baseRunnerParts,
    ...baseSupportPostParts,
    {
      id: "floor-frame-long",
      nameSr: "Uzdužne letve rama poda",
      nameEn: "Floor frame long rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: model.dimensions.depthMm,
      provenance: "GEOMETRY",
      wall: "floor"
    },
    {
      id: "floor-frame-short",
      nameSr: "Poprečne letve rama poda",
      nameEn: "Floor frame cross rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, model.dimensions.widthMm - 2 * frameProfile[0]),
      provenance: "GEOMETRY",
      wall: "floor"
    },
    {
      id: "front-rear-bottom-rail",
      nameSr: "Donje letve prednjeg/zadnjeg zida",
      nameEn: "Front/rear lower rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: model.dimensions.widthMm,
      provenance: "GEOMETRY"
    },
    {
      id: "front-rear-top-rail",
      nameSr: "Gornje letve prednjeg/zadnjeg zida",
      nameEn: "Front/rear upper rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: model.dimensions.widthMm,
      provenance: "GEOMETRY"
    },
    {
      id: "side-bottom-rail",
      nameSr: "Donje letve bočnih zidova",
      nameEn: "Side-wall lower rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: model.dimensions.depthMm,
      provenance: "GEOMETRY"
    },
    {
      id: "side-top-rail",
      nameSr: "Kose gornje letve bočnih zidova",
      nameEn: "Sloped side-wall upper rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.round(roof.trueLengthMm),
      provenance: "GEOMETRY",
      notesSr: "Dužina prati stvarnu kosinu od prednje do zadnje ravni zida, bez krovnih prepusta.",
      notesEn: "Length follows the true wall-top slope from front to rear wall plane, excluding roof overhangs."
    },
    {
      id: "corner-front",
      nameSr: "Prednje ugaone letve",
      nameEn: "Front corner studs",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, Math.round(interfaces.wallFrontHeightMm)),
      provenance: "GEOMETRY"
    },
    {
      id: "corner-rear",
      nameSr: "Zadnje ugaone letve",
      nameEn: "Rear corner studs",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, Math.round(interfaces.wallRearHeightMm)),
      provenance: "GEOMETRY"
    },
    ...entranceFrameParts,
    ...(model.layout.chambers > 1 ? [
      {
        id: "divider-cleat-front",
        nameSr: "Prednje letve unutrašnjih pregrada",
        nameEn: "Front divider cleats",
        profileMm: frameProfile,
        quantity: model.layout.chambers - 1,
        lengthMm: internalFrontHeightMm,
        provenance: "GEOMETRY" as const,
        wall: "divider" as const,
        notesSr: "Po jedna prednja vertikalna letva za svaku pregradu.",
        notesEn: "One front vertical cleat for each divider."
      },
      {
        id: "divider-cleat-rear",
        nameSr: "Zadnje letve unutrašnjih pregrada",
        nameEn: "Rear divider cleats",
        profileMm: frameProfile,
        quantity: model.layout.chambers - 1,
        lengthMm: internalRearHeightMm,
        provenance: "GEOMETRY" as const,
        wall: "divider" as const,
        notesSr: "Po jedna zadnja vertikalna letva za svaku pregradu.",
        notesEn: "One rear vertical cleat for each divider."
      }
    ] : []),
    ...rearIntermediateStuds,
    ...sideIntermediateStuds,
    ...floorJoistParts,
    ...roofRafterParts
  ];

  const framing = {
    status: "PROVISIONAL" as const,
    frameProfileMm: frameProfile,
    baseProfileMm: baseProfile,
    maxStudSpacingMm,
    maxFloorJoistSpacingMm,
    maxRoofRafterSpacingMm,
    maxBaseRunnerSpacingMm,
    maxBasePostSpacingMm,
    baseRunnerPositionsXmm,
    baseSupportPositionsZmm,
    baseSupportPostHeightMm,
    floorJoistPositionsZmm,
    roofRafterPositionsXmm,
    frontSupportPositionsXmm: entranceSupportPositionsXmm,
    totalLinearM: linearParts.reduce(
      (sum, part) => sum + (part.quantity * part.lengthMm) / 1000,
      0
    )
  };

  const panelParts = cutParts.filter((part) => part.material !== "xps");
  const fastenerEdgeSpacingMm = 150;
  const fastenerFieldSpacingMm = 300;
  const estimatedPanelFasteners = panelParts.reduce((sum, part) => {
    const edgeCount = Math.ceil(
      cutGeometryOuterPerimeterMm(part) / fastenerEdgeSpacingMm
    );
    const fieldCount = Math.ceil(
      cutGeometryAreaMm2(part) /
      (fastenerFieldSpacingMm * fastenerFieldSpacingMm)
    );
    const cutoutCount = Math.ceil(
      cutGeometryCutoutPerimeterMm(part) / fastenerEdgeSpacingMm
    );

    return sum + part.quantity * (edgeCount + fieldCount + cutoutCount);
  }, 0);

  const hingeCount =
    model.maintenance.roofAccess === "HINGED"
      ? model.dimensions.widthMm <= 800
        ? 2
        : model.dimensions.widthMm <= 1500
          ? 3
          : 4
      : 0;

  const hingePositionsAcrossRoofMm = Array.from(
    {length: hingeCount},
    (_, index) =>
      roofPanel.panelWidthMm * ((index + 1) / (hingeCount + 1))
  );

  const latchCount = model.maintenance.roofAccess === "HINGED" ? 2 : 0;
  const latchPositionsAcrossRoofMm = Array.from(
    {length: latchCount},
    (_, index) =>
      roofPanel.panelWidthMm * ((index + 1) / (latchCount + 1))
  );

  const roofWeathering = {
    status: "PRODUCT_SPECIFIC" as const,
    referenceSourceId: "owens-corning-roof-installation",
    highEdge: "FRONT" as const,
    runoffEdge: "REAR" as const,
    runoffAwayFromEntrances: true,
    slopeDegrees: (roof.angleRad * 180) / Math.PI,
    riseMm: model.dimensions.frontHeightMm - model.dimensions.rearHeightMm,
    runMm: model.dimensions.depthMm,
    ratioRisePerRun: model.dimensions.depthMm > 0
      ? (model.dimensions.frontHeightMm - model.dimensions.rearHeightMm) /
        model.dimensions.depthMm
      : 0,
    rearDripEdgeLengthM: roofPanel.panelWidthMm / 1000,
    fullEdgeProtectionLengthM:
      (2 * (roofPanel.panelWidthMm + roofPanel.panelLengthMm)) / 1000,
    requirements: [
      "Verify selected roof-covering minimum slope and substrate requirements",
      "Follow product-specific overlap and fastening instructions",
      "Protect exposed roof-panel edges against water ingress",
      "Keep the low rear runoff edge clear so water sheds away from front entrances",
      "Re-check water shedding after hinge and service-seal installation"
    ]
  };

  const hardwareItems: HardwareItem[] = ([
    {
      id: "base-isolation-pads",
      nameSr: "Stopice / izolacioni podmetači baze",
      nameEn: "Base isolation pads / feet",
      quantity: baseSupportPostParts.length,
      unit: "piece",
      provenance: "ASSUMPTION",
      notesSr: "Po jedna stopica ili odgovarajući izolacioni podmetač ispod svakog V1 vertikalnog oslonca, da drvo ne stoji direktno na mokroj podlozi. Konkretan proizvod, sidrenje i nosivost zavise od lokacije i podloge.",
      notesEn: "One suitable isolation foot or pad below each V1 vertical support so timber does not bear directly on wet ground. Product selection, anchorage and capacity depend on the actual site and substrate."
    },
    {
      id: "panel-fasteners",
      nameSr: "Spoljašnji pričvršćivači za drvene ploče",
      nameEn: "Exterior wood-panel fasteners",
      quantity: estimatedPanelFasteners,
      unit: "piece",
      provenance: "ASSUMPTION",
      notesSr: "V1 procena koristi približno 150 mm razmaka na ivicama i 300 mm u polju kao referentni početni obrazac. Konačan prečnik, dužina i raspored ostaju za engineering review.",
      notesEn: "V1 estimate uses approximately 150 mm edge spacing and 300 mm field spacing as a reference starting pattern. Final diameter, length and schedule remain subject to engineering review."
    },
    ...(hingeCount > 0 ? [{
      id: "roof-hinges",
      nameSr: "Spoljne šarke krova",
      nameEn: "Exterior roof hinges",
      quantity: hingeCount,
      unit: "piece" as const,
      provenance: "ASSUMPTION" as const,
      notesSr: "Broj se izvodi iz širine krova; finalni tip šarke i nosivost proveriti pre ENGINEERING_REVIEWED statusa.",
      notesEn: "Count is derived from roof width; verify final hinge type and load capacity before ENGINEERING_REVIEWED status."
    }] : []),
    {
      id: "roof-latches",
      nameSr: "Zatvarači krova",
      nameEn: "Roof latches",
      quantity: latchCount,
      unit: "piece",
      provenance: "ASSUMPTION",
      notesSr: "Predviđeni za bezbedno zatvaranje servisnog krova protiv vetra.",
      notesEn: "Intended to secure the service roof against wind uplift."
    },
    {
      id: "roof-edge-weathering-profile",
      nameSr: "Krovna ivica / drip zaštita",
      nameEn: "Roof edge / drip protection",
      quantity: roofWeathering.fullEdgeProtectionLengthM,
      unit: "m",
      provenance: "ASSUMPTION",
      notesSr: "Planerska dužina kompletnog oboda krovnog panela. Finalni profil, redosled slojeva i detalj niske zadnje ivice moraju pratiti izabrani krovni sistem.",
      notesEn: "Planning length for the full roof-panel perimeter. Final profile, layer order and low rear-edge detail must follow the selected roofing system."
    },
    {
      id: "roof-weather-seal",
      nameSr: "Zaptivna traka servisnog krova",
      nameEn: "Service-roof weather seal",
      quantity: (2 * (model.dimensions.widthMm + model.dimensions.depthMm)) / 1000,
      unit: "m",
      provenance: "GEOMETRY",
      notesSr: "Dužina je izvedena iz perimetra kućice; finalni profil zaptivke bira se prema detalju spoja.",
      notesEn: "Length is derived from shelter perimeter; final seal profile depends on the joint detail."
    },
    ...(model.heated ? [{
      id: "protected-cable-entry",
      nameSr: "Zaštićen uvod kabla",
      nameEn: "Protected cable entry",
      quantity: heating.zones.length,
      unit: "piece" as const,
      provenance: "ASSUMPTION" as const,
      notesSr: "Samo za namenski pet-heating proizvod i prema njegovom uputstvu; aplikacija ne definiše DIY mrežno ožičenje.",
      notesEn: "Only for a purpose-built pet-heating product and its instructions; the app does not specify DIY mains wiring."
    }] : [])
  ] satisfies HardwareItem[]).filter((item) => item.quantity > 0);

  const hardware = {
    status: "PROVISIONAL" as const,
    fastenerReferenceSourceId: "apa-panel-fastening-n335",
    edgeSpacingMm: fastenerEdgeSpacingMm,
    fieldSpacingMm: fastenerFieldSpacingMm,
    edgeOffsetMm: 10,
    panelJointGapMm: 3,
    hingeEdge: model.maintenance.hingeEdge,
    hingePositionsAcrossRoofMm,
    latchPositionsAcrossRoofMm,
    latchEdge:
      model.maintenance.hingeEdge === "REAR"
        ? "FRONT"
        : model.maintenance.hingeEdge === "LEFT"
          ? "RIGHT"
          : model.maintenance.hingeEdge === "RIGHT"
            ? "LEFT"
            : null
  };

  const buildSteps: BuildStep[] = [
    {
      id: "base",
      titleSr: "Napravite podignutu bazu",
      titleEn: "Build the raised base",
      detailSr: "Sastavite kompajliranu mrežu vertikalnih oslonaca i horizontalnih runner-a. Ispod svakog oslonca koristite odgovarajuću stopicu/podmetač koji odvaja drvo od mokre podloge; konkretno sidrenje i oslonac prilagodite stvarnoj lokaciji.",
      detailEn: "Assemble the compiled grid of vertical supports and horizontal runners. Use a suitable isolation foot/pad below each support to keep timber off wet ground; adapt anchorage and bearing details to the actual site."
    },
    {
      id: "floor",
      titleSr: "Sastavite izolovani pod",
      titleEn: "Assemble the insulated floor",
      detailSr: "Zatvorite izolaciju između donje i unutrašnje ploče tako da životinja ne može da joj pristupi.",
      detailEn: "Enclose the insulation between lower and interior floor panels so the animal cannot access it."
    },
    {
      id: "walls",
      titleSr: "Sastavite zidove i ulaze",
      titleEn: "Assemble walls and entrances",
      detailSr: "Koristite dimenzije ulaza iz modela i zaštitite sve rezane ivice.",
      detailEn: "Use the model entrance dimensions and protect every cut edge."
    },
    {
      id: "ventilation-provision",
      titleSr: "Sačuvajte high-rear zone za ventilacione umetke",
      titleEn: "Reserve the high-rear ventilation insert zones",
      detailSr: "Prenesite kompajlirane PROVISIONAL zone na zadnji zid i držite ih van stubova. Ne secite finalni otvor dok nije izabran konkretan podesivi ventilacioni umetak; njegov cutout i net free area određuje proizvođač.",
      detailEn: "Transfer the compiled PROVISIONAL zones to the rear wall and keep them clear of studs. Do not cut the final opening until a specific adjustable vent insert is selected; its cutout and net free area are product-specific."
    },
    {
      id: "insulation",
      titleSr: "Ugradite izolaciju i unutrašnje obloge",
      titleEn: "Install insulation and interior linings",
      detailSr: "Suvo uklopite XPS, zatvorite ga unutrašnjim oblogama i proverite da nijedna ivica izolacije nije dostupna životinji.",
      detailEn: "Dry-fit the XPS, enclose it with the interior linings and confirm that no insulation edge is accessible to the animal."
    },
    ...(model.layout.chambers > 1 ? [{
      id: "dividers",
      titleSr: "Ugradite unutrašnje pregrade",
      titleEn: "Install interior dividers",
      detailSr: "Postavite pregrade po osi između odgovarajućih ulaza, proverite stabilnost i zatvorite sve oštre ivice.",
      detailEn: "Position dividers on the axes between the corresponding entrances, verify stability and seal every sharp edge."
    }] : []),
    {
      id: "roof",
      titleSr: "Montirajte krov i hidroizolaciju",
      titleEn: "Install roof and waterproofing",
      detailSr: "Krov pada od prednje ka zadnjoj ivici, pa zadnja ivica služi kao prirodni runoff. Izaberite krovni sistem koji eksplicitno dozvoljava kompajlirani nagib, pratite njegovo uputstvo za slojeve/preklop i izvedite drip/edge zaštitu tako da voda odlazi iza kućice, dalje od ulaza.",
      detailEn: "The roof falls from front to rear, making the rear edge the natural runoff edge. Select a roofing system that explicitly permits the compiled slope, follow its layer/overlap instructions and detail edge/drip protection so water sheds behind the shelter, away from entrances."
    },
    ...(model.heated ? [{
      id: "heating",
      titleSr: "Ugradite kompatibilan namenski grejni proizvod",
      titleEn: "Install a compatible purpose-built heating product",
      detailSr: "Poštujte isključivo uputstvo proizvođača grejnog proizvoda; mrežni adapter i nezaštićeni spojevi ne pripadaju prostoru životinje.",
      detailEn: "Follow the heating product manufacturer instructions; mains adapters and unprotected connections do not belong in the animal space."
    }] : []),
    {
      id: "inspection",
      titleSr: "Uradite završnu bezbednosnu proveru",
      titleEn: "Perform the final safety inspection",
      detailSr: "Proverite stabilnost, oštre ivice, prodor vode, ventilaciju, ulaze i suvoću unutrašnjosti.",
      detailEn: "Check stability, sharp edges, water ingress, ventilation, entrances and interior dryness."
    }
  ];

  const planFingerprint = deterministicFingerprint({
    compilerVersion: compilerMethod.version,
    model,
    interfaces,
    layout,
    entrance,
    ventilation,
    heating,
    construction,
    roof,
    roofPanel,
    areas,
    thermal,
    cutParts,
    fabricationMaterials,
    linearParts,
    framing,
    hardwareItems,
    hardware,
    roofWeathering,
    buildSteps
  });

  return {
    compilerVersion: compilerMethod.version,
    planFingerprint,
    model,
    interfaces,
    layout,
    entrance,
    ventilation,
    heating,
    assemblies,
    construction,
    internal: {
      widthMm: internalWidthMm,
      depthMm: internalDepthMm,
      frontHeightMm: internalFrontHeightMm,
      rearHeightMm: internalRearHeightMm,
      averageHeightMm: (internalFrontHeightMm + internalRearHeightMm) / 2,
      usableFloorAreaM2:
        (Math.max(0, internalWidthMm - layout.totalDividerThicknessMm) * internalDepthMm) /
        1_000_000,
      usableVolumeM3:
        (
          Math.max(0, internalWidthMm - layout.totalDividerThicknessMm) *
          internalDepthMm *
          ((internalFrontHeightMm + internalRearHeightMm) / 2)
        ) / 1_000_000_000,
      chamberClearWidthMm: layout.chamberWidthMm,
      entranceSillAboveFinishedFloorMm,
      floorAreaPerRecommendedAnimalM2:
        (
          Math.max(0, internalWidthMm - layout.totalDividerThicknessMm) *
          internalDepthMm
        ) /
        1_000_000 /
        model.capacity.recommended,
      floorAreaPerMaxAnimalM2:
        (
          Math.max(0, internalWidthMm - layout.totalDividerThicknessMm) *
          internalDepthMm
        ) /
        1_000_000 /
        model.capacity.max
    },
    roof,
    roofPanel,
    areas,
    thermal,
    cutParts,
    fabricationMaterials,
    linearParts,
    framing,
    hardwareItems,
    hardware,
    roofWeathering,
    buildSteps
  };
}

export type CompiledShelterModel = ReturnType<typeof compileShelterModel>;
