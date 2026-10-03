import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {localizedMetadata} from "@/lib/seo";
import {catalogEntries, materialOptions, sheetPartNamesBySlug, sheetPartsBySlug} from "@/lib/catalog/page-data";
import {RescuePlanner} from "@/components/rescue-planner";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Serijska izrada za udruženja",
    titleEn: "Batch builds for rescue groups",
    descriptionSr: "Planer za udruženja i volontere: koliko skloništa, koliko ploča uz zajednički raspored sečenja, otpad, trošak po skloništu i po životinji.",
    descriptionEn: "A planner for rescue groups and volunteers: how many shelters, how many sheets with a shared cutting layout, waste, cost per shelter and per animal.",
    srPath: "/sr/za-udruzenja",
    enPath: "/en/rescue"
  });
}

export default async function RescuePage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";
  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{isSr ? "Udruženja i kolonije" : "Rescue groups and colonies"}</span>
        <h1>{isSr ? "Imam mnogo životinja i treba mi više kućica" : "I have many animals and need several shelters"}</h1>
        <p className="page-lead">
          {isSr
            ? "Izaberite model i broj životinja. Planer raspoređuje delove svih skloništa na zajedničke ploče, računa otpad i daje ponovljiv raspored sečenja za tim."
            : "Choose a model and the number of animals. The planner nests the parts of every shelter on shared sheets, calculates waste and gives the team a repeatable cutting schedule."}
        </p>
        <p className="section-intro">
          {isSr ? "Za veću koloniju često je bolje više manjih skloništa nego jedno preveliko. " : "For a larger colony several smaller shelters are often better than one oversized one. "}
          <Link href="/reuse">{isSr ? "Kako nabaviti materijal bez novca" : "How to source material without money"}</Link>
        </p>
        <RescuePlanner locale={locale} entries={catalogEntries()} partsBySlug={sheetPartsBySlug()} partNamesBySlug={sheetPartNamesBySlug()} materials={materialOptions()} />
      </div>
    </section>
  );
}
