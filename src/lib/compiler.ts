import type {ShelterModel} from "@/lib/domain";
import {constructionSummary, getModelAssemblies, layoutGeometry, roofPanelGeometry, roofSlope, surfaceAreas, thermalSummary} from "@/lib/engineering";

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
  notes?: string;
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
  wall?: "front" | "rear" | "left" | "right" | "floor" | "base" | "divider";
  positionMm?: number;
  notesSr?: string;
  notesEn?: string;
};


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
  notes
}: {
  id: string;
  nameSr: string;
  nameEn: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  notes?: string;
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
        notes
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
  const internalWidthMm = Math.max(0, model.dimensions.widthMm - 2 * wall);
  const internalDepthMm = Math.max(0, model.dimensions.depthMm - 2 * wall);
  const internalFrontHeightMm = Math.max(0, model.dimensions.frontHeightMm - floorThicknessMm - roofThicknessMm);
  const internalRearHeightMm = Math.max(0, model.dimensions.rearHeightMm - floorThicknessMm - roofThicknessMm);
  const roof = roofSlope(model);
  const roofPanel = roofPanelGeometry(model);
  const areas = surfaceAreas(model);
  const thermal = thermalSummary(model);
  const layout = layoutGeometry(model);

  const entranceCutouts = layout.entranceCentersXmm.map((centerX) => {
    return {
      type: "roundedRectangle" as const,
      xMm: Math.round(centerX - model.layout.entranceWidthMm / 2),
      yMm: model.layout.thresholdHeightMm,
      widthMm: model.layout.entranceWidthMm,
      heightMm: model.layout.entranceHeightMm,
      radiusMm: Math.min(40, Math.round(model.layout.entranceWidthMm * 0.22))
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
      heightMm: model.dimensions.frontHeightMm,
      thicknessMm: 12,
      shape: "rectangle",
      cutouts: entranceCutouts,
      notes: "Entrance cut-outs are derived from the canonical shelter layout."
    },
    {
      id: "rear-outer",
      nameSr: "Spoljašnja zadnja ploča",
      nameEn: "Exterior rear panel",
      material: "plywood-12",
      quantity: 1,
      widthMm: model.dimensions.widthMm,
      heightMm: model.dimensions.rearHeightMm,
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
      heightMm: model.dimensions.frontHeightMm,
      thicknessMm: 12,
      shape: "trapezoid",
      notes: `Front edge ${model.dimensions.frontHeightMm} mm; rear edge ${model.dimensions.rearHeightMm} mm.`
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
      heightMm: internalFrontHeightMm,
      thicknessMm: 9,
      shape: "rectangle",
      cutouts: entranceCutouts.map((cutout) => ({
        ...cutout,
        xMm: Math.max(0, cutout.xMm - wall),
        yMm: Math.max(0, cutout.yMm - floorThicknessMm)
      }))
    },
    {
      id: "rear-inner",
      nameSr: "Unutrašnja zadnja obloga",
      nameEn: "Interior rear lining",
      material: "plywood-9",
      quantity: 1,
      widthMm: internalWidthMm,
      heightMm: internalRearHeightMm,
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
      heightMm: internalFrontHeightMm,
      thicknessMm: 9,
      shape: "trapezoid",
      notes: `Front clear edge ${internalFrontHeightMm} mm; rear clear edge ${internalRearHeightMm} mm.`
    },
    {
      id: "roof-inner",
      nameSr: "Unutrašnja obloga krova",
      nameEn: "Interior roof lining",
      material: "plywood-9",
      quantity: 1,
      widthMm: internalWidthMm,
      heightMm: Math.ceil(Math.hypot(
        internalDepthMm,
        Math.max(0, internalFrontHeightMm - internalRearHeightMm)
      )),
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
      notes: "Trim entrance openings after dry fitting against the compiled front-panel cutouts."
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
      notes: `Final top edge follows the roof slope down to ${internalRearHeightMm} mm.`
    }),
    ...splitInsulationPanel({
      id: "xps-side-b",
      nameSr: "XPS bočnog zida B",
      nameEn: "Side-wall XPS B",
      widthMm: internalDepthMm,
      heightMm: internalFrontHeightMm,
      thicknessMm: assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0,
      notes: `Final top edge follows the roof slope down to ${internalRearHeightMm} mm.`
    }),
    ...splitInsulationPanel({
      id: "xps-floor",
      nameSr: "XPS poda",
      nameEn: "Floor XPS",
      widthMm: internalWidthMm,
      heightMm: internalDepthMm,
      thicknessMm: assemblies.floor.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0
    }),
    ...splitInsulationPanel({
      id: "xps-roof",
      nameSr: "XPS krova",
      nameEn: "Roof XPS",
      widthMm: internalWidthMm,
      heightMm: Math.ceil(Math.hypot(
        internalDepthMm,
        Math.max(0, internalFrontHeightMm - internalRearHeightMm)
      )),
      thicknessMm: assemblies.roof.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0
    }),
    ...(model.layout.chambers > 1 ? [{
      id: "divider",
      nameSr: "Unutrašnja pregrada",
      nameEn: "Interior divider",
      material: "plywood-12" as const,
      quantity: model.layout.chambers - 1,
      widthMm: internalDepthMm,
      heightMm: internalRearHeightMm,
      thicknessMm: 12,
      shape: "rectangle" as const,
      notes: "Dry-fit below the sloped roof; final top edge can be scribed to the roof lining."
    }] : [])
  ];

  const wallInsulationMm =
    assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0;
  const frameProfile: [number, number] = [30, wallInsulationMm];
  const baseProfile: [number, number] = [45, 45];
  const maxStudSpacingMm = 500;

  const clearStudHeightAtDepth = (positionMm: number) => {
    const ratio = model.dimensions.depthMm === 0 ? 0 : positionMm / model.dimensions.depthMm;
    const externalHeight =
      model.dimensions.frontHeightMm +
      (model.dimensions.rearHeightMm - model.dimensions.frontHeightMm) * ratio;
    return Math.max(1, Math.round(externalHeight - floorThicknessMm - roofThicknessMm));
  };

  const rearIntermediateCount = Math.max(
    0,
    Math.ceil(model.dimensions.widthMm / maxStudSpacingMm) - 1
  );
  const rearIntermediateStuds: LinearPart[] = Array.from(
    {length: rearIntermediateCount},
    (_, index) => {
      const positionMm = Math.round(
        model.dimensions.widthMm * ((index + 1) / (rearIntermediateCount + 1))
      );
      return {
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
      };
    }
  );

  const sideIntermediateCount = Math.max(
    0,
    Math.ceil(model.dimensions.depthMm / maxStudSpacingMm) - 1
  );
  const sideIntermediateStuds: LinearPart[] = ["left", "right"].flatMap((wallSide) =>
    Array.from({length: sideIntermediateCount}, (_, index) => {
      const positionMm = Math.round(
        model.dimensions.depthMm * ((index + 1) / (sideIntermediateCount + 1))
      );
      return {
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
      };
    })
  );

  const linearParts: LinearPart[] = [
    {
      id: "base-runner",
      nameSr: "Uzdužni nosači baze",
      nameEn: "Base runners",
      profileMm: baseProfile,
      quantity: 2,
      lengthMm: model.dimensions.depthMm,
      provenance: "ASSUMPTION",
      wall: "base",
      notesSr: "Početni V1 profil. Potvrditi izbor drveta i zaštitu od vlage pre ENGINEERING_REVIEWED statusa.",
      notesEn: "Initial V1 profile. Confirm timber selection and moisture protection before ENGINEERING_REVIEWED status."
    },
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
      id: "corner-front",
      nameSr: "Prednje ugaone letve",
      nameEn: "Front corner studs",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, model.dimensions.frontHeightMm - floorThicknessMm - roofThicknessMm),
      provenance: "GEOMETRY"
    },
    {
      id: "corner-rear",
      nameSr: "Zadnje ugaone letve",
      nameEn: "Rear corner studs",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, model.dimensions.rearHeightMm - floorThicknessMm - roofThicknessMm),
      provenance: "GEOMETRY"
    },
    {
      id: "entrance-vertical",
      nameSr: "Vertikalna ojačanja ulaza",
      nameEn: "Entrance vertical supports",
      profileMm: frameProfile,
      quantity: model.layout.entrances * 2,
      lengthMm: model.layout.entranceHeightMm + model.layout.thresholdHeightMm,
      provenance: "GEOMETRY"
    },
    {
      id: "entrance-header",
      nameSr: "Gornje ojačanje ulaza",
      nameEn: "Entrance headers",
      profileMm: frameProfile,
      quantity: model.layout.entrances,
      lengthMm: model.layout.entranceWidthMm + 2 * frameProfile[0],
      provenance: "GEOMETRY"
    },
    ...(model.layout.chambers > 1 ? [{
      id: "divider-cleat",
      nameSr: "Letve za unutrašnje pregrade",
      nameEn: "Divider cleats",
      profileMm: frameProfile,
      quantity: (model.layout.chambers - 1) * 2,
      lengthMm: internalRearHeightMm,
      provenance: "GEOMETRY" as const,
      wall: "divider" as const,
      notesSr: "Po dve vertikalne letve po pregradi; finalno uklapanje prati kosinu krova.",
      notesEn: "Two vertical cleats per divider; final fitting follows the roof slope."
    }] : []),
    ...rearIntermediateStuds,
    ...sideIntermediateStuds
  ];

  const framing = {
    status: "PROVISIONAL" as const,
    frameProfileMm: frameProfile,
    baseProfileMm: baseProfile,
    maxStudSpacingMm,
    totalLinearM: linearParts.reduce(
      (sum, part) => sum + (part.quantity * part.lengthMm) / 1000,
      0
    )
  };

  const panelParts = cutParts.filter((part) => part.material !== "xps");
  const fastenerEdgeSpacingMm = 150;
  const fastenerFieldSpacingMm = 300;
  const estimatedPanelFasteners = panelParts.reduce((sum, part) => {
    const perimeterMm = 2 * (part.widthMm + part.heightMm);
    const edgeCount = Math.ceil(perimeterMm / fastenerEdgeSpacingMm);
    const fieldCount = Math.ceil(
      (part.widthMm * part.heightMm) /
      (fastenerFieldSpacingMm * fastenerFieldSpacingMm)
    );
    const cutoutCount = (part.cutouts ?? []).reduce(
      (cutoutSum, cutout) =>
        cutoutSum +
        Math.ceil(
          (2 * (cutout.widthMm + cutout.heightMm)) /
          fastenerEdgeSpacingMm
        ),
      0
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

  const hardwareItems: HardwareItem[] = ([
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
      quantity: model.maintenance.roofAccess === "HINGED" ? 2 : 0,
      unit: "piece",
      provenance: "ASSUMPTION",
      notesSr: "Predviđeni za bezbedno zatvaranje servisnog krova protiv vetra.",
      notesEn: "Intended to secure the service roof against wind uplift."
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
      quantity: 1,
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
      detailSr: "Sastavite stabilnu osnovu i proverite da kućica nema direktan kontakt sa mokrim tlom.",
      detailEn: "Assemble a stable base and keep the shelter out of direct contact with wet ground."
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
      detailSr: "Obezbedite odvod vode od ulaza i zaštitite ivice krova od prodora vlage.",
      detailEn: "Direct runoff away from entrances and protect roof edges against water ingress."
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

  return {
    model,
    layout,
    assemblies,
    construction,
    internal: {
      widthMm: internalWidthMm,
      depthMm: internalDepthMm,
      frontHeightMm: internalFrontHeightMm,
      rearHeightMm: internalRearHeightMm,
      usableFloorAreaM2: (internalWidthMm * internalDepthMm) / 1_000_000
    },
    roof,
    roofPanel,
    areas,
    thermal,
    cutParts,
    linearParts,
    framing,
    hardwareItems,
    hardware,
    buildSteps
  };
}

export type CompiledShelterModel = ReturnType<typeof compileShelterModel>;
