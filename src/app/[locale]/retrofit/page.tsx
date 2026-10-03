import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {localizedMetadata} from "@/lib/seo";
import {materialOptions} from "@/lib/catalog/page-data";
import {RetrofitAdvisor} from "@/components/retrofit-advisor";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Unapredi postojeću kućicu",
    titleEn: "Improve an existing shelter",
    descriptionSr: "Opišite postojeću kućicu za psa ili mačku i dobijte deterministički redosled unapređenja: voda, podizanje, ulaz, izolacija, zaštita i održavanje.",
    descriptionEn: "Describe an existing dog or cat house and get a deterministic order of improvements: water, raising, entrance, insulation, protection and maintenance.",
    srPath: "/sr/unapredi-kucicu",
    enPath: "/en/retrofit"
  });
}

export default async function RetrofitPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";
  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{isSr ? "Postojeća kućica" : "Existing shelter"}</span>
        <h1>{isSr ? "Već imam kućicu, želim da je poboljšam" : "I already have a house and want to improve it"}</h1>
        <p className="page-lead">
          {isSr
            ? "Opišite kućicu koliko znate. Šapice daje redosled radova; termičku procenu ne računa jer opis postojeće kućice nije dovoljno precizan."
            : "Describe the house as well as you can. Šapice gives an order of work; it does not calculate a thermal estimate because a description of an existing house is not precise enough."}
        </p>
        <RetrofitAdvisor locale={locale} materials={materialOptions()} />
      </div>
    </section>
  );
}
