"use client";

import {useLocale} from "next-intl";
import type {AppLocale} from "@/i18n/routing";

const routePairs = [
  ["/modeli", "/models"],
  ["/pronadji-model", "/find-model"],
  ["/materijali", "/materials"],
  ["/vodici", "/guides"],
  ["/metodologija", "/methodology"]
] as const;

export function switchLocalePath(pathname: string, from: AppLocale, to: AppLocale) {
  const fromPrefix = `/${from}`;
  const toPrefix = `/${to}`;
  const withoutLocale = pathname.startsWith(fromPrefix)
    ? pathname.slice(fromPrefix.length) || "/"
    : pathname;

  if (withoutLocale === "/") return toPrefix;

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
  const nextLocale: AppLocale = locale === "sr" ? "en" : "sr";

  return (
    <button
      type="button"
      className="locale-switch"
      onClick={() => {
        const nextPath = switchLocalePath(window.location.pathname, locale, nextLocale);
        window.location.assign(`${nextPath}${window.location.search}${window.location.hash}`);
      }}
      aria-label={locale === "sr" ? "Switch to English" : "Prebaci na srpski"}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
