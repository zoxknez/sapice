import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels, getShelterModel} from "@/data/models";
import {assemblyInsulationMm} from "@/data/assemblies";
import {sources} from "@/data/sources";
import {ShelterViewer} from "@/components/shelter-viewer";
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
import {compileShelterModel} from "@/lib/compiler";
import {compiledSourceIds} from "@/lib/provenance";

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
      title: copy.name,
      description: copy.description
    },
    openGraph: {
      type: "article",
      title: copy.name,
      description: copy.description,
      locale: locale === "sr" ? "sr_RS" : "en_US",
      alternateLocale: locale === "sr" ? ["en_US"] : ["sr_RS"]
    }
  };
}

export default async function ModelPage({params}: {params: Promise<{locale: AppLocale; slug: string}>}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const model = getShelterModel(slug);
  if (!model) notFound();

  const copy = model.translations[locale];
  const compiled = compileShelterModel(model);
  const thermal = compiled.thermal;
  const materials = compiled.fabricationMaterials;
  const roof = compiled.roof;
  const construction = compiled.construction;
  const assemblies = compiled.assemblies;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const modelUrl = `${siteUrl}/${locale}/${locale === "sr" ? "modeli" : "models"}/${model.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: copy.name,
    description: copy.description,
    url: modelUrl,
    inLanguage: locale === "sr" ? "sr-Latn" : "en",
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
          <ShelterViewer model={model} locale={locale} />
          <div className="detail-summary">
            <span className="kicker">{model.validationState.replaceAll("_", " ")}</span>
            <h1>{copy.name}</h1>
            <p>{copy.description}</p>
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
              <span>v{model.version}</span>
              <span>{model.climateProfile.replaceAll("_", " ")}</span>
              <span>{locale === "sr" ? "referentni spoljašnji scenario, nije rejting" : "reference outdoor scenario, not a rating"} {model.referenceOutsideC} °C</span>
            </div>
            <div className="detail-actions">
              <PrintPlanButton locale={locale} />
              <SharePlanButton locale={locale} title={copy.name} />
              <PlanExportButtons model={model} locale={locale} />
            </div>
            <div className="notice">
              {model.heated
                ? (locale === "sr"
                    ? "Grejanje nije DIY električna specifikacija. Model zahteva kompatibilan namenski proizvod i poštovanje njegovog uputstva."
                    : "Heating is not a DIY electrical specification. The model requires a compatible purpose-built product installed to its instructions.")
                : (locale === "sr"
                    ? "Status DATA_VALIDATED ne znači da je fizički prototip testiran. Takva tvrdnja će se pojaviti tek posle stvarne fizičke validacije."
                    : "DATA_VALIDATED does not mean a physical prototype has been tested. That claim appears only after real physical validation.")}
            </div>
          </div>
        </div>
      </section>

      <nav className="model-subnav" aria-label={locale === "sr" ? "Sekcije modela" : "Model sections"}>
        <div className="shell">
          <a href="#geometry">{locale === "sr" ? "Mere" : "Dimensions"}</a>
          <a href="#thermal">{locale === "sr" ? "Termika" : "Thermal"}</a>
          <a href="#materials">{locale === "sr" ? "Materijali" : "Materials"}</a>
          <a href="#nesting">{locale === "sr" ? "Table" : "Sheets"}</a>
          <a href="#cost">{locale === "sr" ? "Trošak" : "Cost"}</a>
          <a href="#operation">{locale === "sr" ? "Korišćenje" : "Use"}</a>
          <a href="#inside">{locale === "sr" ? "Unutrašnjost" : "Interior"}</a>
          <a href="#cut-list">{locale === "sr" ? "Krojna lista" : "Cut list"}</a>
          <a href="#framing">{locale === "sr" ? "Ram" : "Framing"}</a>
          <a href="#hardware">{locale === "sr" ? "Hardware" : "Hardware"}</a>
          <a href="#build-guide">{locale === "sr" ? "Izrada" : "Build"}</a>
          <a href="#sources">{locale === "sr" ? "Izvori" : "Sources"}</a>
        </div>
      </nav>

      <section className="section" id="geometry">
        <div className="shell detail-content">
          <div>
            <span className="kicker">Geometry</span>
            <h2>{locale === "sr" ? "Mere i konstrukcija" : "Dimensions and construction"}</h2>
            <TechnicalSketch compiled={compiled} locale={locale} />
          </div>
          <div className="data-panel">
            <dl className="data-list">
              <div><dt>{locale === "sr" ? "Spoljašnje mere" : "External size"}</dt><dd>{model.dimensions.widthMm} × {model.dimensions.depthMm} × {model.dimensions.frontHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Visina pozadi" : "Rear height"}</dt><dd>{model.dimensions.rearHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Podignut pod" : "Ground clearance"}</dt><dd>{model.dimensions.groundClearanceMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Ulaz" : "Entrance"}</dt><dd>{model.layout.entranceWidthMm} × {model.layout.entranceHeightMm} mm × {model.layout.entrances}</dd></div>
              <div><dt>{locale === "sr" ? "Komore" : "Chambers"}</dt><dd>{model.layout.chambers}</dd></div>
              {model.animal === "dog" && (
                <div>
                  <dt>{locale === "sr" ? "Napomena veličine" : "Sizing note"}</dt>
                  <dd>{locale === "sr" ? "Proveriti stvarne mere psa pre izrade" : "Verify the dog's actual measurements before building"}</dd>
                </div>
              )}
              <div><dt>{locale === "sr" ? "Debljina zida" : "Wall thickness"}</dt><dd>{construction.wallThicknessMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Nagib krova" : "Roof angle"}</dt><dd>{(roof.angleRad * 180 / Math.PI).toFixed(1)}°</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section tone" id="thermal">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="kicker">Thermal</span>
              <h2>{locale === "sr" ? "Transparentna termička procena" : "Transparent thermal estimate"}</h2>
            </div>
            <p>
              {locale === "sr"
                ? "Steady-state procena prolaza toplote kroz omotač. Ne uključuje validirani model infiltracije kroz ulaz i zato nije temperaturna garancija."
                : "Steady-state envelope transmission estimate. It does not include a validated entrance-infiltration model and is not a temperature guarantee."}
            </p>
          </div>
          <div className="thermal-grid">
            <div>
              <span>Wall U · nominal</span>
              <strong>{thermal.wallU.toFixed(2)} W/m²K</strong>
              <small>{thermal.wallURange[0].toFixed(2)}–{thermal.wallURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>Floor U · nominal</span>
              <strong>{thermal.floorU.toFixed(2)} W/m²K</strong>
              <small>{thermal.floorURange[0].toFixed(2)}–{thermal.floorURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>Roof U · nominal</span>
              <strong>{thermal.roofU.toFixed(2)} W/m²K</strong>
              <small>{thermal.roofURange[0].toFixed(2)}–{thermal.roofURange[1].toFixed(2)} W/m²K</small>
            </div>
            <div>
              <span>ΔT comparison</span>
              <strong>{thermal.deltaTK} K</strong>
              <small>method v{thermal.methodVersion}</small>
            </div>
            <div className="wide">
              <span>{locale === "sr" ? "Nominalna transmisija omotača" : "Nominal envelope transmission"}</span>
              <strong>{thermal.envelopeTransmissionW.toFixed(0)} W</strong>
              <small>{thermal.envelopeTransmissionRangeW[0].toFixed(0)}–{thermal.envelopeTransmissionRangeW[1].toFixed(0)} W</small>
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
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

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
      <CostCalculator model={model} locale={locale} />
      <OperatingGuidance model={model} locale={locale} />
      <ModelBuildBook model={model} locale={locale} />
    </>
  );
}
