import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {ModelCatalog} from "@/components/model-catalog";
import {localizedMetadata} from "@/lib/seo";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {
  defaultCatalogUrlState,
  parseCatalogUrlState,
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
    titleSr: "Modeli kućica",
    titleEn: "Shelter models",
    descriptionSr: "Pregled unapred definisanih modela zimskih kućica za mačke i pse sa merama, materijalima i validacionim statusom.",
    descriptionEn: "Browse predefined winter shelter models for cats and dogs with dimensions, materials and validation status.",
    srPath: "/sr/modeli",
    enPath: "/en/models"
  });
}

export default async function ModelsPage({
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
  const t = await getTranslations({locale, namespace: "Models"});
  const comparisonSummaries = modelComparisonSummaryMap(shelterModels);
  const initialState = query
    ? parseCatalogUrlState(
        searchParamsRecordToURLSearchParams(query),
        shelterModels.map((model) => model.slug)
      )
    : defaultCatalogUrlState;

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{locale === "sr" ? "Katalog konstrukcija" : "Engineering catalog"}</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <ModelCatalog
          models={shelterModels}
          comparisonSummaries={comparisonSummaries}
          locale={locale}
          initialState={initialState}
        />
      </div>
    </section>
  );
}
