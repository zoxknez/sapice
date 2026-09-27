import type {AppLocale} from "@/i18n/routing";
import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {sources} from "@/data/sources";

export function ModelBuildBook({model, locale}: {model: ShelterModel; locale: AppLocale}) {
  const compiled = compileShelterModel(model);
  const referencedSources = model.sourceIds.map((id) => sources[id]).filter(Boolean);

  return (
    <>
      <section className="section tone-soft" id="inside">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Compiled geometry</span>
              <h2>{locale === "sr" ? "Korisni unutrašnji prostor" : "Usable interior space"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Ove vrednosti nisu ručno upisane. Compiler ih izvodi iz spoljašnjih mera i debljine konstrukcije."
                : "These values are not manually duplicated. The compiler derives them from external dimensions and construction thickness."}
            </p>
          </div>
          <div className="thermal-grid">
            <div><span>{locale === "sr" ? "Unutrašnja širina" : "Internal width"}</span><strong>{compiled.internal.widthMm} mm</strong></div>
            <div><span>{locale === "sr" ? "Unutrašnja dubina" : "Internal depth"}</span><strong>{compiled.internal.depthMm} mm</strong></div>
            <div><span>{locale === "sr" ? "Visina napred" : "Front clear height"}</span><strong>{compiled.internal.frontHeightMm} mm</strong></div>
            <div><span>{locale === "sr" ? "Korisna podna površina" : "Usable floor area"}</span><strong>{compiled.internal.usableFloorAreaM2.toFixed(2)} m²</strong></div>
          </div>
        </div>
      </section>

      <section className="section" id="cut-list">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Cut list · compiler output</span>
              <h2>{locale === "sr" ? "Početna krojna lista" : "Initial cut list"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Spisak trenutno pokriva osnovne pločaste elemente. Ram, detaljni otvori i nesting ulaze u sledeći engineering sloj pre statusa GEOMETRY_VALIDATED."
                : "The current list covers primary sheet components. Framing, detailed cut-outs and nesting are the next engineering layer before GEOMETRY_VALIDATED status."}
            </p>
          </div>
          <div className="cut-table" role="table" aria-label={locale === "sr" ? "Krojna lista" : "Cut list"}>
            <div className="cut-row cut-head" role="row">
              <span role="columnheader">ID</span>
              <span role="columnheader">{locale === "sr" ? "Deo" : "Part"}</span>
              <span role="columnheader">{locale === "sr" ? "Dimenzije" : "Dimensions"}</span>
              <span role="columnheader">{locale === "sr" ? "Kom." : "Qty"}</span>
            </div>
            {compiled.cutParts.map((part) => (
              <div className="cut-row" role="row" key={part.id}>
                <code role="cell">{part.id}</code>
                <span role="cell">
                  <strong>{locale === "sr" ? part.nameSr : part.nameEn}</strong>
                  <small>{part.shape === "trapezoid" ? (locale === "sr" ? "trapezni profil" : "trapezoid profile") : part.material}</small>
                </span>
                <span role="cell">{part.widthMm} × {part.heightMm} × {part.thicknessMm} mm</span>
                <strong role="cell">{part.quantity}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tone" id="build-guide">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Build sequence</span>
              <h2>{locale === "sr" ? "Redosled izrade" : "Build sequence"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Koraci su vezani za konfiguraciju modela. Grejani modeli automatski dobijaju poseban korak sa ograničenjem na namensku opremu."
                : "Steps follow the model configuration. Heated variants automatically include a dedicated step constrained to purpose-built equipment."}
            </p>
          </div>
          <ol className="build-steps">
            {compiled.buildSteps.map((step, index) => (
              <li key={step.id}>
                <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{locale === "sr" ? step.titleSr : step.titleEn}</h3>
                  <p>{locale === "sr" ? step.detailSr : step.detailEn}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="sources">
        <div className="shell source-layout">
          <div>
            <span className="kicker">Provenance</span>
            <h2>{locale === "sr" ? "Izvori i ograničenja" : "Sources and limitations"}</h2>
            <p className="page-lead source-intro">
              {locale === "sr"
                ? "Izvor potvrđuje metod ili welfare smernicu, ali ne pretvara ovaj konkretan model u sertifikovan proizvod. Fizička validacija ima poseban status."
                : "A source supports a method or welfare guideline; it does not turn this specific model into a certified product. Physical validation has a separate status."}
            </p>
          </div>
          <div className="source-list">
            {referencedSources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>{source.publisher} · Tier {source.tier}</span>
                <strong>{source.title}</strong>
                <small>{source.notes}</small>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
