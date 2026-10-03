import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {PracticalModel} from "@/lib/practical/domain";
import {compilePracticalModel} from "@/lib/practical/compiler";
import {moistureProfile} from "@/lib/practical/moisture";
import {whenNotToUse, whoFor} from "@/lib/practical/presentation";
import {inspectionFrequencyLabel} from "@/lib/practical/inspection";
import {catalogEntry} from "@/lib/catalog/entries";
import {taxonomyLabel} from "@/lib/catalog/taxonomy";
import {getLibraryMaterial, materialLibrary} from "@/data/material-library";
import {sources} from "@/data/sources";
import {beddingRecommendations} from "@/data/bedding";
import {upgradesFrom, upgradesInto} from "@/data/upgrades";
import {evaluateSubstitute, substituteCandidates, substituteRoleFor} from "@/lib/catalog/substitutes";
import {animalSizeClassLabel} from "@/lib/model-labels";
import {validationStageLabel} from "@/lib/validation-labels";
import {validationStateSchema} from "@/lib/domain";
import {DesignClassTag, ValidationSeal} from "@/components/catalog/badges";
import {PracticalThumbnail} from "@/components/catalog/practical-thumbnail";
import {formatBuildTime, toolsLabel} from "@/components/catalog/catalog-card";
import {unitLabel} from "@/components/catalog/units";
import {WorkshopCompare} from "@/components/catalog/workshop-compare";
import {PracticalDrawing} from "@/components/practical/practical-drawing";
import {PracticalSheets} from "@/components/practical/practical-sheets";
import {PlacementChecklist} from "@/components/field/placement-checklist";
import {ModelSubnav} from "@/components/model-subnav";
import {BuildGuide} from "@/components/build-guide";
import {CostCalculator} from "@/components/cost-calculator";
import {PrintPlanButton} from "@/components/print-plan-button";
import {SharePlanButton} from "@/components/share-plan-button";
import type {CostLine} from "@/lib/costing";
import type {NestablePart} from "@/lib/nesting";

const costUnit = {SHEET: "sheet", AREA_M2: "m2", LINEAR_M: "m", PIECE: "item", PACK: "item", BALE: "item"} as const;

