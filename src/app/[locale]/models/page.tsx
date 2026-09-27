import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {ModelCatalog} from "@/components/model-catalog";

export default async function ModelsPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Models"});

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">Engineering catalog</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <ModelCatalog models={shelterModels} locale={locale} />
      </div>
    </section>
  );
}
