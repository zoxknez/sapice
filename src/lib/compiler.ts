import type {ShelterModel} from "@/lib/domain";
import {constructionSummary, getModelAssemblies, roofPanelGeometry, roofSlope, surfaceAreas, thermalSummary} from "@/lib/engineering";

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
  notesSr?: string;
  notesEn?: string;
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
  const stockWidthMm = 1250;
  const stockHeightMm = 600;
  const columns = Math.max(1, Math.ceil(widthMm / stockWidthMm));
  const rows = Math.max(1, Math.ceil(heightMm / stockHeightMm));
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

  const entranceCutouts = Array.from({length: model.layout.entrances}, (_, index) => {
    const centerX = model.dimensions.widthMm * ((index + 1) / (model.layout.entrances + 1));
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

  const linearParts: LinearPart[] = [
    {
      id: "base-runner",
      nameSr: "Uzdužni nosači baze",
      nameEn: "Base runners",
      profileMm: baseProfile,
      quantity: 2,
      lengthMm: model.dimensions.depthMm,
      provenance: "ASSUMPTION",
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
      provenance: "GEOMETRY"
    },
    {
      id: "floor-frame-short",
      nameSr: "Poprečne letve rama poda",
      nameEn: "Floor frame cross rails",
      profileMm: frameProfile,
      quantity: 2,
      lengthMm: Math.max(1, model.dimensions.widthMm - 2 * frameProfile[0]),
      provenance: "GEOMETRY"
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
      notesSr: "Po dve vertikalne letve po pregradi; finalno uklapanje prati kosinu krova.",
      notesEn: "Two vertical cleats per divider; final fitting follows the roof slope."
    }] : [])
  ];

  const framing = {
    status: "PROVISIONAL" as const,
    frameProfileMm: frameProfile,
    baseProfileMm: baseProfile,
    totalLinearM: linearParts.reduce(
      (sum, part) => sum + (part.quantity * part.lengthMm) / 1000,
      0
    )
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
    buildSteps
  };
}

export type CompiledShelterModel = ReturnType<typeof compileShelterModel>;
