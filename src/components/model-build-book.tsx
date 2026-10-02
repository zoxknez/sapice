import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import {sources} from "@/data/sources";
import {BuildGuide} from "@/components/build-guide";
import {compiledSourceIds} from "@/lib/provenance";
import {
  cutPartMaterialLabel,
  cutPartNote,
  hardwareItemName,
  hardwareItemNote,
  linearPartNote,
  planStatusLabel,
  provenanceLabel
} from "@/lib/model-presentation";

const workshopMm = (value: number) => String(Math.round(value * 10) / 10);
const workshopNote = (value: string) => value.replace(/\b\d+\.\d{2,}\b/g, (number) => workshopMm(Number(number)));

export function ModelBuildBook({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const model = compiled.model;
  const referencedSources = compiledSourceIds(compiled).map((id) => sources[id]).filter(Boolean);

  return (
    <>
      <section className="section tone-soft" id="inside">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Izvedena geometrija" : "Compiled geometry"}</span>
              <h2>{locale === "sr" ? "Korisni unutrašnji prostor" : "Usable interior space"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Ove vrednosti nisu ručno upisane. Kompajler ih izvodi iz spoljašnjih mera i debljine konstrukcije."
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
            <div><span>{locale === "sr" ? "Po maksimalnom kapacitetu" : "Per max capacity animal"}</span><strong>{compiled.internal.floorAreaPerMaxAnimalM2.toFixed(2)} m²</strong></div>
          </div>
          <p className="metric-disclaimer">
            {locale === "sr"
              ? "Površina i zapremina po životinji geometrijske su mere za poređenje modela. Ne predstavljaju veterinarski ili zakonski minimum niti potvrdu dobrobiti životinje."
              : "Per-animal area and volume are geometric comparison metrics. They are not veterinary, legal or welfare minimums."}
          </p>
        </div>
      </section>

      <section className="section" id="cut-list">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Krojna lista · izlaz kompajlera" : "Cut list · compiler output"}</span>
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
            {compiled.cutParts.map((part) => {
              const material = cutPartMaterialLabel(part, locale);
              const note = cutPartNote(part, locale);
              return (
                <div className="cut-row" role="row" key={part.id}>
                  <code role="cell">{part.id}</code>
                  <span role="cell">
                    <strong>{locale === "sr" ? part.nameSr : part.nameEn}</strong>
                    <small>
                      {part.shape === "trapezoid"
                        ? `${material} · ${locale === "sr" ? "trapezni oblik" : "trapezoid shape"}`
                        : material}
                      {note ? ` · ${workshopNote(note)}` : ""}
                    </small>
                  </span>
                  <span role="cell">
                    {part.shape === "trapezoid" && part.trapezoidRearHeightMm !== undefined
                      ? `${workshopMm(part.widthMm)} × Hf ${workshopMm(part.heightMm)} / Hr ${workshopMm(part.trapezoidRearHeightMm)} × ${workshopMm(part.thicknessMm)} mm`
                      : `${workshopMm(part.widthMm)} × ${workshopMm(part.heightMm)} × ${workshopMm(part.thicknessMm)} mm`}
                  </span>
                  <strong role="cell">{part.quantity}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section framing-section" id="framing">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Ram" : "Framing"} · {planStatusLabel(compiled.framing.status, locale)}</span>
              <h2>{locale === "sr" ? "Raspored letvi i nosača" : "Framing and support schedule"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Dužine su izvedene iz geometrije modela. Profili rama i baze su projektantska pretpostavka V1 i ostaju označeni kao privremeni dok ih ne pregleda stručnjak i dok ne prođu fizičku proveru."
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
              <span>{locale === "sr" ? "Uzdužni nosači baze" : "Base runners"}</span>
              <strong>{compiled.framing.baseRunnerPositionsXmm.length}</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Oslonaca baze" : "Base support posts"}</span>
              <strong>
                {compiled.framing.baseRunnerPositionsXmm.length *
                  compiled.framing.baseSupportPositionsZmm.length}
              </strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Visina oslonca" : "Support post height"}</span>
              <strong>{compiled.framing.baseSupportPostHeightMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Najveći razmak zidnih stubova" : "Max wall stud spacing"}</span>
              <strong>≈ {compiled.framing.maxStudSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Najveći razmak podnih poprečnih nosača" : "Max floor joist spacing"}</span>
              <strong>≈ {compiled.framing.maxFloorJoistSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Najveći razmak krovnih nosača" : "Max roof rafter spacing"}</span>
              <strong>≈ {compiled.framing.maxRoofRafterSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Najveći razmak nosača baze" : "Max runner spacing"}</span>
              <strong>≈ {compiled.framing.maxBaseRunnerSpacingMm} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Najveći razmak redova oslonaca" : "Max support-row spacing"}</span>
              <strong>≈ {compiled.framing.maxBasePostSpacingMm} mm</strong>
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
            {compiled.linearParts.map((part) => {
              const note = linearPartNote(part, locale);
              return (
                <div className="cut-row" role="row" key={part.id}>
                  <code role="cell">{part.id}</code>
                  <span role="cell">
                    <strong>{locale === "sr" ? part.nameSr : part.nameEn}</strong>
                    <small>
                      {provenanceLabel(part.provenance, locale)}
                      {typeof part.positionMm === "number" ? ` · @ ${part.positionMm.toFixed(0)} mm` : ""}
                      {typeof part.positionXmm === "number" && typeof part.positionZmm === "number"
                        ? ` · X ${part.positionXmm.toFixed(0)} / Z ${part.positionZmm.toFixed(0)} mm`
                        : ""}
                      {note ? ` · ${note}` : ""}
                    </small>
                  </span>
                  <span role="cell">{part.profileMm[0]} × {part.profileMm[1]} mm · {workshopMm(part.lengthMm)} mm</span>
                  <strong role="cell">{part.quantity}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section hardware-section" id="hardware">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Okov" : "Hardware"} · {planStatusLabel(compiled.hardware.status, locale)}</span>
              <h2>{locale === "sr" ? "Pričvršćivači, servisni krov i voda" : "Fasteners, service roof and water"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Količine i geometrija čine radionički plan V1. Razmak pričvršćivača koristi APA referentni obrazac kao konzervativnu polaznu tačku, ali ne predstavlja potvrđen proračun pričvršćivanja za ovaj proizvod."
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
            <div>
              <span>{locale === "sr" ? "Nagib krova" : "Roof slope"}</span>
              <strong>{compiled.roofWeathering.slopeDegrees.toFixed(1)}°</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Smer oticanja" : "Runoff edge"}</span>
              <strong>{locale === "sr" ? "pozadi" : "rear"}</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Zadnja kapna ivica" : "Rear drip edge"}</span>
              <strong>{compiled.roofWeathering.rearDripEdgeLengthM.toFixed(2)} m</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Osa šarke od prednje ivice" : "Hinge axis from front edge"}</span>
              <strong>{compiled.hardware.hingeAxisFromPanelFrontMm.toFixed(0)} mm</strong>
            </div>
            <div>
              <span>{locale === "sr" ? "Osa zatvarača od prednje ivice" : "Latch axis from front edge"}</span>
              <strong>{compiled.hardware.latchAxisFromPanelFrontMm.toFixed(0)} mm</strong>
            </div>
          </div>

          <div className="cut-table hardware-table" role="table" aria-label={locale === "sr" ? "Spisak okova" : "Hardware schedule"}>
            <div className="cut-row cut-head" role="row">
              <span role="columnheader">ID</span>
              <span role="columnheader">{locale === "sr" ? "Stavka" : "Item"}</span>
              <span role="columnheader">{locale === "sr" ? "Količina" : "Quantity"}</span>
              <span role="columnheader">{locale === "sr" ? "Status" : "Status"}</span>
            </div>
            {compiled.hardwareItems.map((item) => {
              const name = hardwareItemName(item, locale);
              const note = hardwareItemNote(item, locale);
              return (
                <div className="cut-row" role="row" key={item.id}>
                  <code role="cell">{item.id}</code>
                  <span role="cell">
                    <strong>{name}</strong>
                    <small>{note}</small>
                  </span>
                  <span role="cell">
                    {item.quantity.toFixed(item.unit === "m" ? 2 : 0)} {item.unit === "m" ? "m" : (locale === "sr" ? "kom." : "pcs")}
                  </span>
                  <strong role="cell">{provenanceLabel(item.provenance, locale)}</strong>
                </div>
              );
            })}
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
          <div className="hardware-reference">
            <span>{locale === "sr" ? "Provera zaštite krova od vode" : "Roof weathering gate"}</span>
            <a
              href={sources[compiled.roofWeathering.referenceSourceId]?.url}
              target="_blank"
              rel="noreferrer"
            >
              {sources[compiled.roofWeathering.referenceSourceId]?.publisher} · {sources[compiled.roofWeathering.referenceSourceId]?.title} ↗
            </a>
            <small>
              {locale === "sr"
                ? "Kompajlirani nagib određuje geometriju, ali izabrani krovni proizvod mora eksplicitno dozvoljavati taj nagib i definisati slojeve, preklop, pričvršćivanje i ivice."
                : "The compiled slope defines geometry, but the selected roofing product must explicitly permit that slope and define layers, overlaps, fastening and edge details."}
            </small>
          </div>
        </div>
      </section>

      <section className="section tone" id="build-guide">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Redosled izrade" : "Build sequence"}</span>
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
            planFingerprint={compiled.planFingerprint}
            steps={compiled.buildSteps}
            locale={locale}
          />
        </div>
      </section>

      <section className="section" id="sources">
        <div className="shell source-layout">
          <div>
            <span className="kicker">{locale === "sr" ? "Poreklo podataka" : "Provenance"}</span>
            <h2>{locale === "sr" ? "Izvori i ograničenja" : "Sources and limitations"}</h2>
            <p className="page-lead source-intro">
              {locale === "sr"
                ? "Izvor potkrepljuje metod ili smernicu za dobrobit životinje, ali ne pretvara ovaj konkretan model u sertifikovan proizvod. Fizička validacija ima poseban status."
                : "A source supports a method or welfare guideline; it does not turn this specific model into a certified product. Physical validation has a separate status."}
            </p>
          </div>
          <div className="source-list">
            {referencedSources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>{source.publisher} · {locale === "sr" ? "nivo" : "Tier"} {source.tier}</span>
                <strong>{source.title}</strong>
                <small>{locale === "sr" ? source.notesSr : source.notes}</small>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
