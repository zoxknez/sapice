"use client";

import {useState} from "react";
import type {AppLocale} from "@/i18n/routing";

export function ThermalScenario({
  locale,
  baseDeltaTK,
  nominalW,
  rangeW
}: {
  locale: AppLocale;
  baseDeltaTK: number;
  nominalW: number;
  rangeW: readonly [number, number];
}) {
  const isSr = locale === "sr";
  const [deltaTK, setDeltaTK] = useState(baseDeltaTK);
  const ratio = deltaTK / baseDeltaTK;
  const nominal = nominalW * ratio;
  const low = rangeW[0] * ratio;
  const high = rangeW[1] * ratio;

  return (
    <div className="thermal-scenario">
      <div className="thermal-scenario-head">
        <div>
          <span className="kicker">ΔT explorer</span>
          <strong>{isSr ? "Scenarijska razlika temperature" : "Scenario temperature difference"}</strong>
        </div>
        <output>{deltaTK} K</output>
      </div>

      <input
        type="range"
        min="5"
        max="40"
        step="1"
        value={deltaTK}
        onChange={(event) => setDeltaTK(Number(event.target.value))}
        aria-label={isSr ? "Razlika temperature delta T" : "Temperature difference delta T"}
      />

      <div className="thermal-scenario-result">
        <div>
          <span>{isSr ? "Nominalna transmisija" : "Nominal transmission"}</span>
          <strong>{nominal.toFixed(0)} W</strong>
        </div>
        <div>
          <span>{isSr ? "Sensitivity band" : "Sensitivity band"}</span>
          <strong>{low.toFixed(0)}–{high.toFixed(0)} W</strong>
        </div>
      </div>

      <p>
        {isSr
          ? "Ovo je samo skaliranje steady-state transmisije kroz zid/pod/krov. ΔT nije spoljašnja temperatura niti garantovana unutrašnja temperatura; infiltracija, vetar, termički mostovi rama i drugi efekti nisu dodati."
          : "This only scales steady-state transmission through wall/floor/roof. ΔT is not an outdoor temperature or guaranteed indoor temperature; infiltration, wind, framing thermal bridges and other effects are not added."}
      </p>
    </div>
  );
}