export function PracticalModelPage({model, locale}: {model: PracticalModel; locale: AppLocale}) {
  const isSr = locale === "sr";
  const compiled = compilePracticalModel(model);
  const entry = catalogEntry(model.slug);
  if (!entry) throw new Error(`Catalog entry missing for ${model.slug}`);
  const copy = model.translations[locale];
  const emergency = model.designClass === "EMERGENCY";
  const has = (coverage: (typeof model.coverage)[number]) => model.coverage.includes(coverage);
  const moisture = moistureProfile(model, compiled);
  const exposedOutdoor = model.exposure !== "COVERED_ONLY";
  const bedding = beddingRecommendations({animal: model.animal, season: model.seasons.includes("SUMMER") && !model.seasons.includes("WINTER") ? "SUMMER" : "WINTER", exposedOutdoor});
  const outgoing = upgradesFrom(model.slug);
  const incoming = upgradesInto(model.slug);
  const partsByMaterial: Record<string, NestablePart[]> = {};
  for (const part of compiled.cutParts) {
    if (materialLibrary[part.materialId]?.inventoryUnit === "SHEET") (partsByMaterial[part.materialId] ??= []).push(part);
  }
  const costLines: CostLine[] = compiled.bom.map((line) => ({
    id: line.id,
    labelSr: getLibraryMaterial(line.materialId).nameSr,
    labelEn: getLibraryMaterial(line.materialId).nameEn,
    quantity: line.quantity,
    unit: costUnit[line.unit],
    noteSr: line.noteSr,
    noteEn: line.noteEn
  }));
  const thermalSourceIds = compiled.thermal.assemblies.flatMap((assembly) => assembly.knownLayers.map((layer) => layer.materialId))
    .flatMap((id) => {
      const thermal = getLibraryMaterial(id).thermal;
      return thermal.status === "KNOWN" ? thermal.sourceIds : [];
    });
  const sourceIds = [...new Set([...model.sourceIds, ...thermalSourceIds])];
  const substituteRows = [...new Set(compiled.bom.map((line) => line.materialId))]
    .filter((id) => substituteCandidates[id])
    .map((id) => {
      const thickness = compiled.cutParts.find((part) => part.materialId === id)?.thicknessMm
        ?? (model.params.family === "TOTE_IN_TOTE" && model.params.foam?.materialId === id ? model.params.foam.thicknessMm : 0);
      return {
        id,
        thickness,
        results: substituteCandidates[id].slice(0, 3).map((candidate) => evaluateSubstitute(id, candidate, substituteRoleFor(id), thickness || 30))
      };
    });

  const subnav = [
    {id: "overview", label: isSr ? "Pregled" : "Overview"},
    {id: "geometry", label: isSr ? "Mere" : "Dimensions"},
    {id: "materials", label: isSr ? "Materijal" : "Materials"},
    ...(has("CUT_LIST") ? [{id: "cut-list", label: isSr ? "Krojna lista" : "Cut list"}] : []),
    ...(has("NESTING") ? [{id: "nesting", label: isSr ? "Raspored" : "Sheets"}] : []),
    ...(!emergency && compiled.thermal.status !== "NOT_APPLICABLE" ? [{id: "thermal", label: isSr ? "Slojevi i termika" : "Layers & thermal"}] : []),
    {id: "moisture", label: isSr ? "Vlaga" : "Moisture"},
    ...(has("COST") && !emergency ? [{id: "cost", label: isSr ? "Trošak" : "Cost"}] : []),
    {id: "placement", label: isSr ? "Postavljanje" : "Placement"},
    {id: "care", label: isSr ? "Posteljina i održavanje" : "Bedding & care"},
    {id: "upgrades", label: isSr ? "Nadogradnja" : "Upgrades"},
    {id: "build-guide", label: isSr ? "Izrada" : "Build"},
    {id: "sources", label: isSr ? "Izvori" : "Sources"}
  ];

  const thermalStatusCopy = {
    COMPLETE: isSr ? "Potpuna procena: svi slojevi imaju izvorovanu toplotnu provodljivost." : "Complete estimate: every layer has a sourced thermal conductivity.",
    INCOMPLETE: isSr ? "Delimična procena: neki slojevi su nepoznati, pa se U-vrednost ne računa. Prikazan je samo otpor poznatih slojeva." : "Partial estimate: some layers are unknown, so no U-value is calculated. Only the resistance of known layers is shown.",
    UNAVAILABLE: isSr ? "Termička procena nije dostupna: nema kontrolisanog izolacionog sloja." : "No thermal estimate: there is no controlled insulation layer.",
    NOT_APPLICABLE: isSr ? "Ne primenjuje se na otvorenu konstrukciju." : "Not applicable to an open structure."
  }[compiled.thermal.status];

  return (
    <>
      <section className={`model-detail-hero practical-hero${emergency ? " emergency-hero" : ""}`} id="overview">
        <div className="shell detail-grid">
          <div className="detail-summary">
            <div className="practical-badges">
              <DesignClassTag designClass={model.designClass} locale={locale} />
              <ValidationSeal state={model.validationState} locale={locale} />
            </div>
            <h1>{copy.name}</h1>
            <p>{copy.description}</p>
            {emergency && (
              <div className="emergency-only" role="note">
                <strong>{isSr ? "SAMO HITNO" : "EMERGENCY ONLY"}</strong>
                <ul>
                  <li>{isSr ? "Mora ostati suvo." : "It must stay dry."}</li>
                  <li>{isSr ? "Mora biti podignuto od tla." : "It must be raised off the ground."}</li>
                  <li>{isSr ? "Nije zamena za dugotrajno vodootporno sklonište." : "It is not a replacement for a durable waterproof shelter."}</li>
                  <li>{isSr ? "Pregledajte ga svaki dan." : "Inspect it every day."}</li>
                  <li>{isSr ? "Zamenite ga čim se navlaži ili deformiše." : "Replace it as soon as it gets damp or deforms."}</li>
                </ul>
              </div>
            )}
            {!emergency && (
              <div className="notice model-hero-notice" role="note">
                <p>
                  {model.seasons.includes("SUMMER") && !model.seasons.includes("WINTER")
                    ? (isSr ? "Velika vrućina traži hladniji bezbedan prostor, a ne bolju zatvorenu kućicu. Obezbedite senku, vodu i slobodan izlaz." : "Extreme heat needs a cooler safe space, not a better closed house. Provide shade, water and freedom to leave.")
                    : model.animal === "dog"
                      ? (isSr ? "Ovo je pomoćno spoljašnje sklonište. Tokom opasne hladnoće ili vrućine psu obezbedite siguran prostor u zatvorenom." : "This is an auxiliary outdoor shelter. During dangerous cold or heat give the dog a safe indoor space.")
                      : (isSr ? "Topla kućica koja se vlaži može biti lošija od jednostavnije kućice koja ostaje suva." : "A warm shelter that gets damp can be worse than a simpler one that stays dry.")}
                </p>
                <p>
                  {isSr ? "Status „Podaci provereni” znači samo proveru podataka i proračuna; model nije fizički izrađen ni testiran." : "“Data validated” means only the data and calculations are checked; the model has not been built or tested physically."}
                </p>
              </div>
            )}
            <div className="metric-grid">
              <div>
                <span>{model.animal === "dog" ? (isSr ? "Veličina psa" : "Dog size") : (isSr ? "Kapacitet" : "Capacity")}</span>
                <strong>{model.animal === "dog" ? animalSizeClassLabel(model.animalSizeClass, locale) : `${model.capacity.recommended}${model.capacity.max > model.capacity.recommended ? `–${model.capacity.max}` : ""}`}</strong>
              </div>
              <div><span>{isSr ? "Spoljašnje mere" : "Outside size"}</span><strong>{compiled.envelope.widthMm} × {compiled.envelope.depthMm}</strong></div>
              <div><span>{isSr ? "Izrada" : "Build"}</span><strong>{taxonomyLabel("difficulty", model.difficulty, locale)}</strong></div>
              <div><span>{isSr ? "Vreme (procena)" : "Time (estimate)"}</span><strong>{formatBuildTime(model.buildTimeMinutes)}</strong></div>
            </div>
            <div className="model-meta-line">
              <span>{isSr ? "model" : "model"} v{model.version}</span>
              <span>{isSr ? "kompajler" : "compiler"} {compiled.compilerVersion}</span>
              <span>{isSr ? "ID plana" : "plan"} {compiled.planFingerprint}</span>
              <span>{taxonomyLabel("family", model.params.family, locale)}</span>
              <span>{model.seasons.map((season) => taxonomyLabel("season", season, locale)).join(" · ")}</span>
            </div>
            <div className="detail-actions">
              <PrintPlanButton locale={locale} />
              <SharePlanButton locale={locale} title={copy.name} />
            </div>
          </div>
          <div className="viewer practical-visual">
            <PracticalThumbnail sketch={entry.sketch} name={copy.name} locale={locale} />
            <p className="practical-visual-note">
              {isSr ? "Ovaj model nema 3D prikaz; crtež i mere ispod su potpun opis konstrukcije." : "This model has no 3D view; the drawing and dimensions below fully describe the construction."}
            </p>
          </div>
        </div>
      </section>

      <ModelSubnav items={subnav} locale={locale} />

      <section className="section">
        <div className="shell who-grid">
          <div>
            <span className="kicker">{isSr ? "Za koga je" : "Who this is for"}</span>
            <ul className="plain-list">{whoFor(model, locale).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <span className="kicker">{isSr ? "Kada ga ne koristiti" : "When not to use it"}</span>
            <ul className="plain-list warn-list">{whenNotToUse(model, locale).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <span className="kicker">{isSr ? "Alat i proračuni" : "Tools and calculations"}</span>
            <dl className="data-list compact-list">
              <div><dt>{isSr ? "Obavezan alat" : "Required tools"}</dt><dd>{toolsLabel(entry, locale)}</dd></div>
              <div><dt>{isSr ? "Klasa budžeta" : "Budget class"}</dt><dd>{taxonomyLabel("budgetClass", model.budgetClass, locale)}</dd></div>
              <div><dt>{isSr ? "Lokacija" : "Location"}</dt><dd>{taxonomyLabel("exposure", model.exposure, locale)}</dd></div>
              <div><dt>{isSr ? "Podržani proračuni" : "Supported calculations"}</dt><dd>{model.coverage.map((item) => taxonomyLabel("coverage", item, locale)).join(", ")}</dd></div>
            </dl>
            <small className="metric-disclaimer">{isSr ? "Vreme izrade je planska procena, ne obećanje." : "Build time is a planning estimate, not a promise."}</small>
          </div>
        </div>
      </section>

      <section className="section tone-soft" id="geometry">
        <div className="shell">
          <span className="kicker">{isSr ? "Geometrija" : "Geometry"}</span>
          <h2>{isSr ? "Mere" : "Dimensions"}</h2>
          <PracticalDrawing compiled={compiled} locale={locale} />
        </div>
      </section>

      <section className="section" id="materials">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{isSr ? "Spisak materijala · izlaz kompajlera" : "Bill of materials · compiler output"}</span>
              <h2>{isSr ? "Šta imate, a šta treba nabaviti" : "What you have and what to obtain"}</h2>
            </div>
            <p>
              {isSr
                ? "Količine dolaze iz geometrije modela; stavke označene kao pretpostavka su planske rezerve. Iskorišćen materijal mora proći kontrolnu listu."
                : "Quantities come from the model geometry; items marked as assumptions are planning allowances. Reused material must pass the checklist."}
            </p>
          </div>
          <WorkshopCompare entry={entry} locale={locale} partsByMaterial={partsByMaterial} />
          <ul className="bom-basis">
            {compiled.bom.map((line) => (
              <li key={line.id}>
                <strong>{isSr ? getLibraryMaterial(line.materialId).nameSr : getLibraryMaterial(line.materialId).nameEn}</strong>
                <span>{line.quantity} {unitLabel(line.unit, locale)}</span>
                <small>
                  {line.basis === "NESTED" ? (isSr ? "raspored na pločama" : "sheet nesting") : line.basis === "GEOMETRY" ? (isSr ? "iz geometrije" : "from geometry") : (isSr ? "pretpostavka" : "assumption")}
                  {" · "}{isSr ? line.noteSr : line.noteEn}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {has("CUT_LIST") && (
        <section className="section tone-soft" id="cut-list">
          <div className="shell">
            <span className="kicker">{isSr ? "Krojna lista" : "Cut list"}</span>
            <h2>{isSr ? "Delovi za sečenje" : "Parts to cut"}</h2>
            <div className="cut-table" role="table" aria-label={isSr ? "Krojna lista" : "Cut list"}>
              <div className="cut-row cut-head" role="row">
                <span role="columnheader">ID</span>
                <span role="columnheader">{isSr ? "Deo" : "Part"}</span>
                <span role="columnheader">{isSr ? "Dimenzije" : "Dimensions"}</span>
                <span role="columnheader">{isSr ? "Kom." : "Qty"}</span>
              </div>
              {compiled.cutParts.map((part) => (
                <div className="cut-row" role="row" key={part.id}>
                  <code role="cell">{part.id}</code>
                  <span role="cell">
                    <strong>{isSr ? part.nameSr : part.nameEn}</strong>
                    {(part.notesSr || part.shape === "trapezoid") && (
                      <small>
                        {part.shape === "trapezoid" ? (isSr ? "kosa gornja ivica" : "sloped top edge") : ""}
                        {part.shape === "trapezoid" && part.notesSr ? " · " : ""}
                        {isSr ? part.notesSr : part.notesEn}
                      </small>
                    )}
                  </span>
                  <span role="cell">
                    {part.shape === "trapezoid" && part.trapezoidRearHeightMm !== undefined
                      ? `${part.widthMm} × ${part.heightMm}/${part.trapezoidRearHeightMm} × ${part.thicknessMm} mm`
                      : `${part.widthMm} × ${part.heightMm} × ${part.thicknessMm} mm`}
                  </span>
                  <strong role="cell">{part.quantity}</strong>
                </div>
              ))}
            </div>
            {compiled.linearParts.length > 0 && (
              <div className="cut-table linear-table" role="table" aria-label={isSr ? "Letve i stubovi" : "Battens and posts"}>
                {compiled.linearParts.map((part) => (
                  <div className="cut-row" role="row" key={part.id}>
                    <code role="cell">{part.id}</code>
                    <span role="cell"><strong>{isSr ? part.nameSr : part.nameEn}</strong></span>
                    <span role="cell">{part.profileMm[0]} × {part.profileMm[1]} mm · {part.lengthMm} mm</span>
                    <strong role="cell">{part.quantity}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {has("NESTING") && (
        <section className="section" id="nesting">
          <div className="shell">
            <span className="kicker">{isSr ? "Raspored na pločama" : "Sheet nesting"}</span>
            <h2>{isSr ? "Raspored delova na pločama" : "Parts on sheets"}</h2>
            <p className="section-intro">{isSr ? "Planski formati ploča su pretpostavka; proverite format kod dobavljača. Kosi delovi zauzimaju svoj pravougaoni omotač." : "Sheet formats are planning assumptions; check your supplier's format. Sloped parts occupy their rectangular envelope."}</p>
            <PracticalSheets groups={compiled.nesting} locale={locale} />
          </div>
        </section>
      )}

      {!emergency && compiled.thermal.status !== "NOT_APPLICABLE" && (
        <section className="section tone-soft" id="thermal">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="kicker">{isSr ? "Slojevi i termika" : "Layers and thermal"}</span>
                <h2>{isSr ? "Poznati i nepoznati slojevi" : "Known and unknown layers"}</h2>
              </div>
              <p>{thermalStatusCopy}</p>
            </div>
            <div className="layer-grid">
              {compiled.thermal.assemblies.map((assembly) => (
                <article key={assembly.kind} className="layer-card">
                  <h3>{assembly.kind === "wall" ? (isSr ? "Zid" : "Wall") : assembly.kind === "floor" ? (isSr ? "Pod" : "Floor") : (isSr ? "Krov" : "Roof")}</h3>
                  <ul>
                    {[...assembly.knownLayers, ...assembly.unknownLayers].map((layer, index) => (
                      <li key={`${layer.materialId}-${index}`} className={layer.resistanceM2KW === null ? "layer-unknown" : ""}>
                        <span>{isSr ? getLibraryMaterial(layer.materialId).nameSr : getLibraryMaterial(layer.materialId).nameEn} · {layer.thicknessMm} mm{layer.thicknessProvenance === "ASSUMPTION" ? (isSr ? " (pretpostavka)" : " (assumed)") : ""}</span>
                        <strong>{layer.resistanceM2KW === null ? (isSr ? "nepoznato" : "unknown") : `R ${layer.resistanceM2KW.toFixed(2)}`}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="layer-total">
                    {isSr ? "Otpor poznatih slojeva" : "Known-layer resistance"}: <strong>{assembly.knownLayerResistanceM2KW.toFixed(2)} m²K/W</strong>
                    {assembly.uValueWm2K !== null && <> · U <strong>{assembly.uValueWm2K.toFixed(2)} W/m²K</strong></>}
                  </p>
                </article>
              ))}
            </div>
            <div className="thermal-limitations">
              <strong>{isSr ? "Nije uračunato" : "Not included"}</strong>
              <ul>{(isSr ? compiled.thermal.excludedSr : compiled.thermal.excludedEn).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            {compiled.thermal.assumptionsSr.length > 0 && (
              <div className="thermal-limitations">
                <strong>{isSr ? "Pretpostavke" : "Assumptions"}</strong>
                <ul>{(isSr ? compiled.thermal.assumptionsSr : compiled.thermal.assumptionsEn).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            <p className="metric-disclaimer">{isSr ? "Procena nije temperaturna garancija i ne tvrdi da je sklonište bezbedno do bilo koje temperature." : "The estimate is not a temperature guarantee and does not claim the shelter is safe to any temperature."}</p>
          </div>
        </section>
      )}

      <section className="section" id="moisture">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{isSr ? "Voda i vlaga" : "Water and moisture"}</span>
              <h2>{isSr ? "Izloženost vremenu" : "Weather exposure"}</h2>
            </div>
            <p>{isSr ? "Topla kućica koja se vlaži može biti lošija od jednostavnije kućice koja ostaje suva. Ovo je objašnjenje, a ne proračun kondenzacije." : "A warm shelter that gets damp can be worse than a simpler one that stays dry. This is an explanation, not a condensation calculation."}</p>
          </div>
          <ul className="check-grid">
            {moisture.map((check) => (
              <li key={check.id} className={`check-${check.status.toLowerCase()}`}>
                <span className="check-mark" aria-hidden="true">{check.status === "OK" ? "✓" : check.status === "ATTENTION" ? "!" : "–"}</span>
                <span>
                  <strong>{{GROUND_CONTACT: isSr ? "Kontakt sa tlom" : "Ground contact", SPLASH: isSr ? "Prskanje kiše" : "Rain splash", ROOF_DRAINAGE: isSr ? "Odvod vode sa krova" : "Roof drainage", ENTRY_RAIN: isSr ? "Kiša na ulazu" : "Rain at the entrance", DRYING: isSr ? "Sušenje" : "Drying", ABSORBENT_INTERIOR: isSr ? "Upijajući materijal" : "Absorbent material", MAINTENANCE_ACCESS: isSr ? "Pristup za održavanje" : "Maintenance access"}[check.id]}</strong>
                  <small>{isSr ? check.sr : check.en}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {has("COST") && !emergency && <CostCalculator modelId={model.id} lines={costLines} locale={locale} />}

      <section className="section tone-soft" id="placement">
        <div className="shell">
          <span className="kicker">{isSr ? "Postavljanje" : "Placement"}</span>
          <h2>{isSr ? "Proverite mesto" : "Check the spot"}</h2>
          <PlacementChecklist locale={locale} context={{animal: model.animal, season: model.seasons.includes("SUMMER") && !model.seasons.includes("WINTER") ? "SUMMER" : "WINTER"}} />
        </div>
      </section>

      <section className="section" id="care">
        <div className="shell care-grid">
          <div>
            <span className="kicker">{isSr ? "Posteljina" : "Bedding"}</span>
            <h2>{isSr ? "Šta staviti unutra" : "What goes inside"}</h2>
            <ul className="bedding-list">
              {bedding.map(({option, verdict}) => (
                <li key={option.id} className={`bedding-${verdict.toLowerCase()}`}>
                  <span className="verdict">{verdict === "RECOMMENDED" ? (isSr ? "Preporučeno" : "Recommended") : verdict === "ACCEPTABLE" ? (isSr ? "Prihvatljivo" : "Acceptable") : (isSr ? "Ne preporučuje se" : "Not recommended")}</span>
                  <strong>{isSr ? option.nameSr : option.nameEn}</strong>
                  <small>{isSr ? option.moistureSr : option.moistureEn} {isSr ? option.replacementSr : option.replacementEn}</small>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="kicker">{isSr ? "Održavanje" : "Maintenance"}</span>
            <h2>{isSr ? "Raspored provere" : "Inspection schedule"}</h2>
            <ul className="inspection-list">
              {compiled.inspection.map((item) => (
                <li key={item.id}>
                  <span className={`frequency frequency-${item.frequency.toLowerCase()}`}>{inspectionFrequencyLabel[item.frequency][locale]}</span>
                  <span>{isSr ? item.sr : item.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section tone-soft" id="upgrades">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{isSr ? "Putanja nadogradnje" : "Upgrade path"}</span>
              <h2>{isSr ? "Kako dalje" : "Where to go next"}</h2>
            </div>
            <p>{isSr ? "Svaki korak navodi šta dodajete, šta dobijate i šta ostaje ograničenje. Novi model ima novi ID plana; izmena postojeće kućice nema kanonski plan." : "Each step states what you add, what you gain and what stays limited. A new model has a new plan ID; changing an existing build has no canonical plan."}</p>
          </div>
          {outgoing.length + incoming.length === 0 ? (
            <p>{isSr ? "Za ovaj model još nije definisana putanja nadogradnje." : "No upgrade path is defined for this model yet."}</p>
          ) : (
            <div className="upgrade-list">
              {incoming.map((edge) => {
                const from = catalogEntry(edge.from);
                return from ? (
                  <p key={edge.id} className="upgrade-from">
                    {isSr ? "Prethodni korak: " : "Previous step: "}
                    <Link href={{pathname: "/models/[slug]", params: {slug: from.slug}}}>{isSr ? from.nameSr : from.nameEn}</Link>
                  </p>
                ) : null;
              })}
              {outgoing.map((edge) => {
                const target = edge.to ? catalogEntry(edge.to) : null;
                return (
                  <article key={edge.id} className="upgrade-card">
                    <header>
                      <span className={`upgrade-kind kind-${edge.kind.toLowerCase()}`}>{edge.kind === "NEW_MODEL" ? (isSr ? "Novi model · novi ID plana" : "New model · new plan ID") : (isSr ? "Izmena postojeće kućice" : "In-place change")}</span>
                      {target ? (
                        <Link href={{pathname: "/models/[slug]", params: {slug: target.slug}}}>{isSr ? target.nameSr : target.nameEn} →</Link>
                      ) : (
                        <strong>{isSr ? edge.addsSr : edge.addsEn}</strong>
                      )}
                    </header>
                    <dl>
                      <div><dt>{isSr ? "Dodajete" : "You add"}</dt><dd>{isSr ? edge.addsSr : edge.addsEn}</dd></div>
                      <div><dt>{isSr ? "Dobijate" : "You gain"}</dt><dd>{isSr ? edge.gainsSr : edge.gainsEn}</dd></div>
                      <div><dt>{isSr ? "Ostaje ograničenje" : "Still limited"}</dt><dd>{isSr ? edge.limitsSr : edge.limitsEn}</dd></div>
                      {edge.newMaterialIds.length > 0 && (
                        <div><dt>{isSr ? "Novi materijal" : "New material"}</dt><dd>{edge.newMaterialIds.map((id) => (isSr ? getLibraryMaterial(id).nameSr : getLibraryMaterial(id).nameEn)).join(", ")}</dd></div>
                      )}
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
          {substituteRows.length > 0 && !emergency && (
            <div className="substitutes">
              <h3>{isSr ? "Nemate ovaj materijal?" : "Don't have this material?"}</h3>
              {substituteRows.map((row) => (
                <div key={row.id} className="substitute-row">
                  <strong>{isSr ? getLibraryMaterial(row.id).nameSr : getLibraryMaterial(row.id).nameEn}{row.thickness ? ` · ${row.thickness} mm` : ""}</strong>
                  <ul>
                    {row.results.map((result) => (
                      <li key={result.toId}>
                        <span>{isSr ? getLibraryMaterial(result.toId).nameSr : getLibraryMaterial(result.toId).nameEn}</span>
                        <small>
                          {result.kind === "THERMAL_EQUIVALENT"
                            ? (isSr
                              ? `približno isti otpor sloja uz ${result.requiredThicknessMm} mm${result.conservativeThicknessMm ? ` (konzervativno ${result.conservativeThicknessMm} mm)` : ""}; termička ekvivalencija nije konstrukciona`
                              : `about the same layer resistance at ${result.requiredThicknessMm} mm${result.conservativeThicknessMm ? ` (conservatively ${result.conservativeThicknessMm} mm)` : ""}; thermal equivalence is not structural`)
                            : isSr ? result.reasonSr : result.reasonEn}
                        </small>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link href="/materials" className="text-link">{isSr ? "Sve zamene i ograničenja materijala" : "All substitutes and material limits"} <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </div>
      </section>

      <section className="section tone" id="build-guide">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{isSr ? "Redosled izrade" : "Build sequence"}</span>
              <h2>{isSr ? "Koraci izrade" : "Build steps"}</h2>
            </div>
            <p>{isSr ? "Napredak se čuva u ovom pregledaču i vezan je za tačan ID plana; radi i bez interneta kada je stranica već otvorena." : "Progress is stored in this browser against the exact plan ID; it works offline once the page has been opened."}</p>
          </div>
          <BuildGuide modelId={model.id} planFingerprint={compiled.planFingerprint} steps={compiled.steps} locale={locale} />
        </div>
      </section>

      <section className="section" id="sources">
        <div className="shell source-layout">
          <div>
            <span className="kicker">{isSr ? "Poreklo podataka" : "Provenance"}</span>
            <h2>{isSr ? "Izvori i status provere" : "Sources and verification status"}</h2>
            <p className="page-lead source-intro">
              {isSr
                ? "Izvor potkrepljuje smernicu ili vrednost materijala, ali ne potvrđuje ovaj konkretan model. Mere kontejnera su pretpostavke, a vreme izrade planska procena."
                : "A source supports a guideline or material value, but it does not confirm this specific model. Container sizes are assumptions and build time is a planning estimate."}
            </p>
            <ol className="validation-mini">
              {validationStateSchema.options.map((state) => (
                <li key={state} className={state === model.validationState ? "current" : "pending"}>
                  {validationStageLabel(state, locale)}
                  <span>{state === model.validationState ? (isSr ? "trenutno" : "current") : (isSr ? "nije potvrđeno" : "not confirmed")}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="source-list">
            {sourceIds.map((id) => sources[id]).filter(Boolean).map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>{source.publisher} · {isSr ? "nivo" : "Tier"} {source.tier}</span>
                <strong>{source.title}</strong>
                <small>{isSr ? source.notesSr : source.notes}</small>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
