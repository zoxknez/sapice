import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {landingTopicBySlug, landingTopics} from "@/data/landing-topics";
import {catalogEntries} from "@/lib/catalog/entries";
import {engineeredThumbnails} from "@/lib/catalog/page-data";
import {CatalogCard} from "@/components/catalog/catalog-card";
import {StructuredData} from "@/components/structured-data";
import {sources} from "@/data/sources";
import {openGraphLocale, siteUrl} from "@/lib/seo";

export function generateStaticParams({params}: {params: {locale: string}}) {
  return landingTopics.map((topic) => ({topic: params.locale === "en" ? topic.slugEn : topic.slugSr}));
}

export async function generateMetadata({params}: {params: Promise<{locale: AppLocale; topic: string}>}): Promise<Metadata> {
  const {locale, topic: slug} = await params;
  const topic = landingTopicBySlug(slug, locale);
  if (!topic) return {};
  const srPath = `/sr/planovi/${topic.slugSr}`;
  const enPath = `/en/plans/${topic.slugEn}`;
  const title = locale === "sr" ? topic.titleSr : topic.titleEn;
  const description = locale === "sr" ? topic.leadSr : topic.leadEn;
  return {
    title,
    description,
    alternates: {canonical: locale === "sr" ? srPath : enPath, languages: {"sr-Latn": srPath, en: enPath, "x-default": srPath}},
    openGraph: {type: "article", siteName: "Šapice", url: locale === "sr" ? srPath : enPath, title: `${title} · Šapice`, description, ...openGraphLocale(locale)},
    twitter: {card: "summary_large_image", title: `${title} · Šapice`, description}
  };
}

const toolHref = {
  finder: "/finder",
  emergency: "/emergency",
  budget: "/budget",
  "build-with-what-you-have": "/build-with-what-you-have",
  rescue: "/rescue",
  reuse: "/reuse",
  retrofit: "/retrofit"
} as const;

export default async function TopicPage({params}: {params: Promise<{locale: AppLocale; topic: string}>}) {
  const {locale: routeLocale, topic: slug} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  setRequestLocale(locale);
  const topic = landingTopicBySlug(slug, locale);
  if (!topic) notFound();
  const isSr = locale === "sr";
  const entries = catalogEntries().filter(topic.select);
  const thumbnails = engineeredThumbnails();
  const title = isSr ? topic.titleSr : topic.titleEn;
  const related = landingTopics.filter((item) => item.id !== topic.id).slice(0, 6);

  return (
    <article className="page-hero topic-page">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description: isSr ? topic.leadSr : topic.leadEn,
        inLanguage: isSr ? "sr-Latn" : "en",
        url: `${siteUrl}/${locale}/${isSr ? "planovi" : "plans"}/${isSr ? topic.slugSr : topic.slugEn}`,
        hasPart: entries.map((entry) => ({"@type": "HowTo", name: isSr ? entry.nameSr : entry.nameEn, url: `${siteUrl}/${locale}/${isSr ? "modeli" : "models"}/${entry.slug}`}))
      }} />
      <div className="shell">
        <span className="kicker">{isSr ? "Planovi" : "Plans"}</span>
        <h1>{title}</h1>
        <p className="page-lead">{isSr ? topic.leadSr : topic.leadEn}</p>

        <div className="topic-points">
          <ul className="plain-list">
            {(isSr ? topic.pointsSr : topic.pointsEn).map((point) => <li key={point}>{point}</li>)}
          </ul>
          <div className="topic-sources">
            <strong>{isSr ? "Izvori" : "Sources"}</strong>
            <ul>
              {topic.sourceIds.map((id) => sources[id]).filter(Boolean).map((source) => (
                <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher} · {source.title}</a></li>
              ))}
            </ul>
            <Link href={toolHref[topic.tool]} className="button primary">
              {{
                finder: isSr ? "Pronađi model" : "Find a model",
                emergency: isSr ? "Treba mi odmah" : "I need it now",
                budget: isSr ? "Izračunaj budžet" : "Work out a budget",
                "build-with-what-you-have": isSr ? "Napravi od onoga što imaš" : "Build with what you have",
                rescue: isSr ? "Planer za udruženja" : "Rescue planner",
                reuse: isSr ? "Provera iskorišćenog materijala" : "Reused material check",
                retrofit: isSr ? "Unapredi kućicu" : "Improve a house"
              }[topic.tool]}
            </Link>
          </div>
        </div>

        <h2 className="topic-count">{entries.length} {isSr ? "modela iz kataloga" : "catalog models"}</h2>
        <div className="model-grid">
          {entries.map((entry) => <CatalogCard key={entry.id} entry={entry} locale={locale} engineered={thumbnails[entry.slug]} />)}
        </div>

        <nav className="topic-related" aria-label={isSr ? "Srodne teme" : "Related topics"}>
          <strong>{isSr ? "Srodne teme" : "Related topics"}</strong>
          <ul>
            {related.map((item) => (
              <li key={item.id}>
                <Link href={{pathname: "/plans/[topic]", params: {topic: isSr ? item.slugSr : item.slugEn}}}>{isSr ? item.titleSr : item.titleEn}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </article>
  );
}
