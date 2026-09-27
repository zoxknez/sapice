"use client";

import {useState} from "react";
import type {AppLocale} from "@/i18n/routing";

export function SharePlanButton({
  locale,
  title
}: {
  locale: AppLocale;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const isSr = locale === "sr";

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({title, url});
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // User cancellation or clipboard denial should not break the page.
    }
  }

  return (
    <button type="button" className="button secondary" onClick={share}>
      {copied
        ? (isSr ? "Link kopiran" : "Link copied")
        : (isSr ? "Podeli plan" : "Share plan")}
    </button>
  );
}
