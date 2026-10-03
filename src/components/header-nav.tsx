"use client";

import {useEffect, useRef} from "react";
import {Link, usePathname} from "@/i18n/navigation";

export type HeaderNavHref =
  | "/models"
  | "/finder"
  | "/build-with-what-you-have"
  | "/budget"
  | "/emergency"
  | "/guides"
  | "/materials"
  | "/retrofit"
  | "/rescue"
  | "/reuse"
  | "/methodology";
export type HeaderNavLink = readonly [HeaderNavHref, string];

function isActive(pathname: string, href: HeaderNavHref) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({links}: {links: readonly HeaderNavLink[]}) {
  const pathname = usePathname();
  return links.map(([href, label]) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={[active ? "active" : "", href === "/emergency" ? "nav-emergency" : ""].filter(Boolean).join(" ") || undefined}
      >
        {label}
      </Link>
    );
  });
}

export function MainNav({links, label}: {links: readonly HeaderNavLink[]; label: string}) {
  return (
    <nav className="main-nav" aria-label={label}>
      <NavLinks links={links} />
    </nav>
  );
}

export function MobileNav({
  links,
  label,
  openLabel
}: {
  links: readonly HeaderNavLink[];
  label: string;
  openLabel: string;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (event: Event) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
        return;
      }
      if (event.target instanceof Node && !details.contains(event.target)) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label={openLabel}>
        <span />
        <span />
        <span />
      </summary>
      <nav aria-label={label}>
        <NavLinks links={links} />
      </nav>
    </details>
  );
}
