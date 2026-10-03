import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {Finder} from "@/components/finder";
import {localizedMetadata} from "@/lib/seo";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {catalogEntries} from "@/lib/catalog/entries";
import {
  defaultFinderUrlState,
  parseFinderUrlState,
  searchParamsRecordToURLSearchParams,
  type SearchParamsRecord
} from "@/lib/view-url-state";


export async function generateMetadata({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Pronađite model",
    titleEn: "Find a model",
    descriptionSr: "Deterministički izbor skloništa po životinji, kapacitetu, sezoni, lokaciji, alatu, vremenu, budžetu i materijalu koji već imate.",
    descriptionEn: "Deterministic shelter matching by animal, capacity, season, location, tools, time, budget and the materials you already have.",
    srPath: "/sr/pronadji-model",
    enPath: "/en/find-model"
  });
}

export default async function FinderPage({
  params,
  searchParams
}: {
  params: Promise<{locale: AppLocale}>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  const {locale: routeLocale} = await params;
  const query = await searchParams;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Finder"});
  const comparisonSummaries = modelComparisonSummaryMap(shelterModels);
  const engineeredThumbnails = Object.fromEntries(shelterModels.map((model) => [model.slug, {model, summary: comparisonSummaries[model.id]}]));
  const initialState = query
    ? parseFinderUrlState(searchParamsRecordToURLSearchParams(query))
    : defaultFinderUrlState;

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{locale === "sr" ? "Izbor po kriterijumima" : "Rule-based matcher"}</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <Finder
          entries={catalogEntries()}
          engineeredThumbnails={engineeredThumbnails}
          locale={locale}
          initialState={initialState}
        />
      </div>
    </section>
  );
}
