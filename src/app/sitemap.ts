import type {MetadataRoute} from "next";
import {siteUrl} from "@/lib/seo";
import {shelterModels} from "@/data/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
  const now = new Date();
  const staticSr = ["", "/modeli", "/pronadji-model", "/materijali", "/vodici", "/metodologija"];
  const staticEn = ["", "/models", "/find-model", "/materials", "/guides", "/methodology"];

  const pages: MetadataRoute.Sitemap = [
    ...staticSr.map((path) => ({
      url: `${base}/sr${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8
    })),
    ...staticEn.map((path) => ({
      url: `${base}/en${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8
    }))
  ];

  for (const model of shelterModels) {
    pages.push(
      {
        url: `${base}/sr/modeli/${model.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.9
      },
      {
        url: `${base}/en/models/${model.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.9
      }
    );
  }

  return pages;
}
