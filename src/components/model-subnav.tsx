"use client";

import {useEffect, useRef, useState} from "react";
import type {AppLocale} from "@/i18n/routing";

export type ModelSubnavItem = {id: string; label: string};

export function ModelSubnav({items, locale}: {items: readonly ModelSubnavItem[]; locale: AppLocale}) {
  const isSr = locale === "sr";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // A section becomes active once its top passes a line just below the sticky header + subnav.
      const line = 170;
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top - line <= 0) current = section.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = sections[sections.length - 1].id;
      setActiveId(current);
      setShowTop(window.scrollY > window.innerHeight * 1.5);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, {passive: true});
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !activeId) return;
    const link = track.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`);
    if (!link) return;
    const left = link.offsetLeft - track.clientWidth / 2 + link.clientWidth / 2;
    track.scrollTo({left: Math.max(0, left), behavior: "smooth"});
  }, [activeId]);

  return (
    <>
      <nav className="model-subnav" aria-label={isSr ? "Sekcije modela" : "Model sections"}>
        <div className="shell" ref={trackRef}>
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeId === item.id ? "active" : undefined}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
      <a
        href="#main-content"
        className={showTop ? "back-to-top visible" : "back-to-top"}
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
        onClick={(event) => {
          event.preventDefault();
          window.scrollTo({top: 0});
          document.getElementById("main-content")?.focus({preventScroll: true});
        }}
      >
        <span aria-hidden="true">↑</span>
        <span className="sr-only">{isSr ? "Nazad na vrh" : "Back to top"}</span>
      </a>
    </>
  );
}
