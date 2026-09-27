import type {Metadata, Viewport} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {SiteHeader} from "@/components/site-header";
import {PwaRegistration} from "@/components/pwa-registration";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f2eb",
  colorScheme: "light"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const isSr = locale === "sr";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: isSr ? "Šapice · Tehnički planovi kućica za pse i mačke" : "Šapice · Pet Shelter Engineering",
      template: "%s · Šapice"
    },
    description: isSr
      ? "SR/EN tehnički planovi zimskih kućica i skloništa za pse i mačke: 3D, mere, materijali, krojna lista i transparentni proračuni."
      : "Bilingual engineering plans for winter cat and dog shelters with 3D, dimensions, materials, cut lists and transparent calculations.",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "sr-Latn": "/sr",
        en: "/en",
        "x-default": "/sr"
      }
    },
    twitter: {
      card: "summary_large_image",
      title: isSr ? "Šapice · Tehnički planovi kućica za pse i mačke" : "Šapice · Pet Shelter Engineering",
      description: isSr
        ? "Praktični, unapred projektovani modeli zimskih skloništa za pse i mačke."
        : "Practical pre-designed winter shelter models for cats and dogs."
    },
    openGraph: {
      type: "website",
      siteName: "Šapice",
      locale: isSr ? "sr_RS" : "en_US",
      alternateLocale: isSr ? ["en_US"] : ["sr_RS"],
      title: isSr ? "Šapice · Tehnički planovi kućica za pse i mačke" : "Šapice · Pet Shelter Engineering",
      description: isSr
        ? "Praktični, unapred projektovani modeli zimskih skloništa za pse i mačke."
        : "Practical pre-designed winter shelter models for cats and dogs."
    }
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale === "sr" ? "sr-Latn" : "en"}>
      <body>
        <a className="skip-link" href="#main-content">
          {locale === "sr" ? "Preskoči na sadržaj" : "Skip to content"}
        </a>
        <NextIntlClientProvider>
          <PwaRegistration />
          <SiteHeader locale={locale as AppLocale} />
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <div className="shell footer-grid">
              <div>
                <strong>Šapice</strong>
                <p>Open pet shelter engineering.</p>
              </div>
              <nav className="footer-nav" aria-label={locale === "sr" ? "Footer navigacija" : "Footer navigation"}>
                <a href={`/${locale}/${locale === "sr" ? "metodologija" : "methodology"}`}>
                  {locale === "sr" ? "Metodologija" : "Methodology"}
                </a>
                <a href="https://github.com/zoxknez/sapice" target="_blank" rel="noreferrer">GitHub</a>
              </nav>
              <p>© 2026 · SR / EN · Versioned models, transparent calculations.</p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
