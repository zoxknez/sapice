import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import type {ShelterModel} from "@/lib/domain";
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
import {compileShelterModel} from "@/lib/compiler";
import {thermalMethod} from "@/lib/engineering";
import {compiledSourceIds} from "@/lib/provenance";
import {costLinesForCompiled} from "@/lib/costing";
import {modelComparisonSummaryFromCompiled} from "@/lib/catalog-summary";
import {openGraphLocale, siteUrl} from "@/lib/seo";

const climateProfileLabels: Record<ShelterModel["climateProfile"], Record<AppLocale, string>> = {
  SHELTERED_MILD: {sr: "Zaštićeni blagi uslovi", en: "Sheltered mild conditions"},
  WINTER_MODERATE: {sr: "Umerena zima", en: "Moderate winter"},
  WINTER_COLD: {sr: "Hladna zima", en: "Cold winter"},
  WINTER_SEVERE: {sr: "Vrlo hladna zima", en: "Very cold winter"}
};

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
  return shelterModels.map((model) => ({slug: model.slug}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const model = getShelterModel(slug);
  if (!model) return {};
  const copy = model.translations[locale];
  const srPath = `/sr/modeli/${model.slug}`;
  const enPath = `/en/models/${model.slug}`;

  return {
    title: copy.name,
    description: copy.description,
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
      title: `${copy.name} · Šapice`,
      description: copy.description
    },
    openGraph: {
      type: "article",
      siteName: "Šapice",
      url: locale === "sr" ? srPath : enPath,
      title: `${copy.name} · Šapice`,
      description: copy.description,
      ...openGraphLocale(locale)
    }
  };
}

export default async function ModelPage({params}: {params: Promise<{locale: AppLocale; slug: string}>}) {
  const {locale: routeLocale, slug} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const model = getShelterModel(slug);
  if (!model) notFound();

  const copy = model.translations[locale];
  const compiled = compileShelterModel(model);
  const thumbnailSummary = modelComparisonSummaryFromCompiled(compiled);
  const thermal = compiled.thermal;
  const materials = compiled.fabricationMaterials;
  const roof = compiled.roof;
  const construction = compiled.construction;
  const assemblies = compiled.assemblies;
  const costLines = costLinesForCompiled(compiled);
  const modelUrl = `${siteUrl}/${locale}/${locale === "sr" ? "modeli" : "models"}/${model.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: copy.name,
    description: copy.description,
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
            <h1>{copy.name}</h1>
            <p>{copy.description}</p>
            <div className="notice" role="note">
              {model.heated && (
                <p>
                  {locale === "sr"
                    ? "Grejanje nije DIY električna specifikacija. Model zahteva kompatibilan namenski proizvod i poštovanje njegovog uputstva."
                    : "Heating is not a DIY electrical specification. The model requires a compatible purpose-built product installed to its instructions."}
                </p>
              )}
              {model.validationState === "DATA_VALIDATED" && (
                <p>
                  {locale === "sr"
                    ? "Status DATA_VALIDATED ne znači da je fizički prototip testiran. Takva tvrdnja će se pojaviti tek posle stvarne fizičke validacije."
                    : "DATA_VALIDATED does not mean a physical prototype has been tested. That claim appears only after real physical validation."}
                </p>
              )}
            </div>
            <div className="metric-grid">
              <div>
                <span>{locale === "sr" ? (model.animal === "dog" ? "Veličina psa" : "Kapacitet") : (model.animal === "dog" ? "Dog size" : "Capacity")}</span>
                <strong>{model.animal === "dog" ? model.animalSizeClass : model.capacity.recommended}</strong>
              </div>
              <div><span>{locale === "sr" ? "Širina" : "Width"}</span><strong>{model.dimensions.widthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Dubina" : "Depth"}</span><strong>{model.dimensions.depthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Izolacija" : "Insulation"}</span><strong>{assemblyInsulationMm(assemblies.wall)} mm</strong></div>
            </div>
            <div className="model-meta-line">
              <span>model v{model.version}</span>
              <span>compiler v{compiled.compilerVersion}</span>
              <span>plan {compiled.planFingerprint}</span>
              <span>{climateProfileLabels[model.climateProfile][locale]}</span>
              <span>{locale === "sr" ? "referentni spoljašnji scenario, nije rejting" : "reference outdoor scenario, not a rating"} {model.referenceOutsideC} °C</span>
            </div>
            <div className="detail-actions">
              <PrintPlanButton locale={locale} />
              <SharePlanButton locale={locale} title={copy.name} />
              <PlanExportButtons compiled={compiled} locale={locale} />
            </div>
          </div>
          <ShelterViewerLauncher compiled={compiled} locale={locale}>
            <ModelThumbnail model={model} locale={locale} summary={thumbnailSummary} />
          </ShelterViewerLauncher>
        </div>
      </section>

      <nav className="model-subnav" aria-label={locale === "sr" ? "Sekcije modela" : "Model sections"}>
        <div className="shell">
          <a href="#geometry">{locale === "sr" ? "Mere" : "Dimensions"}</a>
          <a href="#validation">{locale === "sr" ? "Validacija" : "Validation"}</a>
          <a href="#thermal">{locale === "sr" ? "Termika" : "Thermal"}</a>
          <a href="#ventilation">{locale === "sr" ? "Ventilacija" : "Ventilation"}</a>
          {model.heated && <a href="#heating">{locale === "sr" ? "Grejanje" : "Heating"}</a>}
          <a href="#materials">{locale === "sr" ? "Materijali" : "Materials"}</a>
          <a href="#nesting">{locale === "sr" ? "Raspored tabla" : "Sheets"}</a>
          <a href="#cost">{locale === "sr" ? "Trošak" : "Cost"}</a>
          <a href="#operation">{locale === "sr" ? "Korišćenje" : "Use"}</a>
          <a href="#inside">{locale === "sr" ? "Unutrašnjost" : "Interior"}</a>
          <a href="#cut-list">{locale === "sr" ? "Krojna lista" : "Cut list"}</a>
          <a href="#framing">{locale === "sr" ? "Ram" : "Framing"}</a>
          <a href="#hardware">{locale === "sr" ? "Okov" : "Hardware"}</a>
          <a href="#build-guide">{locale === "sr" ? "Izrada" : "Build"}</a>
          <a href="#prototype">{locale === "sr" ? "Prototip" : "Prototype"}</a>
          <a href="#sources">{locale === "sr" ? "Izvori" : "Sources"}</a>
        </div>
      </nav>

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
              <span>{locale === "sr" ? "U zida · nominalno" : "Wall U · nominal"}</span>
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
          <span className="kicker">Fabrication BOM · compiler output</span>
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
    </>
  );
}
