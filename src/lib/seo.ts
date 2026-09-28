import type {Metadata} from "next";
import type {AppLocale} from "@/i18n/routing";

const productionSiteUrl = "https://www.sapice.space";

export function resolveSiteUrl({
  publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment = process.env.NODE_ENV
}: {
  publicSiteUrl?: string | null;
  environment?: string;
} = {}): string {
  return (
    publicSiteUrl ??
    (environment === "production" ? productionSiteUrl : "http://localhost:3000")
  ).replace(/\/+$/, "");
}

export const siteUrl = resolveSiteUrl();

type SocialImage = {url: string; width: number; height: number; type: string; alt: string};

export function socialImage(locale: AppLocale): SocialImage {
  return {
    url: "/og/sapice-og.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: locale === "sr"
      ? "Šapice: drvena zimska kućica sa psom i mačkom, tehnički crtež i lista materijala"
      : "Šapice: wooden winter shelter with a dog and a cat, technical drawing and materials list"
  };
}

export function openGraphLocale(locale: AppLocale) {
  return {
    locale: locale === "sr" ? "sr_RS" : "en_US",
    alternateLocale: locale === "sr" ? ["en_US"] : ["sr_RS"]
  };
}

export function localizedMetadata({
  locale,
  titleSr,
  titleEn,
  descriptionSr,
  descriptionEn,
  srPath,
  enPath
}: {
  locale: AppLocale;
  titleSr: string;
  titleEn: string;
  descriptionSr: string;
  descriptionEn: string;
  srPath: string;
  enPath: string;
}): Metadata {
  const title = locale === "sr" ? titleSr : titleEn;
  const description = locale === "sr" ? descriptionSr : descriptionEn;
  const canonical = locale === "sr" ? srPath : enPath;
  const image = socialImage(locale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "sr-Latn": srPath,
        en: enPath,
        "x-default": srPath
      }
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Šapice`,
      description,
      images: [image]
    },
    openGraph: {
      type: "website",
      siteName: "Šapice",
      url: canonical,
      title: `${title} · Šapice`,
      description,
      images: [image],
      ...openGraphLocale(locale)
    }
  };
}
