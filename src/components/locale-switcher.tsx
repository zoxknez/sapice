"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "sr" ? "en" : "sr";

  return (
    <button
      type="button"
      className="locale-switch"
      onClick={() => router.replace(pathname, {locale: nextLocale})}
      aria-label={locale === "sr" ? "Switch to English" : "Prebaci na srpski"}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
