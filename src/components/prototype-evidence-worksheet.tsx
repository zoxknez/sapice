"use client";

import {useEffect, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";

type ChecklistKey =
  | "structureStable"
  | "noSharpEdges"
  | "insulationEnclosed"
  | "roofSecured"
  | "interiorDry"
  | "ventilationObserved"
  | "noVisibleCondensation"
  | "entranceClear"
  | "beddingDry"
  | "heatingProductChecked";

type EvidenceState = {
  prototypeId: string;
  buildDate: string;
  observationDate: string;
  outsideTempC: string;
  insideTempC: string;
  insideRhPct: string;
  observationHours: string;
  deviationNotes: string;
  observationNotes: string;
  checklist: Record<ChecklistKey, boolean>;
};

const emptyChecklist: Record<ChecklistKey, boolean> = {
  structureStable: false,
  noSharpEdges: false,
  insulationEnclosed: false,
  roofSecured: false,
  interiorDry: false,
  ventilationObserved: false,
  noVisibleCondensation: false,
  entranceClear: false,
  beddingDry: false,
  heatingProductChecked: false
};

function initialState(): EvidenceState {
  return {
    prototypeId: "",
    buildDate: "",
    observationDate: "",
    outsideTempC: "",
    insideTempC: "",
    insideRhPct: "",
    observationHours: "",
    deviationNotes: "",
    observationNotes: "",
    checklist: {...emptyChecklist}
  };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function PrototypeEvidenceWorksheet({
  locale,
  modelId,
  modelVersion,
  compilerVersion,
  planFingerprint,
  heated
}: {
  locale: AppLocale;
  modelId: string;
  modelVersion: string;
  compilerVersion: string;
  planFingerprint: string;
  heated: boolean;
}) {
  const isSr = locale === "sr";
  const storageKey = `sapice:prototype-evidence:${modelId}:${planFingerprint}`;
  const [state, setState] = useState<EvidenceState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<EvidenceState>;
          setState({
            ...initialState(),
            ...parsed,
            checklist: {
              ...emptyChecklist,
              ...(parsed.checklist ?? {})
            }
          });
        } catch {
          // Corrupt local evidence drafts are ignored.
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  const checks = useMemo(() => {
    const common: Array<[ChecklistKey, string, string]> = [
      ["structureStable", "Konstrukcija je stabilna na stvarnoj podlozi", "Structure is stable on the actual site surface"],
      ["noSharpEdges", "Nema dostupnih oštrih ivica ili vrhova", "No accessible sharp edges or points"],
      ["insulationEnclosed", "Izolacija nije dostupna životinji", "Insulation is not accessible to the animal"],
      ["roofSecured", "Servisni krov i zatvarači ostaju sigurni", "Service roof and latches remain secure"],
      ["interiorDry", "Unutrašnjost je ostala suva tokom posmatranja", "Interior remained dry during observation"],
      ["ventilationObserved", "Nema uočene direktne lokalne promaje iz ventilacione zone", "No observed direct localized draft from the ventilation zone"],
      ["noVisibleCondensation", "Nije uočena kondenzacija na unutrašnjim površinama", "No visible condensation was observed on interior surfaces"],
      ["entranceClear", "Ulaz/izlaz je prohodan i bez prepreka", "Entrance/exit remains clear and unobstructed"],
      ["beddingDry", "Posteljina je ostala suva", "Bedding remained dry"]
    ];

    if (heated) {
      common.push([
        "heatingProductChecked",
        "Namenski grejni proizvod je ugrađen prema uputstvu proizvođača",
        "Purpose-built heating product is installed to manufacturer instructions"
      ]);
    }

    return common;
  }, [heated]);

  const observedCount = checks.filter(([key]) => state.checklist[key]).length;

  function setField<K extends keyof EvidenceState>(key: K, value: EvidenceState[K]) {
    setState((current) => ({...current, [key]: value}));
  }

  function exportEvidence() {
    downloadJson(
      `sapice-${modelId}-${planFingerprint}-prototype-evidence.json`,
      {
        format: "sapice-prototype-evidence",
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        plan: {
          modelId,
          modelVersion,
          compilerVersion,
          planFingerprint
        },
        evidence: state,
        observedChecklistItems: observedCount,
        totalChecklistItems: checks.length,
        disclaimer:
          "This record documents observations only. It does not promote or certify the published model validation state."
      }
    );
  }

  return (
    <section className="section prototype-evidence-section" id="prototype">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">Prototype evidence · local only</span>
            <h2>{isSr ? "Radni list fizičke provere" : "Physical validation worksheet"}</h2>
          </div>
          <p>
            {isSr
              ? "Beleške se čuvaju samo u ovom browseru i vezane su za tačan Plan ID. Popunjavanje ne podiže javni status modela - služi da fizička provera jednog dana ima uredan dokazni trag."
              : "Notes stay only in this browser and are tied to the exact Plan ID. Completing the worksheet does not promote the public model state - it creates an evidence trail for future physical validation."}
          </p>
        </div>

        <div className="prototype-identity">
          <div><span>MODEL</span><strong>{modelId}</strong></div>
          <div><span>MODEL VERSION</span><strong>v{modelVersion}</strong></div>
          <div><span>COMPILER</span><strong>v{compilerVersion}</strong></div>
          <div><span>PLAN ID</span><strong><code>{planFingerprint}</code></strong></div>
        </div>

        <div className="prototype-form-grid">
          <label>
            <span>{isSr ? "ID / naziv prototipa" : "Prototype ID / name"}</span>
            <input
              value={state.prototypeId}
              onChange={(event) => setField("prototypeId", event.target.value)}
              placeholder={isSr ? "npr. P-001" : "e.g. P-001"}
            />
          </label>
          <label>
            <span>{isSr ? "Datum izrade" : "Build date"}</span>
            <input
              type="date"
              value={state.buildDate}
              onChange={(event) => setField("buildDate", event.target.value)}
            />
          </label>
          <label>
            <span>{isSr ? "Datum posmatranja" : "Observation date"}</span>
            <input
              type="date"
              value={state.observationDate}
              onChange={(event) => setField("observationDate", event.target.value)}
            />
          </label>
          <label>
            <span>{isSr ? "Trajanje posmatranja (h)" : "Observation duration (h)"}</span>
            <input
              inputMode="decimal"
              type="number"
              step="0.1"
              min="0"
              value={state.observationHours}
              onChange={(event) => setField("observationHours", event.target.value)}
            />
          </label>
          <label>
            <span>{isSr ? "Spoljašnja temperatura (°C)" : "Outdoor temperature (°C)"}</span>
            <input
              inputMode="decimal"
              type="number"
              step="0.1"
              value={state.outsideTempC}
              onChange={(event) => setField("outsideTempC", event.target.value)}
            />
          </label>
          <label>
            <span>{isSr ? "Unutrašnja temperatura (°C)" : "Interior temperature (°C)"}</span>
            <input
              inputMode="decimal"
              type="number"
              step="0.1"
              value={state.insideTempC}
              onChange={(event) => setField("insideTempC", event.target.value)}
            />
          </label>
          <label>
            <span>{isSr ? "Unutrašnja RH (%)" : "Interior RH (%)"}</span>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              max="100"
              step="1"
              value={state.insideRhPct}
              onChange={(event) => setField("insideRhPct", event.target.value)}
            />
          </label>
        </div>

        <div className="prototype-checklist">
          <header>
            <strong>{isSr ? "Zabeležene provere" : "Recorded checks"}</strong>
            <span>{observedCount} / {checks.length}</span>
          </header>
          {checks.map(([key, sr, en]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={state.checklist[key]}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    checklist: {
                      ...current.checklist,
                      [key]: event.target.checked
                    }
                  }))
                }
              />
              <span>{isSr ? sr : en}</span>
            </label>
          ))}
        </div>

        <div className="prototype-notes-grid">
          <label>
            <span>{isSr ? "Odstupanja od plana" : "Deviations from plan"}</span>
            <textarea
              rows={5}
              value={state.deviationNotes}
              onChange={(event) => setField("deviationNotes", event.target.value)}
              placeholder={isSr
                ? "Zabeležite svaku promenu dimenzije, materijala, spoja ili hardware-a."
                : "Record every change in dimensions, materials, joints or hardware."}
            />
          </label>
          <label>
            <span>{isSr ? "Napomene sa posmatranja" : "Observation notes"}</span>
            <textarea
              rows={5}
              value={state.observationNotes}
              onChange={(event) => setField("observationNotes", event.target.value)}
              placeholder={isSr
                ? "Vlaga, vetar, ponašanje životinje, tragovi vode, stanje posteljine..."
                : "Moisture, wind, animal behavior, water traces, bedding condition..."}
            />
          </label>
        </div>

        <div className="prototype-actions">
          <button type="button" className="button primary" onClick={exportEvidence}>
            {isSr ? "Izvezi evidence JSON" : "Export evidence JSON"}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setState(initialState())}
          >
            {isSr ? "Očisti lokalni radni list" : "Clear local worksheet"}
          </button>
        </div>

        <p className="prototype-disclaimer">
          {isSr
            ? "Ovaj radni list nije sertifikat, veterinarska procena niti automatski FIELD_TESTED status. Objavljeni validation state menja se tek nakon odvojene revizije stvarnih dokaza."
            : "This worksheet is not a certificate, veterinary assessment or automatic FIELD_TESTED state. The published validation state changes only after separate review of real evidence."}
        </p>
      </div>
    </section>
  );
}
