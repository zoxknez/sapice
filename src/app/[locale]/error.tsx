"use client";

import {useEffect} from "react";
import {useLocale} from "next-intl";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  const locale = useLocale();
  const isSr = locale === "sr";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="page-hero state-page">
      <div className="shell state-card">
        <span className="state-code">!</span>
        <span className="kicker">{isSr ? "Greška prikaza" : "Display error"}</span>
        <h1>{isSr ? "Ovaj prikaz trenutno nije moguće otvoriti." : "This view cannot be opened right now."}</h1>
        <p className="page-lead">
          {isSr
            ? "Podaci u browseru nisu menjani. Možete ponoviti prikaz ili se vratiti na prethodnu stranicu."
            : "Browser data has not been changed. You can retry the view or return to the previous page."}
        </p>
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={reset}>
            {isSr ? "Pokušaj ponovo" : "Try again"}
          </button>
          <button type="button" className="button secondary" onClick={() => window.history.back()}>
            {isSr ? "Nazad" : "Back"}
          </button>
        </div>
        {error.digest && <small className="error-digest">Ref: {error.digest}</small>}
      </div>
    </section>
  );
}
