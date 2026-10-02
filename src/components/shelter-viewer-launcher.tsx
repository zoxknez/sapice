"use client";

import dynamic from "next/dynamic";
import {useLocale} from "next-intl";
import {useState, type ReactNode} from "react";
import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import styles from "./shelter-viewer-launcher.module.css";

const InteractiveShelterViewer = dynamic(
  () => import("@/components/shelter-viewer").then((module) => module.ShelterViewer),
  {
    ssr: false,
    loading: () => <ViewerLoading />
  }
);

function ViewerLoading() {
  const isSr = useLocale() === "sr";
  return (
    <div className="viewer viewer-loading" role="status">
      <span className="viewer-spinner" aria-hidden="true" />
      {isSr ? "Učitavanje 3D prikaza…" : "Loading 3D viewer…"}
    </div>
  );
}

export function ShelterViewerLauncher({
  compiled,
  locale,
  children
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
  children: ReactNode;
}) {
  const [requested, setRequested] = useState(false);
  const isSr = locale === "sr";

  if (requested) {
    return <InteractiveShelterViewer compiled={compiled} locale={locale} />;
  }

  return (
    <div className={`viewer viewer-launcher ${styles.launcher}`}>
      {/* The preview is an extra pointer target; keyboard and screen-reader users use the launch button. */}
      <div
        className={`viewer-launcher-preview ${styles.preview}`}
        onClick={() => setRequested(true)}
        title={isSr ? "Pokreni interaktivni 3D prikaz" : "Open interactive 3D view"}
      >
        {children}
      </div>
      <div className={`viewer-launcher-copy ${styles.copy}`}>
        <div className={styles.copyContent}>
          <span className={`kicker ${styles.copyKicker}`}>{isSr ? "3D pregled na zahtev" : "3D preview on demand"}</span>
          <p className={styles.description}>
            {isSr
              ? "Pokreni interaktivni prikaz da pregledaš konstrukciju iz različitih uglova."
              : "Open the interactive view to inspect the construction from different angles."}
          </p>
        </div>
        <button className={styles.launchButton} type="button" onClick={() => setRequested(true)}>
          {isSr ? "Pokreni interaktivni 3D prikaz" : "Open interactive 3D view"}
        </button>
      </div>
    </div>
  );
}
