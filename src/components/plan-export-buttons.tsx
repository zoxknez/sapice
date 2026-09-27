"use client";

import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function PlanExportButtons({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const isSr = locale === "sr";
  const model = compiled.model;

  function exportCsv() {
    const rows: Array<Array<string | number>> = [
      ["Šapice", model.translations[locale].name, `v${model.version}`],
      ["Model ID", model.id],
      ["Model version", model.version],
      ["Compiler version", compiled.compilerVersion],
      ["Plan fingerprint", compiled.planFingerprint],
      ["Validation", model.validationState],
      [],
      ["CUT PARTS"],
      ["ID", "Name", "Material", "Shape", "Width mm", "Height mm", "Thickness mm", "Qty", "Notes"]
    ];

    for (const part of compiled.cutParts) {
      rows.push([
        part.id,
        isSr ? part.nameSr : part.nameEn,
        part.material,
        part.shape,
        part.widthMm,
        part.heightMm,
        part.thicknessMm,
        part.quantity,
        isSr ? (part.notesSr ?? "") : (part.notesEn ?? "")
      ]);
    }

    rows.push(
      [],
      ["FRAMING"],
      ["ID", "Name", "Profile", "Length mm", "Qty", "Wall", "Position mm", "Provenance", "Notes"]
    );

    for (const part of compiled.linearParts) {
      rows.push([
        part.id,
        isSr ? part.nameSr : part.nameEn,
        `${part.profileMm[0]}x${part.profileMm[1]} mm`,
        part.lengthMm,
        part.quantity,
        part.wall ?? "",
        part.positionMm ?? "",
        part.provenance,
        isSr ? (part.notesSr ?? "") : (part.notesEn ?? "")
      ]);
    }

    rows.push(
      [],
      ["WALL JOINERY"],
      ["Convention", compiled.joinery.convention],
      ["Wall thickness mm", compiled.joinery.wallThicknessMm],
      ["Side start Z mm", compiled.joinery.sideStartZmm.toFixed(1)],
      ["Side end Z mm", compiled.joinery.sideEndZmm.toFixed(1)],
      ["Side panel run mm", compiled.joinery.sideRunMm.toFixed(1)],
      ["Side front height mm", compiled.joinery.sideFrontHeightMm.toFixed(1)],
      ["Side rear height mm", compiled.joinery.sideRearHeightMm.toFixed(1)],
      ["Side top slope length mm", compiled.joinery.sideTopSlopeLengthMm.toFixed(1)],
      ["Corner return envelope m2", compiled.areas.cornerReturnM2.toFixed(4)]
    );

    if (compiled.heating.zones.length > 0) {
      rows.push(
        [],
        ["HEATING PROVISION"],
        ["ID", "Chamber", "X mm", "Z mm", "Width mm", "Depth mm", "Area m2", "Chamber floor m2", "Actual product footprint"]
      );

      for (const zone of compiled.heating.zones) {
        rows.push([
          zone.id,
          zone.chamber,
          zone.xMm.toFixed(0),
          zone.zMm.toFixed(0),
          zone.widthMm,
          zone.depthMm,
          zone.areaM2.toFixed(3),
          zone.chamberFloorAreaM2.toFixed(3),
          zone.actualProductFootprint
        ]);
      }
    }

    rows.push(
      [],
      ["ROOF WEATHERING"],
      ["Status", compiled.roofWeathering.status],
      ["High edge", compiled.roofWeathering.highEdge],
      ["Runoff edge", compiled.roofWeathering.runoffEdge],
      ["Service roof hinge edge", compiled.hardware.hingeEdge ?? ""],
      ["Hinge axis from panel front mm", compiled.hardware.hingeAxisFromPanelFrontMm.toFixed(1)],
      ["Service roof latch edge", compiled.hardware.latchEdge ?? ""],
      ["Latch axis from panel front mm", compiled.hardware.latchAxisFromPanelFrontMm.toFixed(1)],
      ["Rear free drip overhang along slope mm", compiled.roofPanel.rearOverhangAlongSlopeMm.toFixed(1)],
      ["Slope degrees", compiled.roofWeathering.slopeDegrees.toFixed(2)],
      ["Rise mm", compiled.roofWeathering.riseMm],
      ["Run mm", compiled.roofWeathering.runMm],
      ["Rear drip edge m", compiled.roofWeathering.rearDripEdgeLengthM.toFixed(3)],
      ["Full edge protection m", compiled.roofWeathering.fullEdgeProtectionLengthM.toFixed(3)],
      ["Roofing compatibility", "VERIFY_SELECTED_PRODUCT_INSTRUCTIONS"]
    );

    rows.push(
      [],
      ["VENTILATION PROVISION"],
      ["ID", "Chamber", "Wall", "Center X mm", "Bottom mm", "Zone width mm", "Zone height mm", "Provenance", "Actual opening"]
    );

    for (const zone of compiled.ventilation.zones) {
      rows.push([
        zone.id,
        zone.chamber,
        zone.wall,
        zone.centerXmm.toFixed(0),
        zone.bottomMm.toFixed(0),
        zone.widthMm,
        zone.heightMm,
        zone.provenance,
        zone.actualOpening
      ]);
    }

    rows.push(
      [],
      ["HARDWARE"],
      ["ID", "Name", "Quantity", "Unit", "Provenance", "Notes"]
    );

    for (const item of compiled.hardwareItems) {
      rows.push([
        item.id,
        isSr ? item.nameSr : item.nameEn,
        item.quantity,
        item.unit,
        item.provenance,
        isSr ? item.notesSr : item.notesEn
      ]);
    }

    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadBlob(
      `sapice-${model.slug}-v${model.version}-bom.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  }

  function exportJson() {
    const payload = {
      format: "sapice-compiled-plan",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      modelVersion: model.version,
      model,
      compiled
    };

    downloadBlob(
      `sapice-${model.slug}-v${model.version}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  }

  return (
    <div className="export-actions" aria-label={isSr ? "Izvoz plana" : "Plan export"}>
      <button type="button" className="button secondary" onClick={exportCsv}>
        {isSr ? "Izvezi BOM CSV" : "Export BOM CSV"}
      </button>
      <button type="button" className="button secondary" onClick={exportJson}>
        {isSr ? "Izvezi JSON" : "Export JSON"}
      </button>
    </div>
  );
}
