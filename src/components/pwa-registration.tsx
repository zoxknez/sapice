"use client";

import {useEffect} from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement. The application remains usable without it.
    });
  }, []);

  return null;
}
