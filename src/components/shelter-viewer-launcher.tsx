"use client";

import dynamic from "next/dynamic";
import {useState, type ReactNode} from "react";
import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

const InteractiveShelterViewer = dynamic(
  () => import("@/components/shelter-viewer").then((module) => module.ShelterViewer),
  {
    ssr: false,
    loading: () => (
      <div className="viewer viewer-loading" role="status">
        Učitavanje / Loading 3D viewer…
      </div>
    )
  }
);

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
    <div className="viewer viewer-launcher">
      <div className="viewer-launcher-preview">{children}</div>
      <div className="viewer-launcher-copy">
        <div>
          <span className="kicker">{isSr ? "3D pregled na zahtev" : "3D preview on demand"}</span>
          <p>
            {isSr
              ? "Pokreni interaktivni prikaz da pregledaš konstrukciju iz različitih uglova."
              : "Open the interactive view to inspect the construction from different angles."}
          </p>
        </div>
        <button type="button" onClick={() => setRequested(true)}>
          {isSr ? "Pokreni interaktivni 3D prikaz" : "Open interactive 3D view"}
        </button>
      </div>
    </div>
  );
}
