import {getTranslations} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {LocaleSwitcher} from "./locale-switcher";

export async function SiteHeader({locale}: {locale: AppLocale}) {
  const t = await getTranslations({locale, namespace: "Nav"});

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
          <Link href="/models" locale={locale}>{t("models")}</Link>
          <Link href="/finder" locale={locale}>{t("finder")}</Link>
          <Link href="/materials" locale={locale}>{t("materials")}</Link>
          <Link href="/guides" locale={locale}>{t("guides")}</Link>
        </nav>

        <LocaleSwitcher />
      </div>
    </header>
  );
}
