import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {ModelThumbnail} from "@/components/model-thumbnail";
import type {ModelComparisonSummary} from "@/lib/catalog-summary";

export function ModelCard({
  model,
  locale,
  summary
}: {
  model: ShelterModel;
  locale: AppLocale;
  summary: ModelComparisonSummary;
}) {
  const copy = model.translations[locale];
  return (
    <article className="model-card">
      <div className="model-visual">
        <ModelThumbnail model={model} locale={locale} summary={summary} />
        <span className="status-chip">{model.validationState.replaceAll("_", " ")}</span>
      </div>
      <div className="model-card-body">
        <div className="eyebrow-row">
          <span>{model.animal === "cat" ? (locale === "sr" ? "Mačke" : "Cats") : (locale === "sr" ? "Psi" : "Dogs")}</span>
          <span>{model.animal === "dog" ? model.animalSizeClass : `${model.capacity.recommended}×`}</span>
          <span>{model.heated ? (locale === "sr" ? "Grejana" : "Heated") : (locale === "sr" ? "Pasivna" : "Passive")}</span>
        </div>
        <h3>{copy.name}</h3>
        <p>{copy.description}</p>
        <dl className="spec-strip">
          <div><dt>{locale === "sr" ? "Širina" : "Width"}</dt><dd>{model.dimensions.widthMm} mm</dd></div>
          <div><dt>{locale === "sr" ? "Izolacija" : "Insulation"}</dt><dd>{summary.wallInsulationMm} mm</dd></div>
          <div><dt>{locale === "sr" ? "Komore" : "Chambers"}</dt><dd>{model.layout.chambers}</dd></div>
        </dl>
        <Link href={{pathname: "/models/[slug]", params: {slug: model.slug}}} locale={locale} className="text-link">
          {locale === "sr" ? "Detalji modela" : "Model details"} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
