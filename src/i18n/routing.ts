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
    "/guides": {sr: "/vodici", en: "/guides"},
    "/methodology": {sr: "/metodologija", en: "/methodology"},
    "/emergency": {sr: "/hitno", en: "/emergency"},
    "/build-with-what-you-have": {sr: "/napravi-od-onoga-sto-imas", en: "/build-with-what-you-have"},
    "/budget": {sr: "/budzet", en: "/budget"},
    "/retrofit": {sr: "/unapredi-kucicu", en: "/retrofit"},
    "/rescue": {sr: "/za-udruzenja", en: "/rescue"},
    "/reuse": {sr: "/ponovna-upotreba", en: "/reuse"},
    "/plans/[topic]": {sr: "/planovi/[topic]", en: "/plans/[topic]"},
    "/offline": "/offline"
  }
});

export type AppLocale = (typeof routing.locales)[number];
