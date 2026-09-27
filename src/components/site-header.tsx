import {getTranslations} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {LocaleSwitcher} from "./locale-switcher";

export async function SiteHeader({locale}: {locale: AppLocale}) {
  const t = await getTranslations({locale, namespace: "Nav"});
  const links = [
    ["/models", t("models")],
    ["/finder", t("finder")],
    ["/materials", t("materials")],
    ["/guides", t("guides")]
  ] as const;

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" locale={locale} className="brand" aria-label="Šapice">
          <span className="brand-mark" aria-hidden="true">Š</span>
          <span>
            <strong>Šapice</strong>
            <small>Pet Shelter Engineering</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label={locale === "sr" ? "Glavna navigacija" : "Main navigation"}>
          {links.map(([href, label]) => <Link key={href} href={href} locale={locale}>{label}</Link>)}
        </nav>

        <details className="mobile-nav">
          <summary aria-label={locale === "sr" ? "Otvori meni" : "Open menu"}>
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label={locale === "sr" ? "Mobilna navigacija" : "Mobile navigation"}>
            {links.map(([href, label]) => <Link key={href} href={href} locale={locale}>{label}</Link>)}
          </nav>
        </details>

        <LocaleSwitcher />
      </div>
    </header>
  );
}
