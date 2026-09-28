"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";

export function PwaRegistration({locale}: {locale: AppLocale}) {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const syncConnectionState = () => {
      setIsOffline(!navigator.onLine);
      setDismissed(false);
    };

    syncConnectionState();
    window.addEventListener("offline", syncConnectionState);
    window.addEventListener("online", syncConnectionState);

    return () => {
      window.removeEventListener("offline", syncConnectionState);
      window.removeEventListener("online", syncConnectionState);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement. The application remains usable without it.
    });
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div className="offline-status" role="status" aria-live="polite">
      <span>
        {locale === "sr"
          ? "Deluje da ste van mreže. Trenutna stranica ostaje dostupna; povežite se za najnovije izmene."
          : "You appear to be offline. This page remains available; reconnect to get the latest changes."}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={locale === "sr" ? "Zatvori poruku o vezi" : "Dismiss connection message"}
      >
        ×
      </button>
    </div>
  );
}
