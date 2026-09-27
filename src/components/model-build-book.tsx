import type {AppLocale} from "@/i18n/routing";
import type {ShelterModel} from "@/lib/domain";
import {compileShelterModel} from "@/lib/compiler";
import {sources} from "@/data/sources";
import {BuildGuide} from "@/components/build-guide";

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
          <div className="thermal-grid interior-metrics">
            <div><span>{locale === "sr" ? "Unutrašnja širina" : "Internal width"}</span><strong>{compiled.internal.widthMm} mm</strong></div>
            <div><span>{locale === "sr" ? "Unutrašnja dubina" : "Internal depth"}</span><strong>{compiled.internal.depthMm} mm</strong></div>
            <div><span>{locale === "sr" ? "Prosečna korisna visina" : "Average clear height"}</span><strong>{compiled.internal.averageHeightMm.toFixed(0)} mm</strong></div>
            <div><span>{locale === "sr" ? "Čista širina komore" : "Clear chamber width"}</span><strong>{compiled.internal.chamberClearWidthMm.toFixed(0)} mm</strong></div>
            <div><span>{locale === "sr" ? "Korisna podna površina" : "Usable floor area"}</span><strong>{compiled.internal.usableFloorAreaM2.toFixed(2)} m²</strong></div>
            <div><span>{locale === "sr" ? "Približan korisni volumen" : "Approx. usable volume"}</span><strong>{compiled.internal.usableVolumeM3.toFixed(2)} m³</strong></div>
            <div><span>{locale === "sr" ? "Po preporučenoj životinji" : "Per recommended animal"}</span><strong>{compiled.internal.floorAreaPerRecommendedAnimalM2.toFixed(2)} m²</strong></div>
            <div><span>{locale === "sr" ? "Po max kapacitetu" : "Per max capacity animal"}</span><strong>{compiled.internal.floorAreaPerMaxAnimalM2.toFixed(2)} m²</strong></div>
          </div>
          <p className="metric-disclaimer">
            {locale === "sr"
              ? "Površina i volumen po životinji su geometrijske metrike za poređenje modela. Nisu veterinarski, zakonski ili welfare minimum."
              : "Per-animal area and volume are geometric comparison metrics. They are not veterinary, legal or welfare minimums."}
          </p>
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
                ? "Spisak uključuje spoljašnje ploče, unutrašnje obloge, segmentiranu izolaciju i pregrade. Otvori ulaza se izvode iz istog kanonskog modela."
                : "The list includes exterior panels, interior linings, segmented insulation and dividers. Entrance cutouts are derived from the same canonical model."}
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
                  <small>
                    {part.shape === "trapezoid"
                      ? (locale === "sr" ? "trapezni profil" : "trapezoid profile")
                      : part.material}
                    {(locale === "sr" ? part.notesSr : part.notesEn)
                      ? ` · ${locale === "sr" ? part.notesSr : part.notesEn}`
                      : ""}
                  </small>
                </span>
                <span role="cell">
                  {part.shape === "trapezoid" && part.trapezoidRearHeightMm !== undefined
                    ? `${part.widthMm} × Hf ${part.heightMm} / Hr ${part.trapezoidRearHeightMm} × ${part.thicknessMm} mm`
                    : `${part.widthMm} × ${part.heightMm} × ${part.thicknessMm} mm`}
                </span>
                <strong role="cell">{part.quantity}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section framing-section" id="framing">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Framing · {compiled.framing.status}</span>
              <h2>{locale === "sr" ? "Raspored letvi i nosača" : "Framing and support schedule"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Dužine su izvedene iz geometrije modela. Profil rama i baze je V1 projektantska pretpostavka i ostaje jasno označen kao PROVISIONAL dok ne prođe engineering review i fizičku proveru."
                : "Lengths are derived from model geometry. Frame and base profiles are a V1 design assumption and remain explicitly PROVISIONAL until engineering review and physical validation."}
            </p>
          </div>

          <div className="framing-summary">
            <div>
              <span>{locale === "sr" ? "Profil rama" : "Frame profile"}</span>
              <strong>{compiled.framing.frameProfileMm[0]} × {compiled.framing.frameProfileMm[1]} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Profil baze" : "Base profile"}</span>
              <strong>{compiled.framing.baseProfileMm[0]} × {compiled.framing.baseProfileMm[1]} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Max osni razmak V1" : "V1 max stud spacing"}</span>
              <strong>≈ {compiled.framing.maxStudSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Ukupna linearna dužina" : "Total linear length"}</span>
              <strong>{compiled.framing.totalLinearM.toFixed(1)} m</strong>
            </div>
          </div>

          <div className="cut-table framing-table" role="table" aria-label={locale === "sr" ? "Raspored letvi" : "Framing schedule"}>
            <div className="cut-row cut-head" role="row">
              <span role="columnheader">ID</span>
              <span role="columnheader">{locale === "sr" ? "Element" : "Member"}</span>
              <span role="columnheader">{locale === "sr" ? "Profil × dužina" : "Profile × length"}</span>
              <span role="columnheader">{locale === "sr" ? "Kom." : "Qty"}</span>
            </div>
            {compiled.linearParts.map((part) => (
              <div className="cut-row" role="row" key={part.id}>
                <code role="cell">{part.id}</code>
                <span role="cell">
                  <strong>{locale === "sr" ? part.nameSr : part.nameEn}</strong>
                  <small>{part.provenance}</small>
                </span>
                <span role="cell">{part.profileMm[0]} × {part.profileMm[1]} mm · {part.lengthMm} mm</span>
                <strong role="cell">{part.quantity}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section hardware-section" id="hardware">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Hardware · {compiled.hardware.status}</span>
              <h2>{locale === "sr" ? "Pričvršćivači i servisni krov" : "Fasteners and service roof"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Količine i geometrija su V1 radionički plan. Razmak pričvršćivača koristi APA referentni obrazac kao konzervativan početak, ali nije sertifikovan fastening design ovog proizvoda."
                : "Quantities and geometry are a V1 workshop plan. Fastener spacing uses an APA reference pattern as a conservative starting point, but it is not a certified fastening design for this product."}
            </p>
          </div>

          <div className="framing-summary hardware-summary">
            <div>
              <span>{locale === "sr" ? "Razmak na ivici" : "Edge spacing"}</span>
              <strong>≈ {compiled.hardware.edgeSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Razmak u polju" : "Field spacing"}</span>
              <strong>≈ {compiled.hardware.fieldSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Spoj ploča" : "Panel joint gap"}</span>
              <strong>{compiled.hardware.panelJointGapMm} mm</strong>
            </div>
          </div>

          <div className="cut-table hardware-table" role="table" aria-label={locale === "sr" ? "Hardware lista" : "Hardware schedule"}>
            <div className="cut-row cut-head" role="row">
              <span role="columnheader">ID</span>
              <span role="columnheader">{locale === "sr" ? "Stavka" : "Item"}</span>
              <span role="columnheader">{locale === "sr" ? "Količina" : "Quantity"}</span>
              <span role="columnheader">{locale === "sr" ? "Status" : "Status"}</span>
            </div>
            {compiled.hardwareItems.map((item) => (
              <div className="cut-row" role="row" key={item.id}>
                <code role="cell">{item.id}</code>
                <span role="cell">
                  <strong>{locale === "sr" ? item.nameSr : item.nameEn}</strong>
                  <small>{locale === "sr" ? item.notesSr : item.notesEn}</small>
                </span>
                <span role="cell">
                  {item.quantity.toFixed(item.unit === "m" ? 2 : 0)} {item.unit === "m" ? "m" : (locale === "sr" ? "kom." : "pcs")}
                </span>
                <strong role="cell">{item.provenance}</strong>
              </div>
            ))}
          </div>

          <div className="hardware-reference">
            <span>{locale === "sr" ? "Referentni obrazac pričvršćivanja" : "Fastening reference pattern"}</span>
            <a
              href={sources[compiled.hardware.fastenerReferenceSourceId]?.url}
              target="_blank"
              rel="noreferrer"
            >
              {sources[compiled.hardware.fastenerReferenceSourceId]?.publisher} · {sources[compiled.hardware.fastenerReferenceSourceId]?.title} ↗
            </a>
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
          <BuildGuide
            modelId={model.id}
            version={model.version}
            steps={compiled.buildSteps}
            locale={locale}
          />
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
