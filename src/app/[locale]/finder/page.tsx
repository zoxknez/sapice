import {getTranslations, setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {shelterModels} from "@/data/models";
import {Finder} from "@/components/finder";

export default async function FinderPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations({locale, namespace: "Finder"});

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">Rule-based matcher</span>
        <h1>{t("title")}</h1>
        <p className="page-lead">{t("lead")}</p>
        <Finder models={shelterModels} locale={locale} />
      </div>
    </section>
  );
}
