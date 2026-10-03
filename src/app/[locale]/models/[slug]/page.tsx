import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels, getShelterModel} from "@/data/models";
import {assemblyInsulationMm} from "@/data/assemblies";
import {sources} from "@/data/sources";
import {ShelterViewerLauncher} from "@/components/shelter-viewer-launcher";
import {ModelThumbnail} from "@/components/model-thumbnail";
import {TechnicalSketch} from "@/components/technical-sketch";
import {ModelBuildBook} from "@/components/model-build-book";
import {SheetLayout} from "@/components/sheet-layout";
import {CostCalculator} from "@/components/cost-calculator";
import {PrintPlanButton} from "@/components/print-plan-button";
import {SharePlanButton} from "@/components/share-plan-button";
import {PlanExportButtons} from "@/components/plan-export-buttons";
import {OperatingGuidance} from "@/components/operating-guidance";
import {StructuredData} from "@/components/structured-data";
import {ThermalScenario} from "@/components/thermal-scenario";
import {ModelValidationPanel, validationStageLabel} from "@/components/model-validation-panel";
import {VentilationProvision} from "@/components/ventilation-provision";
import {PrototypeEvidenceWorksheet} from "@/components/prototype-evidence-worksheet";
import {HeatingProvision} from "@/components/heating-provision";
import {ModelSubnav} from "@/components/model-subnav";
import {ModelCard} from "@/components/model-card";
import {Link} from "@/i18n/navigation";
import {heatingCounterpart, neighbouringModels} from "@/lib/related-models";
import {getPracticalModel, practicalModels} from "@/data/practical-models";
import {PracticalModelPage} from "@/components/practical/practical-model-page";
import {compilePracticalModel} from "@/lib/practical/compiler";
import {compileShelterModel} from "@/lib/compiler";
import {thermalMethod} from "@/lib/engineering";
import {compiledSourceIds} from "@/lib/provenance";
import {costLinesForCompiled} from "@/lib/costing";
import {modelComparisonSummaryFromCompiled, modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {animalSizeClassLabel, climateProfileLabel} from "@/lib/model-labels";
import {openGraphLocale, siteUrl} from "@/lib/seo";
import {modelDescription, modelName} from "@/lib/model-presentation";

const thermalLimitationCopy = {
  "No validated entrance infiltration model": {
    sr: "Nema validiranog modela infiltracije vazduha kroz ulaze.",
    en: "No validated entrance infiltration model."
  },
  "No validated airflow model for the provisional ventilation insert zones": {
    sr: "Nema validiranog modela strujanja vazduha kroz privremeno rezervisane zone za ventilacione umetke.",
    en: "No validated airflow model for the provisional ventilation insert zones."
  },
  "No wind pressure model": {
    sr: "Nema modela pritiska vetra.",
    en: "No wind pressure model."
  },
  "No animal metabolic heat credit": {
    sr: "Toplota koju stvara životinja nije uračunata.",
    en: "No animal metabolic heat credit."
  },
  "No transient heat-storage model": {
    sr: "Nema modela promene i zadržavanja toplote tokom vremena.",
    en: "No transient heat-storage model."
  },
  "No 2D framing thermal-bridge correction": {
    sr: "Nema 2D korekcije toplotnih mostova kroz ram.",
    en: "No 2D framing thermal-bridge correction."
  },
  "No explicit corner/end-grain edge-return thermal-bridge model": {
    sr: "Nema posebnog modela toplotnih mostova na uglovima, čeonom drvetu i povratnim ivicama.",
    en: "No explicit corner/end-grain edge-return thermal-bridge model."
  }
} satisfies Record<(typeof thermalMethod.limitations)[number], Record<AppLocale, string>>;

export function generateStaticParams() {
  return [...shelterModels, ...practicalModels].map((model) => ({slug: model.slug}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const model = getShelterModel(slug);
  if (!model) {
    const practical = getPracticalModel(slug);
    if (!practical) return {};
    const copy = practical.translations[locale];
    const srPracticalPath = `/sr/modeli/${practical.slug}`;
    const enPracticalPath = `/en/models/${practical.slug}`;
    return {
      title: copy.name,
      description: copy.description,
      alternates: {canonical: locale === "sr" ? srPracticalPath : enPracticalPath, languages: {"sr-Latn": srPracticalPath, en: enPracticalPath, "x-default": srPracticalPath}},
      twitter: {card: "summary_large_image", title: `${copy.name} · Šapice`, description: copy.description},
      openGraph: {type: "article", siteName: "Šapice", url: locale === "sr" ? srPracticalPath : enPracticalPath, title: `${copy.name} · Šapice`, description: copy.description, ...openGraphLocale(locale)}
    };
  }
  const srPath = `/sr/modeli/${model.slug}`;
  const enPath = `/en/models/${model.slug}`;

  return {
    title: modelName(model, locale),
    description: modelDescription(model, locale),
    alternates: {
      canonical: locale === "sr" ? srPath : enPath,
      languages: {
        "sr-Latn": srPath,
        en: enPath,
        "x-default": srPath
      }
    },
    twitter: {
      card: "summary_large_image",
      title: `${modelName(model, locale)} · Šapice`,
      description: modelDescription(model, locale)
    },
    openGraph: {
      type: "article",
      siteName: "Šapice",
      url: locale === "sr" ? srPath : enPath,
      title: `${modelName(model, locale)} · Šapice`,
      description: modelDescription(model, locale),
      ...openGraphLocale(locale)
    }
  };
}

export default async function ModelPage({params}: {params: Promise<{locale: AppLocale; slug: string}>}) {
  const {locale: routeLocale, slug} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const model = getShelterModel(slug);
  if (!model) {
    const practical = getPracticalModel(slug);
    if (!practical) notFound();
    const practicalCompiled = compilePracticalModel(practical);
    const practicalCopy = practical.translations[locale];
    return (
      <>
        <StructuredData data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: practicalCopy.name,
          description: practicalCopy.description,
          url: `${siteUrl}/${locale}/${locale === "sr" ? "modeli" : "models"}/${practical.slug}`,
          inLanguage: locale === "sr" ? "sr-Latn" : "en",
          identifier: `sapice:${practical.id}:v${practical.version}:${practicalCompiled.planFingerprint}`,
          step: practicalCompiled.steps.map((step, index) => ({"@type": "HowToStep", position: index + 1, name: locale === "sr" ? step.titleSr : step.titleEn, text: locale === "sr" ? step.detailSr : step.detailEn}))
        }} />
        <PracticalModelPage model={practical} locale={locale} />
      </>
    );
  }

  const compiled = compileShelterModel(model);
  const thumbnailSummary = modelComparisonSummaryFromCompiled(compiled);
  const thermal = compiled.thermal;
  const materials = compiled.fabricationMaterials;
  const roof = compiled.roof;
  const construction = compiled.construction;
  const assemblies = compiled.assemblies;
  const costLines = costLinesForCompiled(compiled);
  const counterpart = heatingCounterpart(model, shelterModels);
  const neighbours = neighbouringModels(model, shelterModels);
  const relatedModels = counterpart ? [counterpart, ...neighbours.slice(0, 2)] : neighbours;
  const relatedSummaries = modelComparisonSummaryMap(relatedModels);
  const isSr = locale === "sr";
  const subnavItems = [
    {id: "geometry", label: isSr ? "Mere" : "Dimensions"},
    {id: "validation", label: isSr ? "Validacija" : "Validation"},
    {id: "thermal", label: isSr ? "Termika" : "Thermal"},
    {id: "ventilation", label: isSr ? "Ventilacija" : "Ventilation"},
    ...(model.heated ? [{id: "heating", label: isSr ? "Grejanje" : "Heating"}] : []),
    {id: "materials", label: isSr ? "Materijali" : "Materials"},
    {id: "nesting", label: isSr ? "Raspored tabla" : "Sheets"},
    {id: "cost", label: isSr ? "Trošak" : "Cost"},
    {id: "operation", label: isSr ? "Korišćenje" : "Use"},
    {id: "inside", label: isSr ? "Unutrašnjost" : "Interior"},
    {id: "cut-list", label: isSr ? "Krojna lista" : "Cut list"},
    {id: "framing", label: isSr ? "Ram" : "Framing"},
    {id: "hardware", label: isSr ? "Okov" : "Hardware"},
    {id: "build-guide", label: isSr ? "Izrada" : "Build"},
    {id: "sources", label: isSr ? "Izvori" : "Sources"},
    {id: "prototype", label: isSr ? "Prototip" : "Prototype"},
    ...(relatedModels.length > 0 ? [{id: "related", label: isSr ? "Slični modeli" : "Related"}] : [])
  ];
  const modelUrl = `${siteUrl}/${locale}/${locale === "sr" ? "modeli" : "models"}/${model.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: modelName(model, locale),
    description: modelDescription(model, locale),
    url: modelUrl,
    inLanguage: locale === "sr" ? "sr-Latn" : "en",
    identifier: `sapice:${model.id}:v${model.version}:${compiled.planFingerprint}`,
    supply: materials.map((item) => ({
      "@type": "HowToSupply",
      name: locale === "sr" ? item.nameSr : item.nameEn,
      requiredQuantity: `${item.netAreaM2.toFixed(2)} m² net cut area`
    })),
    step: compiled.buildSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: locale === "sr" ? step.titleSr : step.titleEn,
      text: locale === "sr" ? step.detailSr : step.detailEn
    })),
    isBasedOn: compiledSourceIds(compiled)
      .map((sourceId) => sources[sourceId]?.url)
      .filter(Boolean)
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <section className="model-detail-hero">
        <div className="shell detail-grid">
          <div className="detail-summary">
            <span className="kicker">{validationStageLabel(model.validationState, locale)}</span>
            <h1>{modelName(model, locale)}</h1>
            <p>{modelDescription(model, locale)}</p>
            <div className="notice model-hero-notice" role="note">
              <p>
                {model.animal === "dog"
                  ? locale === "sr"
                    ? "Ovo je pomoćno spoljašnje sklonište. Tokom opasne hladnoće ili teškog nevremena psu obezbedite sigurno sklonište u zatvorenom."
                    : "This is auxiliary outdoor shelter. During dangerous cold or severe weather, provide safe indoor shelter for the dog."
                  : locale === "sr"
                    ? "Postavite kućicu na zaštićeno, suvo i podignuto mesto. Za ležaj koristite slamu; peškiri i ćebad mogu zadržavati vlagu."
                    : "Keep the shelter raised, dry and protected from wind. Use straw for winter bedding; towels and blankets can retain moisture."}
              </p>
              {model.heated && (
                <p>
                  {locale === "sr"
                    ? "Grejanje nije uputstvo za samostalnu električnu izradu. Model zahteva kompatibilan namenski proizvod i poštovanje njegovog uputstva."
                    : "Heating is not a DIY electrical specification. The model requires a compatible purpose-built product installed to its instructions."}
                </p>
              )}
              {model.validationState === "DATA_VALIDATED" && (
                <p>
                  {locale === "sr"
                    ? "Status „Podaci provereni” ne potvrđuje geometrijsku validaciju, stručnu reviziju, izradu prototipa ni terensko testiranje."
                    : "“Data validated” does not confirm geometry verification, engineering review, a prototype build or field testing."}
                  {" "}
                  <a href="#validation">
                    {locale === "sr" ? "Pogledaj nivoe validacije" : "See validation stages"}
                  </a>
                </p>
              )}
              <a className="model-guidance-link" href="#operation">
                {locale === "sr" ? "Pročitaj sve zimske smernice" : "Read the full winter-use guidance"}
              </a>
            </div>
            <div className="metric-grid">
              <div>
                <span>{locale === "sr" ? (model.animal === "dog" ? "Veličina psa" : "Kapacitet") : (model.animal === "dog" ? "Dog size" : "Capacity")}</span>
                <strong>{model.animal === "dog" ? animalSizeClassLabel(model.animalSizeClass, locale) : model.capacity.recommended}</strong>
              </div>
              <div><span>{locale === "sr" ? "Širina" : "Width"}</span><strong>{model.dimensions.widthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Dubina" : "Depth"}</span><strong>{model.dimensions.depthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Izolacija" : "Insulation"}</span><strong>{assemblyInsulationMm(assemblies.wall)} mm</strong></div>
            </div>
            <div className="model-meta-line">
              <span>model v{model.version}</span>
              <span>{locale === "sr" ? "kompajler" : "compiler"} v{compiled.compilerVersion}</span>
              <span>{locale === "sr" ? "ID plana" : "plan"} {compiled.planFingerprint}</span>
              <span>{climateProfileLabel(model.climateProfile, locale)}</span>
              <span>{locale === "sr" ? "referentni spoljašnji scenario, nije rejting" : "reference outdoor scenario, not a rating"} {model.referenceOutsideC} °C</span>
            </div>
            <div className="detail-actions">
              <PrintPlanButton locale={locale} />
              <SharePlanButton locale={locale} title={modelName(model, locale)} />
              <PlanExportButtons compiled={compiled} locale={locale} />
            </div>
            {counterpart && (
              <Link
                href={{pathname: "/models/[slug]", params: {slug: counterpart.slug}}}
                locale={locale}
                className="variant-callout"
              >
                <span className="variant-callout-badge" aria-hidden="true">
                  {counterpart.heated ? (isSr ? "Grejana" : "Heated") : (isSr ? "Pasivna" : "Passive")}
                </span>
                <span>
                  <small>
                    {counterpart.heated
                      ? (isSr ? "Isto kućište, predviđeno za namensko grejanje" : "Same envelope, designed for purpose-built heating")
                      : (isSr ? "Isto kućište, bez aktivnog grejanja" : "Same envelope, without active heating")}
                  </small>
                  <strong>{modelName(counterpart, locale)}</strong>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          <ShelterViewerLauncher compiled={compiled} locale={locale}>
            <ModelThumbnail model={model} locale={locale} summary={thumbnailSummary} />
          </ShelterViewerLauncher>
        </div>
      </section>

      <ModelSubnav items={subnavItems} locale={locale} />

      <section className="section" id="geometry">
        <div className="shell detail-content">
          <div>
            <span className="kicker">{locale === "sr" ? "Geometrija" : "Geometry"}</span>
            <h2>{locale === "sr" ? "Mere i konstrukcija" : "Dimensions and construction"}</h2>
            <TechnicalSketch compiled={compiled} locale={locale} />
          </div>
          <div className="data-panel">
            <dl className="data-list">
              <div><dt>{locale === "sr" ? "Spoljašnje mere" : "External size"}</dt><dd>{model.dimensions.widthMm} × {model.dimensions.depthMm} × {model.dimensions.frontHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Visina pozadi" : "Rear height"}</dt><dd>{model.dimensions.rearHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Podignut pod" : "Ground clearance"}</dt><dd>{model.dimensions.groundClearanceMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Ulaz" : "Entrance"}</dt><dd>{model.layout.entranceWidthMm} × {model.layout.entranceHeightMm} mm × {model.layout.entrances}</dd></div>
              <div>
                <dt>{locale === "sr" ? "Prag iznad gotovog poda" : "Sill above finished floor"}</dt>
                <dd>{compiled.internal.entranceSillAboveFinishedFloorMm} mm</dd>
              </div>
              <div><dt>{locale === "sr" ? "Komore" : "Chambers"}</dt><dd>{model.layout.chambers}</dd></div>
              {model.animal === "dog" && (
                <div>
                  <dt>{locale === "sr" ? "Napomena veličine" : "Sizing note"}</dt>
                  <dd>{locale === "sr" ? "Proveriti stvarne mere psa pre izrade" : "Verify the dog's actual measurements before building"}</dd>
                </div>
              )}
              <div><dt>{locale === "sr" ? "Debljina zida" : "Wall thickness"}</dt><dd>{construction.wallThicknessMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Debljina poda" : "Floor assembly"}</dt><dd>{construction.floorThicknessMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Debljina krova" : "Roof assembly"}</dt><dd>{construction.roofThicknessMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Vertikalna projekcija krova" : "Roof vertical projection"}</dt><dd>{compiled.interfaces.roofVerticalThicknessMm.toFixed(1)} mm</dd></div>
              <div><dt>{locale === "sr" ? "Čista zidna visina napred/pozadi" : "Clear wall height front/rear"}</dt><dd>{compiled.interfaces.wallFrontHeightMm.toFixed(0)} / {compiled.interfaces.wallRearHeightMm.toFixed(0)} mm</dd></div>
              <div><dt>{locale === "sr" ? "Nagib krova" : "Roof angle"}</dt><dd>{(roof.angleRad * 180 / Math.PI).toFixed(1)}°</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <ModelValidationPanel compiled={compiled} locale={locale} />

      <section className="section tone" id="thermal">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">{locale === "sr" ? "Termika" : "Thermal"}</span>
              <h2>{locale === "sr" ? "Transparentna termička procena" : "Transparent thermal estimate"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Procena ustaljenog prenosa toplote kroz omotač. Ne uključuje validirani model infiltracije kroz ulaz i zato nije temperaturna garancija."
                : "Steady-state envelope transmission estimate. It does not include a validated entrance-infiltration model and is not a temperature guarantee."}
            </p>
          </div>
          <div className="thermal-grid">
            <div>
              <span>{locale === "sr" ? "U-vrednost zida · nominalno" : "Wall U · nominal"}</span>
              <strong>{thermal.wallU.toFixed(2)} W/m²K</strong>
              <small>{thermal.wallURange[0].toFixed(2)}–{thermal.wallURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>{locale === "sr" ? "U poda · nominalno" : "Floor U · nominal"}</span>
              <strong>{thermal.floorU.toFixed(2)} W/m²K</strong>
              <small>{thermal.floorURange[0].toFixed(2)}–{thermal.floorURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>{locale === "sr" ? "U krova · nominalno" : "Roof U · nominal"}</span>
              <strong>{thermal.roofU.toFixed(2)} W/m²K</strong>
              <small>{thermal.roofURange[0].toFixed(2)}–{thermal.roofURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>{locale === "sr" ? "Poređenje ΔT" : "ΔT comparison"}</span>
              <strong>{thermal.deltaTK} K</strong>
              <small>{locale === "sr" ? "metod" : "method"} v{thermal.methodVersion}</small>
            </div>
            <div className="wide">
              <span>{locale === "sr" ? "Nominalna transmisija omotača" : "Nominal envelope transmission"}</span>
              <strong>{thermal.envelopeTransmissionW.toFixed(0)} W</strong>
              <small>{thermal.envelopeTransmissionRangeW[0].toFixed(0)}–{thermal.envelopeTransmissionRangeW[1].toFixed(0)} W</small>
            </div>
          </div>
          <div className="surface-resistance-grid">
            <div>
              <span>{locale === "sr" ? "Rsi zida" : "Wall Rsi"}</span>
              <strong>{thermal.surfaceResistances.wallRsi.toFixed(2)} m²K/W</strong>
              <small>{locale === "sr" ? "horizontalni tok" : "horizontal heat flow"}</small>
            </div>
            <div>
              <span>{locale === "sr" ? "Rsi krova" : "Roof Rsi"}</span>
              <strong>{thermal.surfaceResistances.roofRsi.toFixed(2)} m²K/W</strong>
              <small>{locale === "sr" ? "tok naviše" : "upward heat flow"}</small>
            </div>
            <div>
              <span>{locale === "sr" ? "Rsi poda" : "Floor Rsi"}</span>
              <strong>{thermal.surfaceResistances.floorRsi.toFixed(2)} m²K/W</strong>
              <small>{locale === "sr" ? "tok naniže" : "downward heat flow"}</small>
            </div>
            <div>
              <span>Rse</span>
              <strong>{thermal.surfaceResistances.rse.toFixed(2)} m²K/W</strong>
              <small>ISO 6946 · v{thermal.methodVersion}</small>
            </div>
          </div>
          <ThermalScenario
            locale={locale}
            baseDeltaTK={thermal.deltaTK}
            nominalW={thermal.envelopeTransmissionW}
            rangeW={thermal.envelopeTransmissionRangeW}
          />
          <div className="thermal-limitations">
            <strong>{locale === "sr" ? "Trenutne limitacije modela" : "Current model limitations"}</strong>
            <ul>
              {thermal.limitations.map((limitation) => (
                <li key={limitation}>{thermalLimitationCopy[limitation][locale]}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <VentilationProvision compiled={compiled} locale={locale} />
      <HeatingProvision compiled={compiled} locale={locale} />

      <section className="section" id="materials">
        <div className="shell">
          <span className="kicker">
            {locale === "sr" ? "Materijali za izradu · izlaz kompajlera" : "Fabrication BOM · compiler output"}
          </span>
          <h2>{locale === "sr" ? "Materijali za krojenje" : "Fabrication materials"}</h2>
          <div className="material-table">
            {materials.map((item) => (
              <div key={item.id}>
                <strong>{locale === "sr" ? item.nameSr : item.nameEn}</strong>
                <span>{item.netAreaM2.toFixed(2)} m²</span>
                <span>
                  {locale === "sr"
                    ? "neto površina stvarnih krojnih delova"
                    : "net area of actual cut geometry"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SheetLayout compiled={compiled} locale={locale} />
      <CostCalculator modelId={model.id} lines={costLines} locale={locale} />
      <OperatingGuidance model={model} locale={locale} />
      <ModelBuildBook compiled={compiled} locale={locale} />
      <PrototypeEvidenceWorksheet
        locale={locale}
        modelId={model.id}
        modelVersion={model.version}
        compilerVersion={compiled.compilerVersion}
        planFingerprint={compiled.planFingerprint}
        heated={model.heated}
      />

      {relatedModels.length > 0 && (
        <section className="section related-section" id="related" aria-labelledby="related-title">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="kicker">{isSr ? "Iz iste biblioteke" : "From the same library"}</span>
                <h2 id="related-title">{isSr ? "Slični modeli" : "Related models"}</h2>
              </div>
              <p>
                {isSr
                  ? "Isti sistem konstrukcije, druga veličina ili strategija grejanja. Redosled je deterministički: najpre ista kućišta, zatim najbliži kapacitet ili veličina."
                  : "The same construction system in another size or heating strategy. The order is deterministic: same envelope first, then the closest capacity or size."}
              </p>
            </div>
            <div className="model-grid">
              {relatedModels.map((related) => (
                <ModelCard
                  key={related.id}
                  model={related}
                  locale={locale}
                  summary={relatedSummaries[related.id]}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
