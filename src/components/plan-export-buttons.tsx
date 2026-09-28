"use client";

import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import {
  cutPartMaterialLabel,
  cutPartNote,
  hardwareItemName,
  hardwareItemNote,
  linearPartNote,
  provenanceLabel
} from "@/lib/model-presentation";

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
    const label = (sr: string, en: string) => isSr ? sr : en;
    const wallLabels: Record<string, string> = {
      front: "prednji zid",
      rear: "zadnji zid",
      left: "levi zid",
      right: "desni zid",
      floor: "pod",
      roof: "krov",
      base: "baza",
      divider: "pregrada"
    };
    const rows: Array<Array<string | number>> = [
      ["Šapice", model.translations[locale].name, `v${model.version}`],
      [label("ID modela", "Model ID"), model.id],
      [label("Verzija modela", "Model version"), model.version],
      [label("Verzija kompajlera", "Compiler version"), compiled.compilerVersion],
      [label("Otisak plana", "Plan fingerprint"), compiled.planFingerprint],
      [label("Status validacije", "Validation"), model.validationState],
      [],
      [label("KROJNI DELOVI", "CUT PARTS")],
      ["ID", label("Naziv", "Name"), label("Materijal", "Material"), label("Oblik", "Shape"), label("Širina mm", "Width mm"), label("Visina mm", "Height mm"), label("Debljina mm", "Thickness mm"), label("Kom.", "Qty"), label("Napomene", "Notes")]
    ];

    for (const part of compiled.cutParts) {
      rows.push([
        part.id,
        isSr ? part.nameSr : part.nameEn,
        cutPartMaterialLabel(part, locale),
        part.shape === "trapezoid" ? label("trapez", "trapezoid") : label("pravougaonik", "rectangle"),
        part.widthMm,
        part.heightMm,
        part.thicknessMm,
        part.quantity,
        cutPartNote(part, locale) ?? ""
      ]);
    }

    rows.push(
      [],
      [label("RAM", "FRAMING")],
      ["ID", label("Naziv", "Name"), label("Profil", "Profile"), label("Dužina mm", "Length mm"), label("Kom.", "Qty"), label("Zid", "Wall"), label("Položaj mm", "Position mm"), label("Poreklo podatka", "Provenance"), label("Napomene", "Notes")]
    );

    for (const part of compiled.linearParts) {
      const wall = part.wall ?? "";
      rows.push([
        part.id,
        isSr ? part.nameSr : part.nameEn,
        `${part.profileMm[0]}x${part.profileMm[1]} mm`,
        part.lengthMm,
        part.quantity,
        isSr ? (wallLabels[wall] ?? wall) : wall,
        part.positionMm ?? "",
        provenanceLabel(part.provenance, locale),
        linearPartNote(part, locale) ?? ""
      ]);
    }

    rows.push(
      [],
      [label("SPOJEVI ZIDOVA", "WALL JOINERY")],
      [label("Koncepcija spojeva", "Convention"), compiled.joinery.convention],
      [label("Debljina zida mm", "Wall thickness mm"), compiled.joinery.wallThicknessMm],
      [label("Početak bočnog zida Z mm", "Side start Z mm"), compiled.joinery.sideStartZmm.toFixed(1)],
      [label("Kraj bočnog zida Z mm", "Side end Z mm"), compiled.joinery.sideEndZmm.toFixed(1)],
      [label("Dužina bočne ploče mm", "Side panel run mm"), compiled.joinery.sideRunMm.toFixed(1)],
      [label("Visina bočnog zida napred mm", "Side front height mm"), compiled.joinery.sideFrontHeightMm.toFixed(1)],
      [label("Visina bočnog zida pozadi mm", "Side rear height mm"), compiled.joinery.sideRearHeightMm.toFixed(1)],
      [label("Dužina gornje kosine bočnog zida mm", "Side top slope length mm"), compiled.joinery.sideTopSlopeLengthMm.toFixed(1)],
      [label("Površina povrata ugaonih ivica m2", "Corner return envelope m2"), compiled.areas.cornerReturnM2.toFixed(4)]
    );

    if (compiled.heating.zones.length > 0) {
      rows.push(
        [],
        [label("REZERVISANA GREJNA ZONA", "HEATING PROVISION")],
        ["ID", label("Komora", "Chamber"), "X mm", "Z mm", label("Širina mm", "Width mm"), label("Dubina mm", "Depth mm"), label("Površina m2", "Area m2"), label("Podna površina komore m2", "Chamber floor m2"), label("Površina stvarnog proizvoda", "Actual product footprint")]
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
      [label("ZAŠTITA KROVA OD VODE", "ROOF WEATHERING")],
      [label("Status", "Status"), compiled.roofWeathering.status],
      [label("Visoka ivica", "High edge"), compiled.roofWeathering.highEdge],
      [label("Ivica oticanja vode", "Runoff edge"), compiled.roofWeathering.runoffEdge],
      [label("Ivica šarki servisnog krova", "Service roof hinge edge"), compiled.hardware.hingeEdge ?? ""],
      [label("Osa šarki od prednje ivice panela mm", "Hinge axis from panel front mm"), compiled.hardware.hingeAxisFromPanelFrontMm.toFixed(1)],
      [label("Ivica zatvarača servisnog krova", "Service roof latch edge"), compiled.hardware.latchEdge ?? ""],
      [label("Osa zatvarača od prednje ivice panela mm", "Latch axis from panel front mm"), compiled.hardware.latchAxisFromPanelFrontMm.toFixed(1)],
      [label("Slobodan prepust zadnje kapne ivice duž kosine mm", "Rear free drip overhang along slope mm"), compiled.roofPanel.rearOverhangAlongSlopeMm.toFixed(1)],
      [label("Ugao nagiba", "Slope degrees"), compiled.roofWeathering.slopeDegrees.toFixed(2)],
      [label("Visinska razlika mm", "Rise mm"), compiled.roofWeathering.riseMm],
      [label("Dužina osnove mm", "Run mm"), compiled.roofWeathering.runMm],
      [label("Dužina zadnje kapne ivice m", "Rear drip edge m"), compiled.roofWeathering.rearDripEdgeLengthM.toFixed(3)],
      [label("Ukupna dužina zaštite ivica m", "Full edge protection m"), compiled.roofWeathering.fullEdgeProtectionLengthM.toFixed(3)],
      [label("Kompatibilnost krovnog sistema", "Roofing compatibility"), "VERIFY_SELECTED_PRODUCT_INSTRUCTIONS"]
    );

    rows.push(
      [],
      [label("REZERVISANE ZONE VENTILACIJE", "VENTILATION PROVISION")],
      ["ID", label("Komora", "Chamber"), label("Zid", "Wall"), label("Centar X mm", "Center X mm"), label("Donja ivica mm", "Bottom mm"), label("Širina zone mm", "Zone width mm"), label("Visina zone mm", "Zone height mm"), label("Poreklo podatka", "Provenance"), label("Stvarni otvor", "Actual opening")]
    );

    for (const zone of compiled.ventilation.zones) {
      rows.push([
        zone.id,
        zone.chamber,
        isSr ? (wallLabels[zone.wall] ?? zone.wall) : zone.wall,
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
      [label("OKOV", "HARDWARE")],
      ["ID", label("Naziv", "Name"), label("Količina", "Quantity"), label("Jedinica", "Unit"), label("Poreklo podatka", "Provenance"), label("Napomene", "Notes")]
    );

    for (const item of compiled.hardwareItems) {
      rows.push([
        item.id,
        hardwareItemName(item, locale),
        item.quantity,
        item.unit === "m" ? "m" : label("komad", "piece"),
        provenanceLabel(item.provenance, locale),
        hardwareItemNote(item, locale)
      ]);
    }

    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadBlob(
      `sapice-${model.slug}-v${model.version}-${isSr ? "spisak-materijala" : "bom"}.csv`,
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
        {isSr ? "Izvezi spisak materijala (CSV)" : "Export BOM CSV"}
      </button>
      <button type="button" className="button secondary" onClick={exportJson}>
        {isSr ? "Izvezi JSON" : "Export JSON"}
      </button>
    </div>
  );
}
