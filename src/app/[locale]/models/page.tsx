import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {ModelCatalog} from "@/components/model-catalog";
import {localizedMetadata} from "@/lib/seo";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";
import {catalogEntries} from "@/lib/catalog/entries";
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
    descriptionSr: "Hitna, budžetska, ponovno iskorišćena, standardna i inženjerska skloništa za mačke i pse, sa merama, materijalima, klasom konstrukcije i statusom provere.",
    descriptionEn: "Emergency, budget, reuse, DIY and engineered shelters for cats and dogs, with dimensions, materials, design class and validation status.",
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
  const entries = catalogEntries();
  const engineeredThumbnails = Object.fromEntries(
    shelterModels.map((model) => [model.slug, {model, summary: comparisonSummaries[model.id]}])
  );
  const initialState = query
    ? parseCatalogUrlState(
        searchParamsRecordToURLSearchParams(query),
        entries.map((entry) => entry.slug)
      )
    : defaultCatalogUrlState;

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{locale === "sr" ? "Katalog konstrukcija" : "Engineering catalog"}</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <ModelCatalog
          entries={entries}
          engineeredThumbnails={engineeredThumbnails}
          locale={locale}
          initialState={initialState}
        />
      </div>
    </section>
  );
}
