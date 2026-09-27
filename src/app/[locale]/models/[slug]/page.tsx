import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels, getShelterModel} from "@/data/models";
import {constructionSummary, getModelAssemblies, materialSummary, thermalSummary, roofSlope} from "@/lib/engineering";
import {assemblyInsulationMm} from "@/data/assemblies";
import {ShelterViewer} from "@/components/shelter-viewer";
import {TechnicalSketch} from "@/components/technical-sketch";
import {ModelBuildBook} from "@/components/model-build-book";
import {SheetLayout} from "@/components/sheet-layout";
import {CostCalculator} from "@/components/cost-calculator";
import {compileShelterModel} from "@/lib/compiler";

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
  const thermal = thermalSummary(model);
  const materials = materialSummary(model);
  const roof = roofSlope(model);
  const compiled = compileShelterModel(model);
  const construction = constructionSummary(model);
  const assemblies = getModelAssemblies(model);

  return (
    <>
      <section className="model-detail-hero">
        <div className="shell detail-grid">
          <ShelterViewer model={model} />
          <div className="detail-summary">
            <span className="kicker">{model.validationState.replaceAll("_", " ")}</span>
            <h1>{copy.name}</h1>
            <p>{copy.description}</p>
            <div className="metric-grid">
              <div><span>{locale === "sr" ? "Kapacitet" : "Capacity"}</span><strong>{model.capacity.recommended}</strong></div>
              <div><span>{locale === "sr" ? "Širina" : "Width"}</span><strong>{model.dimensions.widthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Dubina" : "Depth"}</span><strong>{model.dimensions.depthMm} mm</strong></div>
              <div><span>{locale === "sr" ? "Izolacija" : "Insulation"}</span><strong>{assemblyInsulationMm(assemblies.wall)} mm</strong></div>
            </div>
            <div className="model-meta-line">
              <span>v{model.version}</span>
              <span>{model.climateProfile.replaceAll("_", " ")}</span>
              <span>{locale === "sr" ? "projektovano za proračun" : "calculation design condition"} {model.designOutsideC} °C</span>
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
          <a href="#inside">{locale === "sr" ? "Unutrašnjost" : "Interior"}</a>
          <a href="#cut-list">{locale === "sr" ? "Krojna lista" : "Cut list"}</a>
          <a href="#nesting">{locale === "sr" ? "Table" : "Sheets"}</a>
          <a href="#cost">{locale === "sr" ? "Trošak" : "Cost"}</a>
          <a href="#build-guide">{locale === "sr" ? "Izrada" : "Build"}</a>
          <a href="#sources">{locale === "sr" ? "Izvori" : "Sources"}</a>
        </div>
      </nav>

      <section className="section" id="geometry">
        <div className="shell detail-content">
          <div>
            <span className="kicker">Geometry</span>
            <h2>{locale === "sr" ? "Mere i konstrukcija" : "Dimensions and construction"}</h2>
            <TechnicalSketch model={model} locale={locale} />
          </div>
          <div className="data-panel">
            <dl className="data-list">
              <div><dt>{locale === "sr" ? "Spoljašnje mere" : "External size"}</dt><dd>{model.dimensions.widthMm} × {model.dimensions.depthMm} × {model.dimensions.frontHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Visina pozadi" : "Rear height"}</dt><dd>{model.dimensions.rearHeightMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Podignut pod" : "Ground clearance"}</dt><dd>{model.dimensions.groundClearanceMm} mm</dd></div>
              <div><dt>{locale === "sr" ? "Ulaz" : "Entrance"}</dt><dd>{model.layout.entranceWidthMm} × {model.layout.entranceHeightMm} mm × {model.layout.entrances}</dd></div>
              <div><dt>{locale === "sr" ? "Komore" : "Chambers"}</dt><dd>{model.layout.chambers}</dd></div>
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
            <div><span>Wall U</span><strong>{thermal.wallU.toFixed(2)} W/m²K</strong></div>
            <div><span>Floor U</span><strong>{thermal.floorU.toFixed(2)} W/m²K</strong></div>
            <div><span>Roof U</span><strong>{thermal.roofU.toFixed(2)} W/m²K</strong></div>
            <div><span>ΔT comparison</span><strong>{thermal.deltaTK} K</strong></div>
            <div className="wide">
              <span>{locale === "sr" ? "Procena transmisije omotača" : "Envelope transmission estimate"}</span>
              <strong>{thermal.envelopeTransmissionW.toFixed(0)} W</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <span className="kicker">BOM preview</span>
          <h2>{locale === "sr" ? "Osnovni materijali" : "Core materials"}</h2>
          <div className="material-table">
            {materials.map((item) => (
              <div key={item.id}>
                <strong>{locale === "sr" ? item.nameSr : item.nameEn}</strong>
                <span>{item.calculatedM2.toFixed(2)} m²</span>
                <span>{locale === "sr" ? "sa 10% rezervom" : "with 10% allowance"}: {item.purchaseM2.toFixed(2)} m²</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SheetLayout compiled={compiled} locale={locale} />
      <CostCalculator model={model} locale={locale} />
      <ModelBuildBook model={model} locale={locale} />
    </>
  );
}
