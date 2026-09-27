import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {Finder} from "@/components/finder";
import {localizedMetadata} from "@/lib/seo";
import {modelComparisonSummaryMap} from "@/lib/catalog-summary";


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
    descriptionSr: "Deterministički izbor modela po životinji, kapacitetu, prostoru, zimskoj klasi i zahtevu za grejanjem.",
    descriptionEn: "Deterministic model matching by animal, capacity, available space, winter profile and heating requirement.",
    srPath: "/sr/pronadji-model",
    enPath: "/en/find-model"
  });
}

export default async function FinderPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Finder"});
  const comparisonSummaries = modelComparisonSummaryMap(shelterModels);

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">Rule-based matcher</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <Finder
          models={shelterModels}
          comparisonSummaries={comparisonSummaries}
          locale={locale}
        />
      </div>
    </section>
  );
}
