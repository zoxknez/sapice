import type {MetadataRoute} from "next";
import {siteUrl} from "@/lib/seo";
import {shelterModels} from "@/data/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
  const staticSr = ["", "/modeli", "/pronadji-model", "/materijali", "/vodici", "/metodologija"];
  const staticEn = ["", "/models", "/find-model", "/materials", "/guides", "/methodology"];

  const pages: MetadataRoute.Sitemap = [
    ...staticSr.map((path) => ({
      url: `${base}/sr${path}`
    })),
    ...staticEn.map((path) => ({
      url: `${base}/en${path}`
    }))
  ];

  for (const model of shelterModels) {
    pages.push(
      {
        url: `${base}/sr/modeli/${model.slug}`
      },
      {
        url: `${base}/en/models/${model.slug}`
      }
    );
  }

  return pages;
}
