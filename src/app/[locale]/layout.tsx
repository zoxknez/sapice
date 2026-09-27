import type {Metadata} from "next";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {SiteHeader} from "@/components/site-header";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Šapice · Pet Shelter Engineering",
    template: "%s · Šapice"
  },
  description: "Bilingual engineering plans for winter cat and dog shelters."
};

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
        <NextIntlClientProvider>
          <SiteHeader locale={locale as AppLocale} />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="shell footer-grid">
              <div>
                <strong>Šapice</strong>
                <p>Open pet shelter engineering.</p>
              </div>
              <p>© 2026 · SR / EN · Versioned models, transparent calculations.</p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
