import {Link} from "@/i18n/navigation";
import {getLocale} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";

export default async function NotFound() {
  const locale = (await getLocale()) as AppLocale;
  const isSr = locale === "sr";

  return (
    <section className="page-hero state-page">
      <div className="shell state-card">
        <span className="state-code">404</span>
        <span className="kicker">{isSr ? "Stranica nije pronađena" : "Page not found"}</span>
        <h1>{isSr ? "Ovaj plan ili stranica ne postoji." : "This plan or page does not exist."}</h1>
        <p className="page-lead">
          {isSr
            ? "Moguće je da je model preimenovan, URL pogrešno unet ili stranica više nije deo javnog kataloga."
            : "The model may have been renamed, the URL may be incorrect, or the page may no longer be part of the public catalog."}
        </p>
        <div className="hero-actions">
          <Link href="/models" locale={locale} className="button primary">
            {isSr ? "Pregledajte modele" : "Browse models"}
          </Link>
          <Link href="/finder" locale={locale} className="button secondary">
            {isSr ? "Pronađite model" : "Find a model"}
          </Link>
        </div>
      </div>
    </section>
  );
}
