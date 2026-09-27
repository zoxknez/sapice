import type {MetadataRoute} from "next";
import {shelterModels} from "@/data/models";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  const staticSr = ["", "/modeli", "/pronadji-model", "/materijali", "/vodici"];
  const staticEn = ["", "/models", "/find-model", "/materials", "/guides"];

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
