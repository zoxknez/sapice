import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import type {ValidationState} from "@/lib/domain";
import {compiledSourceIds} from "@/lib/provenance";
import {validationStageLabel} from "@/lib/validation-labels";

export {validationStageLabel} from "@/lib/validation-labels";

const stages: Array<{
  state: ValidationState;
  detailSr: string;
  detailEn: string;
}> = [
  {
    state: "DATA_VALIDATED",
    detailSr: "Proveravaju se ispravnost šeme, izvori, konstrukcijski sklopovi, otvori, uklapanje delova u raspoložive formate materijala, pravila za ram i okov, kao i proračunske vrednosti.",
    detailEn: "Schema, sources, assemblies, openings, stock fit, framing/hardware invariants and calculation outputs must remain internally consistent."
  },
  {
    state: "GEOMETRY_VALIDATED",
    detailSr: "Zahteva zabeleženu softversku i vizuelnu proveru 3D/crteža/krojnih delova, ne samo uspešno učitavanje podataka.",
    detailEn: "Requires recorded software and visual verification of 3D/drawings/cut parts, not merely successful data loading."
  },
  {
    state: "ENGINEERING_REVIEWED",
    detailSr: "Predlog rama i pričvršćivača, zaštita od vlage, termička procena i servisni detalji moraju proći stručnu proveru za konkretan način izrade.",
    detailEn: "Provisional framing, fastener, moisture, thermal and service details must be reviewed for the actual construction method."
  },
  {
    state: "PROTOTYPE_BUILT",
    detailSr: "Postoji stvarno izgrađen primerak sa dokumentovanim odstupanjima, fotografijama i završnom bezbednosnom inspekcijom.",
    detailEn: "A physical example exists with documented deviations, photographs and a final safety inspection."
  },
  {
    state: "FIELD_TESTED",
    detailSr: "Model ima dokumentovano korišćenje u realnim uslovima. Ni ovaj status sam po sebi nije univerzalna temperaturna garancija.",
    detailEn: "The model has documented real-world use. Even this status is not a universal safe-temperature guarantee."
  }
];

export function ModelValidationPanel({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const isSr = locale === "sr";
  const currentIndex = stages.findIndex(
    (stage) => stage.state === compiled.model.validationState
  );
  const sourceCount = compiledSourceIds(compiled).length;

  return (
    <section className="section validation-section" id="validation">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">{isSr ? "Lestvica validacije" : "Validation ladder"}</span>
            <h2>{isSr ? "Šta je stvarno potvrđeno" : "What is actually validated"}</h2>
          </div>
          <p>
            {isSr
              ? "Status se ne podiže zato što aplikacija izgleda završeno. Svaki sledeći nivo zahteva novu vrstu dokaza."
              : "Status is not promoted because the application looks finished. Each next level requires a new kind of evidence."}
          </p>
        </div>

        <div className="validation-overview">
          <div>
            <span>{isSr ? "Trenutni status" : "Current state"}</span>
            <strong>{validationStageLabel(compiled.model.validationState, locale)}</strong>
          </div>
          <div>
            <span>{isSr ? "Verzija modela" : "Model version"}</span>
            <strong>v{compiled.model.version}</strong>
          </div>
          <div>
            <span>{isSr ? "Kompajlator" : "Compiler"}</span>
            <strong>v{compiled.compilerVersion}</strong>
          </div>
          <div>
            <span>{isSr ? "Plan ID" : "Plan ID"}</span>
            <strong><code>{compiled.planFingerprint}</code></strong>
          </div>
          <div>
            <span>{isSr ? "Izvora u kompajliranom planu" : "Sources in compiled plan"}</span>
            <strong>{sourceCount}</strong>
          </div>
        </div>

        <ol className="validation-ladder">
          {stages.map((stage, index) => {
            const reached = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <li
                key={stage.state}
                className={[
                  reached ? "reached" : "pending",
                  current ? "current" : ""
                ].join(" ")}
              >
                <span className="validation-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{validationStageLabel(stage.state, locale)}</strong>
                  <code>{stage.state}</code>
                  <p>{isSr ? stage.detailSr : stage.detailEn}</p>
                </div>
                <span className="validation-state">
                  {current
                    ? (isSr ? "TRENUTNO" : "CURRENT")
                    : reached
                      ? (isSr ? "DOSTIGNUTO" : "REACHED")
                      : (isSr ? "NIJE POTVRĐENO" : "NOT VALIDATED")}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
