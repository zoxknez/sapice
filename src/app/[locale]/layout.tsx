import type {Metadata, Viewport} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {SiteHeader} from "@/components/site-header";
import {PwaRegistration} from "@/components/pwa-registration";
import {Link} from "@/i18n/navigation";
import {openGraphLocale, siteUrl, socialImage} from "@/lib/seo";
import {Analytics} from "@vercel/analytics/next";
import "../globals.css";
import "../platform.css";
import "../platform-pages.css";

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
          <main id="main-content" tabIndex={-1}>{children}</main>
          <footer className="site-footer">
            <div className="shell footer-grid">
              <div className="footer-brand">
                <strong>Šapice</strong>
                <p>{locale === "sr" ? "Otvoreno inženjersko projektovanje kućica za ljubimce." : "Open pet shelter engineering."}</p>
                <p className="footer-note">
                  {locale === "sr"
                    ? "Bez AI generisanja planova. Svaki plan je vezan za verziju modela, verziju kompajlera i ID plana."
                    : "No AI plan generation. Every plan is tied to a model version, compiler version and plan ID."}
                </p>
              </div>
              <nav className="footer-nav" aria-label={locale === "sr" ? "Navigacija u podnožju" : "Footer navigation"}>
                <div>
                  <span>{locale === "sr" ? "Planovi" : "Plans"}</span>
                  <Link href="/models" locale={locale as AppLocale}>{locale === "sr" ? "Modeli" : "Models"}</Link>
                  <Link href="/finder" locale={locale as AppLocale}>{locale === "sr" ? "Pronađi model" : "Find a model"}</Link>
                  <Link href="/emergency" locale={locale as AppLocale}>{locale === "sr" ? "Hitno sklonište" : "Emergency shelter"}</Link>
                  <Link href="/build-with-what-you-have" locale={locale as AppLocale}>{locale === "sr" ? "Imam materijal" : "Build with what you have"}</Link>
                  <Link href="/budget" locale={locale as AppLocale}>{locale === "sr" ? "Budžet" : "Budget builds"}</Link>
                </div>
                <div>
                  <span>{locale === "sr" ? "Alati" : "Tools"}</span>
                  <Link href="/retrofit" locale={locale as AppLocale}>{locale === "sr" ? "Unapredi kućicu" : "Improve a house"}</Link>
                  <Link href="/rescue" locale={locale as AppLocale}>{locale === "sr" ? "Za udruženja" : "Rescue & batches"}</Link>
                  <Link href="/reuse" locale={locale as AppLocale}>{locale === "sr" ? "Ponovna upotreba" : "Reuse & pallets"}</Link>
                </div>
                <div>
                  <span>{locale === "sr" ? "Znanje" : "Knowledge"}</span>
                  <Link href="/guides" locale={locale as AppLocale}>{locale === "sr" ? "Vodiči" : "Guides"}</Link>
                  <Link href="/materials" locale={locale as AppLocale}>{locale === "sr" ? "Materijali" : "Materials"}</Link>
                  <Link href="/methodology" locale={locale as AppLocale}>{locale === "sr" ? "Metodologija" : "Methodology"}</Link>
                  <a href="https://github.com/zoxknez/sapice" target="_blank" rel="noreferrer">GitHub</a>
                </div>
              </nav>
              <p className="footer-legal">© 2026 · SR / EN · {locale === "sr" ? "Modeli sa verzijama, transparentni proračuni." : "Versioned models, transparent calculations."}</p>
            </div>
          </footer>
        </NextIntlClientProvider>
        {/* The insights script is served only on Vercel; elsewhere it would 404 and log console errors. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
