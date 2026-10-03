import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {localizedMetadata} from "@/lib/seo";
import {catalogEntries, materialOptions} from "@/lib/catalog/page-data";
import {BudgetBuilder, type UpgradeHint} from "@/components/budget-builder";
import {upgradeEdges} from "@/data/upgrades";
import {catalogEntry} from "@/lib/catalog/entries";
import {taxonomyLabel, budgetClassValues} from "@/lib/catalog/taxonomy";

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale}>}): Promise<Metadata> {
  const {locale} = await params;
  return localizedMetadata({
    locale,
    titleSr: "Budžetska skloništa",
    titleEn: "Budget shelter builds",
    descriptionSr: "Skloništa za mačke i pse prema iznosu koji imate, sa vašim cenama materijala, troškom po skloništu i po životinji i putanjom nadogradnje.",
    descriptionEn: "Cat and dog shelters for the amount you have, using your own material prices, with cost per shelter and per animal and an upgrade path.",
    srPath: "/sr/budzet",
    enPath: "/en/budget"
  });
}

export default async function BudgetPage({params}: {params: Promise<{locale: AppLocale}>}) {
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const isSr = locale === "sr";
  const upgrades: Record<string, UpgradeHint> = {};
  for (const edge of upgradeEdges) {
    if (upgrades[edge.from]) continue;
    const target = edge.to ? catalogEntry(edge.to) : null;
    upgrades[edge.from] = {from: edge.from, to: edge.to, nameSr: target?.nameSr ?? edge.addsSr, nameEn: target?.nameEn ?? edge.addsEn};
  }

  return (
    <section className="page-hero">
      <div className="shell">
        <span className="kicker">{isSr ? "Budžet" : "Budget"}</span>
        <h1>{isSr ? "Imam određeni budžet" : "I have a set budget"}</h1>
        <p className="page-lead">
          {isSr
            ? "Izaberite iznos i unesite cene koje stvarno plaćate. Rezultat pokazuje šta staje u budžet, šta prelazi i gde nedostaju cene da bi se to znalo."
            : "Choose an amount and enter the prices you actually pay. The result shows what fits, what goes over and where prices are missing to know."}
        </p>
        <ol className="budget-scale" aria-label={isSr ? "Klase troška" : "Cost classes"}>
          {budgetClassValues.map((value) => <li key={value}>{taxonomyLabel("budgetClass", value, locale)}</li>)}
        </ol>
        <BudgetBuilder locale={locale} entries={catalogEntries()} materials={materialOptions()} upgrades={upgrades} />
      </div>
    </section>
  );
}
