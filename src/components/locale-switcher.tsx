"use client";

import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import type {AppLocale} from "@/i18n/routing";
import {landingSlugPairs} from "@/data/landing-slugs";

const routePairs = [
  ["/modeli", "/models"],
  ["/pronadji-model", "/find-model"],
  ["/materijali", "/materials"],
  ["/vodici", "/guides"],
  ["/metodologija", "/methodology"],
  ["/hitno", "/emergency"],
  ["/napravi-od-onoga-sto-imas", "/build-with-what-you-have"],
  ["/budzet", "/budget"],
  ["/unapredi-kucicu", "/retrofit"],
  ["/za-udruzenja", "/rescue"],
  ["/ponovna-upotreba", "/reuse"]
] as const;

function switchTopicPath(withoutLocale: string, from: AppLocale, to: AppLocale) {
  const fromBase = from === "sr" ? "/planovi/" : "/plans/";
  if (!withoutLocale.startsWith(fromBase)) return null;
  const slug = withoutLocale.slice(fromBase.length).split("/")[0];
  const pair = landingSlugPairs.find(([sr, en]) => (from === "sr" ? sr : en) === slug);
  const toBase = to === "sr" ? "/planovi/" : "/plans/";
  return `${toBase}${pair ? (to === "sr" ? pair[0] : pair[1]) : slug}`;
}

export function switchLocalePath(pathname: string, from: AppLocale, to: AppLocale) {
  const fromPrefix = `/${from}`;
  const toPrefix = `/${to}`;
  const withoutLocale = pathname.startsWith(fromPrefix)
    ? pathname.slice(fromPrefix.length) || "/"
    : pathname;

  if (withoutLocale === "/") return toPrefix;

  const topic = switchTopicPath(withoutLocale, from, to);
  if (topic) return `${toPrefix}${topic}`;

  for (const [srPath, enPath] of routePairs) {
    const source = from === "sr" ? srPath : enPath;
    const target = to === "sr" ? srPath : enPath;

    if (withoutLocale === source) {
      return `${toPrefix}${target}`;
    }

    if (withoutLocale.startsWith(`${source}/`)) {
      return `${toPrefix}${target}${withoutLocale.slice(source.length)}`;
    }
  }

  return `${toPrefix}${withoutLocale}`;
}

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const nextLocale: AppLocale = locale === "sr" ? "en" : "sr";

  return (
    <button
      type="button"
      className="locale-switch"
      onClick={() => {
        const nextPath = switchLocalePath(window.location.pathname, locale, nextLocale);
        router.replace(`${nextPath}${window.location.search}${window.location.hash}`);
      }}
      aria-label={locale === "sr" ? "Switch to English" : "Prebaci na srpski"}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
