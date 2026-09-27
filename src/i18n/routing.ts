import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sr", "en"],
  defaultLocale: "sr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/models": {sr: "/modeli", en: "/models"},
    "/models/[slug]": {sr: "/modeli/[slug]", en: "/models/[slug]"},
    "/finder": {sr: "/pronadji-model", en: "/find-model"},
    "/materials": {sr: "/materijali", en: "/materials"},
    "/guides": {sr: "/vodici", en: "/guides"}
  }
});

export type AppLocale = (typeof routing.locales)[number];
