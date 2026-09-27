import type {Metadata} from "next";
import type {AppLocale} from "@/i18n/routing";

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

  return {
    title,
    description,
    alternates: {
      canonical: locale === "sr" ? srPath : enPath,
      languages: {
        "sr-Latn": srPath,
        en: enPath,
        "x-default": srPath
      }
    },
    openGraph: {
      type: "website",
      title,
      description,
      locale: locale === "sr" ? "sr_RS" : "en_US",
      alternateLocale: locale === "sr" ? ["en_US"] : ["sr_RS"]
    }
  };
}
