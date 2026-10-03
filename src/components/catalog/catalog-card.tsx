import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import type {CatalogEntry} from "@/lib/catalog/entries";
import {taxonomyLabel} from "@/lib/catalog/taxonomy-core";
import {animalSizeClassLabel} from "@/lib/model-labels";
import {ModelThumbnail} from "@/components/model-thumbnail";
import {PracticalThumbnail} from "@/components/catalog/practical-thumbnail";
import {DesignClassTag, ValidationSeal} from "@/components/catalog/badges";
import type {ShelterModel} from "@/lib/domain";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";

export type EngineeredThumbnailData = {model: ShelterModel; summary: ModelComparisonSummary};

// Minutes below two hours, otherwise rounded hours; units are the same in SR and EN.
export function formatBuildTime([min, max]: [number, number]) {
  const fmt = (minutes: number) => (minutes < 120 ? `${minutes} min` : `${Math.round(minutes / 60)} h`);
  return `${fmt(min)}–${fmt(max)}`;
}

export function insulationLabel(entry: Pick<CatalogEntry, "insulation">, locale: AppLocale) {
  if (!entry.insulation) return locale === "sr" ? "bez izolacije" : "no insulation";
  const id = entry.insulation.materialId;
  const short = id === "eps-shipping-box" ? "EPS" : id.toUpperCase();
  return `${short} ${entry.insulation.thicknessMm} mm`;
}

export function toolsLabel(entry: Pick<CatalogEntry, "tools">, locale: AppLocale) {
  const tools = entry.tools.filter((tool) => tool !== "WORKSHOP");
  if (!tools.length || tools.every((tool) => tool === "NONE")) return taxonomyLabel("tool", "NONE", locale);
  const labels = tools.filter((tool) => tool !== "NONE").map((tool) => taxonomyLabel("tool", tool, locale));
  return labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ");
}

export function CatalogCard({entry, locale, engineered}: {entry: CatalogEntry; locale: AppLocale; engineered?: EngineeredThumbnailData}) {
  const isSr = locale === "sr";
  const name = isSr ? entry.nameSr : entry.nameEn;
  const coverageCount = entry.coverage.length;
  return (
    <article className={`model-card catalog-card class-border-${entry.designClass.toLowerCase()}`}>
      <div className="model-visual">
        {engineered ? <ModelThumbnail model={engineered.model} locale={locale} summary={engineered.summary} /> : <PracticalThumbnail sketch={entry.sketch} name={name} locale={locale} />}
        <DesignClassTag designClass={entry.designClass} locale={locale} />
      </div>
      <div className="model-card-body">
        <div className="eyebrow-row">
          <span>{entry.animal === "cat" ? (isSr ? "Mačke" : "Cats") : (isSr ? "Psi" : "Dogs")}</span>
          <span>{entry.animal === "dog" ? animalSizeClassLabel(entry.animalSizeClass, locale) : `${entry.capacity.max}×`}</span>
          <span>{entry.seasons.filter((season) => season !== "EMERGENCY" || entry.emergencyOnly).slice(0, 2).map((season) => taxonomyLabel("season", season, locale)).join(" / ")}</span>
        </div>
        <h3>{name}</h3>
        <p>{isSr ? entry.descriptionSr : entry.descriptionEn}</p>
        <dl className="spec-strip spec-strip-4">
          <div><dt>{isSr ? "Izrada" : "Build"}</dt><dd>{taxonomyLabel("difficulty", entry.difficulty, locale)}</dd></div>
          <div><dt>{isSr ? "Alat" : "Tools"}</dt><dd>{toolsLabel(entry, locale)}</dd></div>
          <div><dt>{isSr ? "Procena vremena" : "Time estimate"}</dt><dd>{formatBuildTime(entry.buildTimeMinutes)}</dd></div>
          <div><dt>{isSr ? "Izolacija" : "Insulation"}</dt><dd>{insulationLabel(entry, locale)}</dd></div>
        </dl>
        <div className="card-flags">
          {entry.heated && <span className="flag flag-heated">{isSr ? "Grejanje predviđeno" : "Heating provision"}</span>}
          {entry.usesReusedMaterial && <span className="flag">{isSr ? "Iskorišćen materijal" : "Reused material"}</span>}
          {entry.structureType !== "SLEEPING_SHELTER" && <span className="flag">{taxonomyLabel("structureType", entry.structureType, locale)}</span>}
          <span className="flag flag-coverage" title={entry.coverage.map((item) => taxonomyLabel("coverage", item, locale)).join(", ")}>
            {isSr ? `Proračuni: ${coverageCount}/9` : `Calculations: ${coverageCount}/9`}
          </span>
        </div>
        <div className="card-footer">
          <ValidationSeal state={entry.validationState} locale={locale} />
          <Link href={{pathname: "/models/[slug]", params: {slug: entry.slug}}} className="text-link card-link">
            {isSr ? "Detalji" : "Details"}
            <span className="sr-only">: {name}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
