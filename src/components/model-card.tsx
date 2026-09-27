import type {ShelterModel} from "@/lib/domain";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {assemblyInsulationMm, getAssembly} from "@/data/assemblies";

export function ModelCard({model, locale}: {model: ShelterModel; locale: AppLocale}) {
  const copy = model.translations[locale];
  return (
    <article className="model-card">
      <div className="model-visual" aria-hidden="true">
        <div className="mini-shelter">
          <span className="mini-roof" />
          <span className="mini-door" />
        </div>
        <span className="status-chip">{model.validationState.replaceAll("_", " ")}</span>
      </div>
      <div className="model-card-body">
        <div className="eyebrow-row">
          <span>{model.animal === "cat" ? (locale === "sr" ? "Mačke" : "Cats") : (locale === "sr" ? "Psi" : "Dogs")}</span>
          <span>{model.capacity.recommended}×</span>
          <span>{model.heated ? (locale === "sr" ? "Grejana" : "Heated") : (locale === "sr" ? "Pasivna" : "Passive")}</span>
        </div>
        <h3>{copy.name}</h3>
        <p>{copy.description}</p>
        <dl className="spec-strip">
          <div><dt>{locale === "sr" ? "Širina" : "Width"}</dt><dd>{model.dimensions.widthMm} mm</dd></div>
          <div><dt>{locale === "sr" ? "Izolacija" : "Insulation"}</dt><dd>{assemblyInsulationMm(getAssembly(model.construction.wallAssemblyId))} mm</dd></div>
          <div><dt>{locale === "sr" ? "Komore" : "Chambers"}</dt><dd>{model.layout.chambers}</dd></div>
        </dl>
        <Link href={{pathname: "/models/[slug]", params: {slug: model.slug}}} locale={locale} className="text-link">
          {locale === "sr" ? "Detalji modela" : "Model details"} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
