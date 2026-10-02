import {getTranslations} from "next-intl/server";
import type {AppLocale} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {LocaleSwitcher} from "./locale-switcher";
import {MainNav, MobileNav, type HeaderNavLink} from "./header-nav";

export async function SiteHeader({locale}: {locale: AppLocale}) {
  const t = await getTranslations({locale, namespace: "Nav"});
  const links: HeaderNavLink[] = [
    ["/models", t("models")],
    ["/finder", t("finder")],
    ["/materials", t("materials")],
    ["/guides", t("guides")],
    ["/methodology", t("methodology")]
  ];

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" locale={locale} className="brand" aria-label="Šapice">
          <span className="brand-mark" aria-hidden="true">Š</span>
          <span>
            <strong>Šapice</strong>
            <small>{locale === "sr" ? "Projektovanje skloništa za ljubimce" : "Pet Shelter Engineering"}</small>
          </span>
        </Link>

        <MainNav links={links} label={locale === "sr" ? "Glavna navigacija" : "Main navigation"} />

        <MobileNav
          links={links}
          label={locale === "sr" ? "Mobilna navigacija" : "Mobile navigation"}
          openLabel={locale === "sr" ? "Otvori meni" : "Open menu"}
        />

        <LocaleSwitcher />
      </div>
    </header>
  );
}
