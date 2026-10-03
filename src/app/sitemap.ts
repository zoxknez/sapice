import type {MetadataRoute} from "next";
import {siteUrl} from "@/lib/seo";
import {shelterModels} from "@/data/models";
import {practicalModels} from "@/data/practical-models";
import {landingTopics} from "@/data/landing-topics";

const staticPairs: Array<[string, string]> = [
  ["", ""],
  ["/modeli", "/models"],
  ["/pronadji-model", "/find-model"],
  ["/hitno", "/emergency"],
  ["/napravi-od-onoga-sto-imas", "/build-with-what-you-have"],
  ["/budzet", "/budget"],
  ["/unapredi-kucicu", "/retrofit"],
  ["/za-udruzenja", "/rescue"],
  ["/ponovna-upotreba", "/reuse"],
  ["/materijali", "/materials"],
  ["/vodici", "/guides"],
  ["/metodologija", "/methodology"]
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
  const pages: MetadataRoute.Sitemap = staticPairs.flatMap(([sr, en]) => [
    {url: `${base}/sr${sr}`, alternates: {languages: {"sr-Latn": `${base}/sr${sr}`, en: `${base}/en${en}`}}},
    {url: `${base}/en${en}`, alternates: {languages: {"sr-Latn": `${base}/sr${sr}`, en: `${base}/en${en}`}}}
  ]);

  for (const model of [...shelterModels, ...practicalModels]) {
    const sr = `${base}/sr/modeli/${model.slug}`;
    const en = `${base}/en/models/${model.slug}`;
    pages.push({url: sr, alternates: {languages: {"sr-Latn": sr, en}}}, {url: en, alternates: {languages: {"sr-Latn": sr, en}}});
  }

  for (const topic of landingTopics) {
    const sr = `${base}/sr/planovi/${topic.slugSr}`;
    const en = `${base}/en/plans/${topic.slugEn}`;
    pages.push({url: sr, alternates: {languages: {"sr-Latn": sr, en}}}, {url: en, alternates: {languages: {"sr-Latn": sr, en}}});
  }

  return pages;
}
