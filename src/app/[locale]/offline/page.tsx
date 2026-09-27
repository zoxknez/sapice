import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function OfflinePage({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <section className="page-hero offline-page">
      <div className="shell">
        <span className="kicker">Offline</span>
        <h1>{locale === "sr" ? "Trenutno nema mreže" : "You are currently offline"}</h1>
        <p className="page-lead">
          {locale === "sr"
            ? "Već otvoreni modeli mogu ostati dostupni iz lokalnog keša. Za stranicu koju ovaj uređaj još nije otvorio potrebna je internet veza."
            : "Previously opened models may remain available from the local cache. A connection is required for pages this device has not opened yet."}
        </p>
        <Link href="/" locale={locale} className="button primary">
          {locale === "sr" ? "Početna strana" : "Home"}
        </Link>
      </div>
    </section>
  );
}
