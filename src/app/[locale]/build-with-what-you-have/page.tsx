import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {localizedMetadata} from "@/lib/seo";
import {catalogEntries, materialOptions, sheetPartsBySlug} from "@/lib/catalog/page-data";
import {WorkshopBuilder} from "@/components/workshop-builder";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Napravi od onoga što imaš",
    titleEn: "Build with what you have",
    descriptionSr: "Unesite materijal, ostatke i alat koji imate i saznajte koja skloništa za mačke i pse možete napraviti i šta treba dokupiti.",
    descriptionEn: "Enter the materials, offcuts and tools you have and see which cat and dog shelters you can build and what you still need.",
    srPath: "/sr/napravi-od-onoga-sto-imas",
    enPath: "/en/build-with-what-you-have"
  });
}

export default async function BuildWithWhatYouHavePage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{isSr ? "Ponovna upotreba i ostaci" : "Reuse and offcuts"}</span>
        <h1>{isSr ? "Napravi od onoga što imaš" : "Build with what you have"}</h1>
        <p className="page-lead">
          {isSr
            ? "Šapice ne kaže „kupite ove idealne materijale”. Unesite šta imate, a rezultat pokazuje šta možete bezbedno da napravite, šta morate da dokupite i koji alat vam treba."
            : "Šapice does not say “buy these ideal materials”. Enter what you have and the result shows what you can safely build, what you still need to buy and which tools you need."}
        </p>
        <WorkshopBuilder locale={locale} entries={catalogEntries()} materials={materialOptions()} partsBySlug={sheetPartsBySlug()} />
      </div>
    </section>
  );
}
