import type {Metadata, Viewport} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {SiteHeader} from "@/components/site-header";
import {PwaRegistration} from "@/components/pwa-registration";
import {openGraphLocale, siteUrl, socialImage} from "@/lib/seo";
import "../globals.css";

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
  const {locale: routeLocale} = await params;
  const locale: AppLocale = routeLocale === "en" ? "en" : "sr";
  const isSr = locale === "sr";
  const title = isSr ? "Šapice · Planiranje kućica za pse i mačke" : "Šapice · Winter shelter plans for cats and dogs";
  const description = isSr
    ? "SR/EN tehnički planovi zimskih kućica i skloništa za pse i mačke: 3D, mere, materijali, krojna lista i transparentni proračuni."
    : "Bilingual engineering plans for winter cat and dog shelters with 3D, dimensions, materials, cut lists and transparent calculations.";
  const socialDescription = isSr
    ? "Modeli, materijali, 3D prikaz i vodiči za izradu zimskih kućica za pse i mačke."
    : "Models, materials, 3D previews and build guides for winter cat and dog shelters.";
  const image = socialImage(locale);

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Šapice",
    manifest: isSr ? "/manifest-sr.webmanifest" : "/manifest-en.webmanifest",
    title: {
      default: title,
      template: "%s · Šapice"
    },
    description,
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
      title,
      description: socialDescription,
      images: [image]
    },
    openGraph: {
      type: "website",
      siteName: "Šapice",
      url: `/${locale}`,
      title,
      description: socialDescription,
      images: [image],
      ...openGraphLocale(locale)
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
          <PwaRegistration locale={locale as AppLocale} />
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
